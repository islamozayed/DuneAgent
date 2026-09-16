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

export const GOLDEN: Palette = {
  sandLit: '#8a564c',
  sandShadow: '#241614',
  skyZenith: '#6e6a7c',
  skyHorizon: '#c4b0b4',
  skyGlow: '#d2c0c4',
  sunColor: '#f0e4e0',
  ambient: '#8a706c',
  fog: '#8a787c',
  hemiSky: '#9a96a8',
  hemiGround: '#6a4842',
  glass: '#e4d8d6',
  ink: '#f4ece8',
  starOpacity: 0.28,
  sunIntensity: 1.4,
  ambientIntensity: 0.3,
  bloom: 0.48,
  sunElev: 0.22,
  sunAzim: -1.05,
}

export const DUSK: Palette = {
  sandLit: '#8a5b62',
  sandShadow: '#1a1018',
  skyZenith: '#2a3550',
  skyHorizon: '#6a4a58',
  skyGlow: '#c4a0a8',
  sunColor: '#f0b8a8',
  ambient: '#6a4a58',
  fog: '#3a3048',
  hemiSky: '#4a5878',
  hemiGround: '#5a3840',
  glass: '#c8b0b8',
  ink: '#f4ece8',
  starOpacity: 0.48,
  sunIntensity: 1.35,
  ambientIntensity: 0.28,
  bloom: 0.9,
  sunElev: 0.08,
  sunAzim: -1.15,
}

export const NIGHT: Palette = {
  sandLit: '#3d4a5c',
  sandShadow: '#0a1018',
  skyZenith: '#152038',
  skyHorizon: '#1a2744',
  skyGlow: '#2a3858',
  sunColor: '#c8d8f0',
  ambient: '#1a2438',
  fog: '#121a2c',
  hemiSky: '#243044',
  hemiGround: '#1a2030',
  glass: '#c4d0e4',
  ink: '#eef4ff',
  starOpacity: 1,
  sunIntensity: 0.55,
  ambientIntensity: 0.18,
  bloom: 0.35,
  sunElev: 0.42,
  sunAzim: 0.85,
}

export const PREDAWN: Palette = {
  sandLit: '#7a5a58',
  sandShadow: '#1c1418',
  skyZenith: '#3a3a50',
  skyHorizon: '#b89aa0',
  skyGlow: '#c8b0b8',
  sunColor: '#e8d8dc',
  ambient: '#7a6868',
  fog: '#5a4850',
  hemiSky: '#6a6880',
  hemiGround: '#5a4040',
  glass: '#e0d0d0',
  ink: '#f8f0ea',
  starOpacity: 0.32,
  sunIntensity: 1.15,
  ambientIntensity: 0.28,
  bloom: 0.55,
  sunElev: 0.12,
  sunAzim: -1.08,
}

export const STOPS: { t: number; palette: Palette }[] = [
  { t: 0, palette: GOLDEN },
  { t: 0.28, palette: DUSK },
  { t: 0.5, palette: NIGHT },
  { t: 0.78, palette: PREDAWN },
  { t: 1, palette: GOLDEN },
]
