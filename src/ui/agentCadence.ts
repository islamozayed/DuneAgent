/** Shared word-stream cadence for every agent message. */
export const THINK_DELAY = 0.8
export const THINK_FADE = 0.22
export const WORD_STAGGER = 0.028
export const WORD_DURATION = 0.22
export const WORD_BLUR = 3
export const WORD_EASE = [0.22, 1, 0.36, 1] as const

export function wordDelay(index: number) {
  return THINK_DELAY + index * WORD_STAGGER
}

export function streamDoneAt(wordCount: number) {
  return wordDelay(Math.max(wordCount - 1, 0)) + WORD_DURATION
}
