import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { scenarioById, type ScenarioId } from '../data/scenarios'
import { ThinkingMark } from './ThinkingMark'

type Props = {
  id: ScenarioId
  onRevealed: () => void
}

/** Shared reply cadence — paragraph, bullets, and split handoff must use these. */
const THINK_DELAY = 4.8
const THINK_FADE = 0.45
const THINK_PHRASE_MS = 1600
const THINK_PHRASES = [
  'Reading the corridor…',
  'Tracing peak flows…',
  'Weighing last-mile options…',
  'Mapping the coastal spine…',
]
const WORD_STAGGER = 0.1
const WORD_DURATION = 0.58
const BULLET_PAUSE = 0.4
const BULLET_STAGGER = 0.42
const BULLET_DURATION = 0.62
const HOLD_AFTER = 1.0

function wordDelay(index: number) {
  return THINK_DELAY + index * WORD_STAGGER
}

function paragraphDoneAt(wordCount: number) {
  return wordDelay(Math.max(wordCount - 1, 0)) + WORD_DURATION
}

function bulletDelay(wordCount: number, index: number) {
  return paragraphDoneAt(wordCount) + BULLET_PAUSE + index * BULLET_STAGGER
}

function replyDoneAt(wordCount: number, bulletCount: number) {
  const lastBulletStart = bulletDelay(wordCount, Math.max(bulletCount - 1, 0))
  return lastBulletStart + BULLET_DURATION + HOLD_AFTER
}

function ThinkingCopy() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = window.setInterval(() => {
      setIndex((n) => (n + 1) % THINK_PHRASES.length)
    }, THINK_PHRASE_MS)
    return () => window.clearInterval(t)
  }, [])

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={THINK_PHRASES[index]}
        className="thinking-copy"
        initial={{ opacity: 0, filter: 'blur(6px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, filter: 'blur(6px)' }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        {THINK_PHRASES[index]}
      </motion.span>
    </AnimatePresence>
  )
}

export function AgentReply({ id, onRevealed }: Props) {
  const scenario = scenarioById(id)
  const words = scenario.reply.split(' ')
  const doneAt = replyDoneAt(words.length, scenario.analysis.length)
  const onRevealedRef = useRef(onRevealed)
  onRevealedRef.current = onRevealed
  const [thinking, setThinking] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => onRevealedRef.current(), doneAt * 1000)
    return () => window.clearTimeout(t)
  }, [id, doneAt])

  useEffect(() => {
    setThinking(true)
    const t = window.setTimeout(() => setThinking(false), THINK_DELAY * 1000)
    return () => window.clearTimeout(t)
  }, [id])

  return (
    <div className="analysis-copy">
      <AnimatePresence>
        {thinking ? (
          <motion.div
            key="thinking"
            className="thinking-slot"
            initial={{ opacity: 0, filter: 'blur(8px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: THINK_FADE, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Thinking"
          >
            <ThinkingMark />
            <ThinkingCopy />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <p className="reply-text">
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            className="word"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{
              delay: wordDelay(i),
              duration: WORD_DURATION,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
        ))}
      </p>
      <ul className="analysis">
        {scenario.analysis.map((line, i) => (
          <motion.li
            key={line}
            initial={{ opacity: 0, filter: 'blur(8px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ delay: bulletDelay(words.length, i), duration: BULLET_DURATION }}
          >
            {line}
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
