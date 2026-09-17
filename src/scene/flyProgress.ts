import gsap from 'gsap'

/** Shared 0–1 rise used by the camera fly and the 2D star field. */
const fly = { p: 0 }

/** Visual travel finishes before the dune canvas fade, so briefing is already on-screen. */
const SETTLE_AT = 0.48

export function getFlyProgress() {
  return fly.p
}

/**
 * Star-field travel along the fly. 0 at rest and 0 at the end — the briefing
 * layout — with a temporary downward drift in the middle. A 0↔1 snap at
 * handoff therefore does not move the stars.
 */
export function getSkyTravel() {
  const p = fly.p
  if (p <= 0 || p >= SETTLE_AT) return 0
  return Math.sin((p / SETTLE_AT) * Math.PI)
}

export function playFlyRise(seconds: number) {
  gsap.killTweensOf(fly)
  fly.p = 0
  gsap.to(fly, { p: 1, duration: seconds, ease: 'expo.inOut' })
}

export function setFlyProgress(value: number) {
  gsap.killTweensOf(fly)
  fly.p = value < 0 ? 0 : value > 1 ? 1 : value
}
