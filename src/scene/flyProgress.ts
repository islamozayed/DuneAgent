import gsap from 'gsap'

/** Shared 0–1 rise used by the camera fly and the 2D star field. */
const fly = { p: 0 }

export function getFlyProgress() {
  return fly.p
}

/**
 * Star-field travel along the fly. 0 at rest, 1 once the camera has risen.
 * Extra stars live above the viewport so the field can drift down with the
 * camera and stay there — no snap back to the top edge.
 */
export function getSkyTravel() {
  return fly.p
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
