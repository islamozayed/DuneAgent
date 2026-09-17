import { DUSK, STOPS, type Palette } from '../data/palettes'

export const CYCLE_SECONDS = 90
export const INITIAL_PHASE = 0.66

export function resetCycle() {
  // Kept so the app can re-anchor the loop on mount; phase is derived from
  // performance.now(), which already restarts on a full page load.
}

export function getPhase(now = performance.now()): number {
  return (now / 1000 / CYCLE_SECONDS + INITIAL_PHASE) % 1
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpHex(a: string, b: string, t: number): string {
  const an = parseInt(a.slice(1), 16)
  const bn = parseInt(b.slice(1), 16)
  const ar = (an >> 16) & 255
  const ag = (an >> 8) & 255
  const ab = an & 255
  const br = (bn >> 16) & 255
  const bg = (bn >> 8) & 255
  const bb = bn & 255
  const r = Math.round(lerp(ar, br, t))
  const g = Math.round(lerp(ag, bg, t))
  const bch = Math.round(lerp(ab, bb, t))
  return `#${((1 << 24) | (r << 16) | (g << 8) | bch).toString(16).slice(1)}`
}

export function samplePalette(phase: number): Palette {
  let i = 0
  while (i < STOPS.length - 1 && STOPS[i + 1].t < phase) i += 1
  const a = STOPS[i]
  const b = STOPS[i + 1] ?? STOPS[0]
  const span = b.t - a.t || 1
  const t = (phase - a.t) / span
  const pa = a.palette
  const pb = b.palette
  return {
    sandLit: lerpHex(pa.sandLit, pb.sandLit, t),
    sandShadow: lerpHex(pa.sandShadow, pb.sandShadow, t),
    skyZenith: lerpHex(pa.skyZenith, pb.skyZenith, t),
    skyHorizon: lerpHex(pa.skyHorizon, pb.skyHorizon, t),
    skyGlow: lerpHex(pa.skyGlow, pb.skyGlow, t),
    sunColor: lerpHex(pa.sunColor, pb.sunColor, t),
    ambient: lerpHex(pa.ambient, pb.ambient, t),
    fog: lerpHex(pa.fog, pb.fog, t),
    hemiSky: lerpHex(pa.hemiSky, pb.hemiSky, t),
    hemiGround: lerpHex(pa.hemiGround, pb.hemiGround, t),
    glass: lerpHex(pa.glass, pb.glass, t),
    ink: lerpHex(pa.ink, pb.ink, t),
    starOpacity: lerp(pa.starOpacity, pb.starOpacity, t),
    sunIntensity: lerp(pa.sunIntensity, pb.sunIntensity, t),
    ambientIntensity: lerp(pa.ambientIntensity, pb.ambientIntensity, t),
    bloom: lerp(pa.bloom, pb.bloom, t),
    sunElev: lerp(pa.sunElev, pb.sunElev, t),
    sunAzim: lerp(pa.sunAzim, pb.sunAzim, t),
  }
}

export function sunDirection(palette: Palette): [number, number, number] {
  const { sunElev, sunAzim } = palette
  return [
    Math.sin(sunAzim) * Math.cos(sunElev),
    Math.sin(sunElev),
    Math.cos(sunAzim) * Math.cos(sunElev),
  ]
}

export { DUSK }
