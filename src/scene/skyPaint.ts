import { getPhase, samplePalette, sunDirection } from './dayNight'

type Star = {
  x: number
  y: number
  r: number
  b: number
  tw: number
  ph: number
  glint: boolean
}

const STARS: Star[] = makeStars(280)

function makeStars(count: number): Star[] {
  const stars: Star[] = []
  let seed = 17
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  for (let i = 0; i < count; i++) {
    const glint = i < 16 || rand() > 0.92
    const y = rand() < 0.58 ? rand() ** 1.25 * 0.38 : 0.16 + rand() * 0.5
    stars.push({
      x: rand(),
      y,
      r: glint ? 1.2 + rand() * 1.5 : 0.6 + rand() ** 2 * 1.0,
      b: glint ? 0.78 + rand() * 0.22 : 0.38 + rand() * 0.5,
      tw: 0.5 + rand() * 2.2,
      ph: rand() * Math.PI * 2,
      glint,
    })
  }
  return stars
}

function hexRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgba(hex: string, a: number): string {
  const [r, g, b] = hexRgb(hex)
  return `rgba(${r},${g},${b},${a})`
}

function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexRgb(a)
  const [br, bg, bb] = hexRgb(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`
}

export function paintDynamicSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time = performance.now() / 1000,
) {
  const palette = samplePalette(getPhase())
  const sun = sunDirection(palette)
  const breathe = 0.5 + 0.5 * Math.sin(time * 0.16)
  const zenith = palette.skyZenith
  const horizon = palette.skyHorizon
  const glow = palette.skyGlow
  const unit = Math.max(1, w / 1920)

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  const band = ctx.createLinearGradient(0, 0, 0, h)
  band.addColorStop(0, zenith)
  band.addColorStop(0.12, mixHex(zenith, horizon, 0.16))
  band.addColorStop(0.3, mixHex(zenith, horizon, 0.38 + breathe * 0.04))
  band.addColorStop(0.52, mixHex(zenith, horizon, 0.72))
  band.addColorStop(0.7, mixHex(horizon, glow, 0.22))
  band.addColorStop(0.86, mixHex(horizon, glow, 0.62))
  band.addColorStop(1, glow)
  ctx.fillStyle = band
  ctx.fillRect(0, 0, w, h)

  const hx = w * (0.5 + sun[0] * 0.1)
  const horizonBloom = ctx.createRadialGradient(hx, h * 1.08, 0, hx, h * 1.08, Math.max(w, h) * 0.78)
  horizonBloom.addColorStop(0, rgba(glow, 0.48))
  horizonBloom.addColorStop(0.45, rgba(glow, 0.14))
  horizonBloom.addColorStop(1, rgba(glow, 0))
  ctx.fillStyle = horizonBloom
  ctx.fillRect(0, 0, w, h)

  const sunX = w * (0.5 + sun[0] * 0.34)
  const sunY = h * (1 - (0.08 + Math.max(0, sun[1]) * 0.56))
  const sunR = Math.max(w, h) * (0.2 + palette.sunIntensity * 0.07)
  const disc = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR)
  disc.addColorStop(0, rgba(palette.sunColor, Math.min(0.9, 0.22 + palette.sunIntensity * 0.2)))
  disc.addColorStop(0.1, rgba(palette.sunColor, 0.28 * palette.sunIntensity))
  disc.addColorStop(0.36, rgba(glow, 0.12 * palette.sunIntensity))
  disc.addColorStop(1, rgba(palette.sunColor, 0))
  ctx.fillStyle = disc
  ctx.fillRect(0, 0, w, h)

  const cloudAmt = (1 - palette.starOpacity) * 0.09
  if (cloudAmt > 0.02) {
    ctx.save()
    for (let i = 0; i < 2; i++) {
      const cx = w * (0.28 + i * 0.4 + Math.sin(time * 0.025 + i * 2.1) * 0.05)
      const cy = h * (0.58 + i * 0.08 + Math.sin(time * 0.03 + i) * 0.03)
      const cw = w * 0.38
      const cloud = ctx.createRadialGradient(cx, cy, 0, cx, cy, cw)
      cloud.addColorStop(0, rgba(glow, cloudAmt))
      cloud.addColorStop(1, rgba(glow, 0))
      ctx.fillStyle = cloud
      ctx.fillRect(cx - cw, cy - cw * 0.35, cw * 2, cw * 0.7)
    }
    ctx.restore()
  }

  if (palette.starOpacity > 0.05) {
    ctx.save()
    ctx.translate(w * 0.5, h * 0.2)
    ctx.rotate(-0.36)
    ctx.globalAlpha = palette.starOpacity * 0.1
    const veil = ctx.createLinearGradient(0, -h * 0.09, 0, h * 0.09)
    veil.addColorStop(0, 'rgba(186, 198, 230, 0)')
    veil.addColorStop(0.5, 'rgba(220, 228, 255, 0.5)')
    veil.addColorStop(1, 'rgba(186, 198, 230, 0)')
    ctx.fillStyle = veil
    ctx.fillRect(-w, -h * 0.09, w * 2, h * 0.18)
    ctx.restore()
  }

  const [sr, sg, sb] = hexRgb(mixHex('#f7f4ff', palette.sunColor, 0.18))
  const drift = (time * 0.0028) % 1
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const star of STARS) {
    const twinkle = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * star.tw + star.ph))
    const vis = Math.max(palette.starOpacity, star.glint ? 0.2 : 0) * star.b * twinkle
    if (vis < 0.03) continue
    const x = ((star.x + drift) % 1) * w
    const y = star.y * h
    const fade = 1 - Math.min(1, Math.max(0, (star.y - 0.68) / 0.14))
    const a = vis * fade * (star.glint ? 1.9 : 1.05)
    if (a < 0.04) continue
    const r = Math.max(0.85 * unit, star.r * unit)
    ctx.fillStyle = `rgba(${sr},${sg},${sb},${Math.min(0.95, a)})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    if (star.glint && a > 0.16) {
      ctx.fillStyle = `rgba(255,252,248,${Math.min(0.9, a * 0.7)})`
      ctx.beginPath()
      ctx.arc(x, y, r * 0.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}
