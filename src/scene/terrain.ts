function ridge(x: number, z: number, scale: number): number {
  const ridgeZ = 3.6 * Math.tanh(x / 16) + 3.1 * Math.sin(x / 20)
  const dist = z - ridgeZ
  const peakScale = (8.4 + 2.6 * Math.exp(-(x * x) / 1100)) * scale
  const sigma = dist > 0 ? 17.5 : 3.6
  let h = peakScale * Math.exp(-(dist * dist) / (sigma * sigma))
  h += 1.35 * scale * Math.exp(-(dist * dist) / 1.8) * Math.exp(-(x * x) / 520)

  const foldZ = ridgeZ + 5.4 + 2.4 * Math.sin(x / 11)
  const df = z - foldZ
  h += 3.8 * scale * Math.exp(-((x + 14) * (x + 14)) / 420) * Math.exp(-(df * df) / 18)

  if (dist > 0) {
    h += 0.09 * scale * Math.sin(x * 2.15) * Math.sin(z * 2.8)
    h += 0.04 * scale * Math.sin(x * 6.8 + z * 2.2)
  }

  return Math.max(0, h)
}

export function duneHeight(x: number, z: number): number {
  let h = ridge(x, z, 1)
  h = Math.max(h, ridge(x + 48, z + 58, 1.18) + 0.25)
  h = Math.max(h, ridge(x - 64, z + 88, 1.38) + 0.55)
  h = Math.max(h, ridge(x + 26, z + 122, 1.62) + 0.95)
  return h
}

export const COLLISION_OFFSET = 0.55

export function collisionHeight(x: number, z: number): number {
  return duneHeight(x, z) + COLLISION_OFFSET
}

export const TERRAIN_BOUNDS = {
  x0: -150,
  x1: 150,
  z0: -150,
  z1: 130,
}
