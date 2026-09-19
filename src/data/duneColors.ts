import { NIGHT, type Palette } from './palettes'

export const DUNE_COLORS_KEY = 'dune-colors'

export type DuneColors = {
  sand: string
  skyZenith: string
  skyHorizon: string
  moon: string
}

/** Cool-night hold — NIGHT sand / sky / moonlight. */
export const DEFAULT_DUNE_COLORS: DuneColors = {
  sand: NIGHT.sandLit,
  skyZenith: NIGHT.skyZenith,
  skyHorizon: NIGHT.skyHorizon,
  moon: NIGHT.sunColor,
}

const HEX6 = /^#([0-9a-fA-F]{6})$/
const HEX3 = /^#([0-9a-fA-F]{3})$/

export function normalizeHex(value: string, fallback: string): string {
  const raw = value.trim()
  const six = HEX6.exec(raw)
  if (six) return `#${six[1]!.toLowerCase()}`
  const three = HEX3.exec(raw)
  if (three) {
    const [r, g, b] = three[1]!
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return fallback
}

function readStored(): DuneColors {
  try {
    const raw = localStorage.getItem(DUNE_COLORS_KEY)
    if (!raw) return { ...DEFAULT_DUNE_COLORS }
    const parsed = JSON.parse(raw) as Partial<DuneColors>
    return {
      sand: normalizeHex(String(parsed.sand ?? ''), DEFAULT_DUNE_COLORS.sand),
      skyZenith: normalizeHex(String(parsed.skyZenith ?? ''), DEFAULT_DUNE_COLORS.skyZenith),
      skyHorizon: normalizeHex(String(parsed.skyHorizon ?? ''), DEFAULT_DUNE_COLORS.skyHorizon),
      moon: normalizeHex(String(parsed.moon ?? ''), DEFAULT_DUNE_COLORS.moon),
    }
  } catch {
    return { ...DEFAULT_DUNE_COLORS }
  }
}

let current = readStored()
const listeners = new Set<(colors: DuneColors) => void>()

function persist(next: DuneColors) {
  current = next
  try {
    localStorage.setItem(DUNE_COLORS_KEY, JSON.stringify(next))
  } catch {
    /* private mode / blocked storage */
  }
  listeners.forEach((fn) => fn(next))
}

export function getDuneColors(): DuneColors {
  return current
}

export function setDuneColor<K extends keyof DuneColors>(key: K, value: string) {
  const next = normalizeHex(value, current[key])
  if (next === current[key]) return
  persist({ ...current, [key]: next })
}

export function resetDuneColors() {
  persist({ ...DEFAULT_DUNE_COLORS })
}

export function subscribeDuneColors(fn: (colors: DuneColors) => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function applyDuneColors(palette: Palette): Palette {
  const colors = current
  return {
    ...palette,
    sandLit: colors.sand,
    skyZenith: colors.skyZenith,
    skyHorizon: colors.skyHorizon,
    sunColor: colors.moon,
  }
}
