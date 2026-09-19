import { getPhase, samplePalette, sunDirection } from './dayNight'
import { getSkyTravel } from './flyProgress'
import { getVoice, tickVoice, voiceAmp, voiceBlend } from '../voice'

/** Screen-space rise of the shared star field, matched to the camera fly. */
const FLY_SKY_LIFT = 0.38

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

type FrozenStar = {
  starIndex: number
  nx: number
  ny: number
}

let frozenStars: FrozenStar[] | null = null
let pauseOffset = 0
let frozenClock: number | null = null

function skyTime(real: number, active: boolean) {
  if (active) {
    if (frozenClock == null) frozenClock = real - pauseOffset
    return frozenClock
  }
  if (frozenClock != null) {
    pauseOffset = real - frozenClock
    frozenClock = null
  }
  return real - pauseOffset
}

function captureFreeze(clock: number) {
  const drift = (clock * 0.0028) % 1
  const lift = getSkyTravel() * FLY_SKY_LIFT
  const rows = STARS.map((star, starIndex) => ({
    starIndex,
    nx: (star.x + drift) % 1,
    ny: star.y + lift,
  }))
  rows.sort((a, b) => a.nx - b.nx || a.ny - b.ny)
  frozenStars = rows
}

function spacedLineXs(rows: FrozenStar[], w: number, unit: number) {
  const n = rows.length
  const xs = rows.map((row) => row.nx)
  const rad = rows.map((row) => {
    const star = STARS[row.starIndex]
    return Math.max(0.85 * unit, (star?.r ?? 1) * unit) / w
  })
  const pad = 1.35
  const extra = 2 / w
  const gap = (i: number, j: number) => ((rad[i] ?? 0) + (rad[j] ?? 0)) * pad + extra
  const left = 0.016
  const right = 0.984

  for (let i = 1; i < n; i++) {
    const minX = (xs[i - 1] ?? 0) + gap(i - 1, i)
    xs[i] = Math.max(xs[i] ?? 0, minX)
  }
  const last = n - 1
  xs[last] = Math.min(xs[last] ?? 1, right - (rad[last] ?? 0))
  for (let i = n - 2; i >= 0; i--) {
    const maxX = (xs[i + 1] ?? 1) - gap(i, i + 1)
    xs[i] = Math.min(xs[i] ?? 0, maxX)
  }
  xs[0] = Math.max(xs[0] ?? 0, left + (rad[0] ?? 0))
  for (let i = 1; i < n; i++) {
    xs[i] = Math.max(xs[i] ?? 0, (xs[i - 1] ?? 0) + gap(i - 1, i), left + (rad[i] ?? 0))
  }

  const first = xs[0] ?? left
  const end = xs[last] ?? right
  const overflow = end + (rad[last] ?? 0) - right
  if (overflow > 0) {
    const span = end - first
    const fit = right - left - (rad[0] ?? 0) - (rad[last] ?? 0)
    if (span > 0 && fit > 0) {
      const s = Math.min(1, fit / span)
      const origin = left + (rad[0] ?? 0)
      for (let i = 0; i < n; i++) xs[i] = origin + ((xs[i] ?? 0) - first) * s
    }
  }
  return xs
}

function fract(v: number) {
  return v - Math.floor(v)
}

function hash(n: number) {
  return fract(Math.sin(n * 127.1 + 311.7) * 43758.5453)
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function valueNoise(x: number) {
  const i = Math.floor(x)
  const f = x - i
  const u = f * f * (3 - 2 * f)
  return mix(hash(i), hash(i + 1), u) * 2 - 1
}

function field(u: number, seed: number) {
  return (
    valueNoise(u * 18.5 + seed) * 0.26 +
    valueNoise(u * 41.0 + seed * 2.2) * 0.34 +
    valueNoise(u * 88.0 + seed * 0.7) * 0.24 +
    valueNoise(u * 165.0 + seed * 3.4) * 0.16
  )
}

function speechEnv(t: number, seed: number) {
  const burst = 0.18 + 0.82 * Math.max(0, Math.sin(t * (4.5 + seed * 0.8) + seed * 3.1)) ** 1.15
  const phrase = 0.4 + 0.6 * Math.max(0.12, Math.sin(t * (1.15 + seed * 0.2) + seed * 2))
  const pause = hash(Math.floor(t * (0.8 + seed * 0.2) + seed * 11)) > 0.18 ? 1 : 0.07
  return burst * phrase * pause
}

function voiceLift(u: number, t: number) {
  const band = Math.floor(u * 13)
  const region = speechEnv(t * 1.15 + hash(band) * 7, 0.18 + hash(band + 2) * 0.7)
  const e1 = speechEnv(t, 0.11)
  const e2 = speechEnv(t * 1.38 + 0.55, 0.52)
  const e3 = speechEnv(t * 0.9 + 1.4, 0.88)
  let y = field(u, 1.12) * (0.28 + 0.72 * e1)
  y += field(u, 5.4) * e2 * 0.75
  y += field(u, 9.1) * e3 * 0.4
  y *= 0.2 + 0.8 * region
  y = Math.sign(y) * Math.abs(y) ** 0.68
  y += (hash(u * 240 + Math.floor(t * 26)) * 2 - 1) * e2 * 0.14
  return Math.max(-1, Math.min(1, y * 1.55))
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  a: number,
  glint: boolean,
  sr: number,
  sg: number,
  sb: number,
) {
  if (a < 0.04) return
  ctx.fillStyle = `rgba(${sr},${sg},${sb},${Math.min(0.95, a)})`
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  if (glint && a > 0.16) {
    ctx.fillStyle = `rgba(230,240,255,${Math.min(0.82, a * 0.55)})`
    ctx.beginPath()
    ctx.arc(x, y, r * 0.4, 0, Math.PI * 2)
    ctx.fill()
  }
}

function makeStar(rand: () => number, x: number, y: number, glint: boolean): Star {
  return {
    x,
    y,
    r: glint ? 1.2 + rand() * 1.5 : 0.6 + rand() ** 2 * 1.0,
    b: glint ? 0.78 + rand() * 0.22 : 0.38 + rand() * 0.5,
    tw: 0.5 + rand() * 2.2,
    ph: rand() * Math.PI * 2,
    glint,
  }
}

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
    stars.push(makeStar(rand, rand(), y, glint))
  }
  // Seed a band above the fold so a downward fly drift reveals more sky
  // instead of an empty strip that then snaps back to the viewport top.
  const overflow = FLY_SKY_LIFT + 0.12
  const extra = Math.round(count * 0.58 * (overflow / 0.38))
  for (let i = 0; i < extra; i++) {
    stars.push(makeStar(rand, rand(), -rand() * overflow, i < 8 || rand() > 0.92))
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

  const lift = getSkyTravel()
  const extra = lift * h * FLY_SKY_LIFT

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  const band = ctx.createLinearGradient(0, 0, 0, h + extra)
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
  const horizonBloom = ctx.createRadialGradient(hx, h * 1.08 + extra, 0, hx, h * 1.08 + extra, Math.max(w, h) * 0.78)
  horizonBloom.addColorStop(0, rgba(glow, 0.28))
  horizonBloom.addColorStop(0.45, rgba(glow, 0.08))
  horizonBloom.addColorStop(1, rgba(glow, 0))
  ctx.fillStyle = horizonBloom
  ctx.fillRect(0, 0, w, h)

  const sunX = w * (0.5 + sun[0] * 0.34)
  const sunY = h * (1 - (0.08 + Math.max(0, sun[1]) * 0.56)) + extra
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
      const cy = h * (0.58 + i * 0.08 + Math.sin(time * 0.03 + i) * 0.03) + extra
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
    ctx.translate(w * 0.5, h * 0.2 + extra)
    ctx.rotate(-0.36)
    ctx.globalAlpha = palette.starOpacity * 0.1
    const veil = ctx.createLinearGradient(0, -h * 0.09, 0, h * 0.09)
    veil.addColorStop(0, 'rgba(140, 170, 210, 0)')
    veil.addColorStop(0.5, 'rgba(190, 214, 240, 0.22)')
    veil.addColorStop(1, 'rgba(140, 170, 210, 0)')
    ctx.fillStyle = veil
    ctx.fillRect(-w, -h * 0.09, w * 2, h * 0.18)
    ctx.restore()
  }

  tickVoice()
  const voice = getVoice()
  const active = voice.mode !== 'idle'
  const clock = skyTime(time, active)
  if (active && !frozenStars) captureFreeze(clock)
  if (!active) frozenStars = null
  const blend = voiceBlend()
  const amp = voiceAmp()

  const [sr, sg, sb] = hexRgb(mixHex('#e8f0f8', palette.sunColor, 0.18))
  const drift = (clock * 0.0028) % 1
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  if (frozenStars && blend > 0.001) {
    const center = h * 0.44
    const waveH = h * 0.18
    const lineXs = spacedLineXs(frozenStars, w, unit)

    frozenStars.forEach((frozen, i) => {
      const star = STARS[frozen.starIndex]
      if (!star) return
      const twinkle = 0.88 + 0.12 * (0.5 + 0.5 * Math.sin(clock * star.tw + star.ph))
      const liveVis = Math.max(palette.starOpacity, star.glint ? 0.2 : 0) * star.b * twinkle
      const liveFade = 1 - Math.min(1, Math.max(0, (frozen.ny - 0.68) / 0.14))
      const liveA = liveVis * liveFade * (star.glint ? 1.9 : 1.05)
      const linedA = Math.max(liveA, (0.42 + star.b * 0.5) * (star.glint ? 1.25 : 1))
      const a = mix(liveA, linedA, blend)
      const homeY = frozen.ny * h
      const u = lineXs[i] ?? frozen.nx
      const linedY = center + voiceLift(u, time) * amp * waveH
      const x = mix(frozen.nx, u, blend) * w
      drawStar(
        ctx,
        x,
        mix(homeY, linedY, blend),
        Math.max(0.85 * unit, star.r * unit),
        a,
        star.glint,
        sr,
        sg,
        sb,
      )
    })
  } else {
    for (const star of STARS) {
      const twinkle = 0.88 + 0.12 * (0.5 + 0.5 * Math.sin(clock * star.tw + star.ph))
      const vis = Math.max(palette.starOpacity, star.glint ? 0.2 : 0) * star.b * twinkle
      if (vis < 0.03) continue
      const ny = star.y + lift * FLY_SKY_LIFT
      const x = ((star.x + drift) % 1) * w
      const y = ny * h
      if (y < -8 * unit) continue
      const fade = 1 - Math.min(1, Math.max(0, (ny - 0.68) / 0.14))
      const a = vis * fade * (star.glint ? 1.9 : 1.05)
      const r = Math.max(0.85 * unit, star.r * unit)
      drawStar(ctx, x, y, r, a, star.glint, sr, sg, sb)
    }
  }
  ctx.restore()
}
