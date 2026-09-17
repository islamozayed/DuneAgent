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

export const DUSK: Palette = {
  sandLit: '#6e5c7c',
  sandShadow: '#16101c',
  skyZenith: '#34326a',
  skyHorizon: '#c8b4e0',
  skyGlow: '#e8d0f2',
  sunColor: '#f2d8f6',
  ambient: '#6a6088',
  fog: '#4a446c',
  hemiSky: '#8a88c4',
  hemiGround: '#4a3858',
  glass: '#d8d0e8',
  ink: '#f2eef8',
  starOpacity: 0.22,
  sunIntensity: 1.35,
  ambientIntensity: 0.34,
  bloom: 0.78,
  sunElev: 0.1,
  sunAzim: 2.42,
}

export const BLUE_HOUR: Palette = {
  sandLit: '#4a4a6c',
  sandShadow: '#100e1a',
  skyZenith: '#1c1e48',
  skyHorizon: '#6a5a94',
  skyGlow: '#a090c8',
  sunColor: '#d8c8f0',
  ambient: '#3a3860',
  fog: '#2a284c',
  hemiSky: '#5a5898',
  hemiGround: '#2a243a',
  glass: '#c8c0e0',
  ink: '#eef0fa',
  starOpacity: 0.62,
  sunIntensity: 0.82,
  ambientIntensity: 0.24,
  bloom: 0.58,
  sunElev: 0.04,
  sunAzim: 2.52,
}

export const NIGHT: Palette = {
  sandLit: '#343858',
  sandShadow: '#080a14',
  skyZenith: '#0c1028',
  skyHorizon: '#1a1840',
  skyGlow: '#3a3470',
  sunColor: '#c8d0f8',
  ambient: '#1a1c38',
  fog: '#101428',
  hemiSky: '#2a2c58',
  hemiGround: '#161428',
  glass: '#c4c8e8',
  ink: '#eef2ff',
  starOpacity: 1,
  sunIntensity: 0.46,
  ambientIntensity: 0.16,
  bloom: 0.32,
  sunElev: 0.4,
  sunAzim: -0.82,
}

export const STOPS: { t: number; palette: Palette }[] = [
  { t: 0, palette: DUSK },
  { t: 0.26, palette: BLUE_HOUR },
  { t: 0.5, palette: NIGHT },
  { t: 0.82, palette: NIGHT },
  { t: 1, palette: DUSK },
]
