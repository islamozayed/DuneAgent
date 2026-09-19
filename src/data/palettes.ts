export type Palette = {
  sandLit: string
  sandShadow: string
  skyZenith: string
  skyHorizon: string
  skyGlow: string
  sunColor: string
  ambient: string
  fog: string
  hemiSky: string
  hemiGround: string
  glass: string
  ink: string
  starOpacity: number
  sunIntensity: number
  ambientIntensity: number
  bloom: number
  sunElev: number
  sunAzim: number
}

/** Cool twilight — steel blues, no magenta. */
export const DUSK: Palette = {
  sandLit: '#a8b8cc',
  sandShadow: '#121c2c',
  skyZenith: '#152238',
  skyHorizon: '#4a6480',
  skyGlow: '#7a94ac',
  sunColor: '#d0dcec',
  ambient: '#4a5c74',
  fog: '#2a384c',
  hemiSky: '#6a82a0',
  hemiGround: '#243044',
  glass: '#c8d4e4',
  ink: '#eef2f8',
  starOpacity: 0.16,
  sunIntensity: 1.12,
  ambientIntensity: 0.3,
  bloom: 0.58,
  sunElev: 0.16,
  sunAzim: 2.42,
}

/** Deepening navy before true night. */
export const BLUE_HOUR: Palette = {
  sandLit: '#7a8ca8',
  sandShadow: '#0e1826',
  skyZenith: '#0e1a2e',
  skyHorizon: '#243850',
  skyGlow: '#3a5470',
  sunColor: '#c4d4e8',
  ambient: '#2a3a50',
  fog: '#1a2838',
  hemiSky: '#3a5070',
  hemiGround: '#182030',
  glass: '#c0ccd8',
  ink: '#eef2fa',
  starOpacity: 0.36,
  sunIntensity: 0.7,
  ambientIntensity: 0.22,
  bloom: 0.4,
  sunElev: 0.08,
  sunAzim: 2.52,
}

/** macOS night dune: cool navy sand, deep sky, faint stars, cool moonlight. */
export const NIGHT: Palette = {
  sandLit: '#23395c',
  sandShadow: '#0c1624',
  skyZenith: '#0a1824',
  skyHorizon: '#122038',
  skyGlow: '#1a2c48',
  sunColor: '#bad7fd',
  ambient: '#1a2838',
  fog: '#101c2c',
  hemiSky: '#2a3c58',
  hemiGround: '#121c2c',
  glass: '#c4d0e0',
  ink: '#eef4ff',
  starOpacity: 0.42,
  sunIntensity: 0.62,
  ambientIntensity: 0.2,
  bloom: 0.26,
  sunElev: 0.58,
  sunAzim: -0.92,
}

export const STOPS: { t: number; palette: Palette }[] = [
  { t: 0, palette: DUSK },
  { t: 0.26, palette: BLUE_HOUR },
  { t: 0.5, palette: NIGHT },
  { t: 0.82, palette: NIGHT },
  { t: 1, palette: DUSK },
]
