import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { scenarioById, type ScenarioId } from '../data/scenarios'

type Props = {
  id: ScenarioId
  onRevealed: () => void
}

/** Shared reply cadence — paragraph, bullets, and split handoff must use these. */
const THINK_DELAY = 0.32
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

export function AgentReply({ id, onRevealed }: Props) {
  const scenario = scenarioById(id)
  const words = scenario.reply.split(' ')
  const doneAt = replyDoneAt(words.length, scenario.analysis.length)
  const onRevealedRef = useRef(onRevealed)
  onRevealedRef.current = onRevealed

  useEffect(() => {
    const t = window.setTimeout(() => onRevealedRef.current(), doneAt * 1000)
    return () => window.clearTimeout(t)
  }, [id, doneAt])

  return (
    <div className="analysis-copy">
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
