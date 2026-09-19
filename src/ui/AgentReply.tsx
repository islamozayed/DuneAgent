import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MapTrifold } from '@phosphor-icons/react/MapTrifold'
import { scenarioById, type ScenarioId } from '../data/scenarios'
import { iconForTakeaway } from './takeawayIcon'
import { ThinkingMark } from './ThinkingMark'
import { THINK_DELAY, THINK_FADE, WORD_BLUR, WORD_DURATION, WORD_EASE, streamDoneAt, wordDelay } from './agentCadence'

type Props = {
  id: ScenarioId
  onRevealed: () => void
  onSeeMap: () => void
  technical?: boolean
}

const THINK_PHRASE_MS = 1600
const THINK_PHRASES = [
  'Reading the corridor…',
  'Tracing peak flows…',
  'Weighing last-mile options…',
  'Mapping the coastal spine…',
]
const BULLET_PAUSE = 0.2
const BULLET_STAGGER = 0.15
const BULLET_DURATION = 0.28
const HOLD_AFTER = 0.25

function paragraphDoneAt(wordCount: number) {
  return streamDoneAt(wordCount)
}

function bulletDelay(wordCount: number, index: number) {
  return paragraphDoneAt(wordCount) + BULLET_PAUSE + index * BULLET_STAGGER
}

function kickerDelay(wordCount: number) {
  return Math.max(paragraphDoneAt(wordCount) + BULLET_PAUSE - 0.18, paragraphDoneAt(wordCount))
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

export function AgentReply({ id, onRevealed, onSeeMap, technical = false }: Props) {
  const scenario = scenarioById(id)
  const words = scenario.reply.split(' ')
  const doneAt = replyDoneAt(words.length, scenario.analysis.length)
  const onRevealedRef = useRef(onRevealed)
  onRevealedRef.current = onRevealed
  const [thinking, setThinking] = useState(true)
  const [mapCta, setMapCta] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => onRevealedRef.current(), THINK_DELAY * 1000)
    return () => window.clearTimeout(t)
  }, [id])

  useEffect(() => {
    setMapCta(false)
    const t = window.setTimeout(() => setMapCta(true), doneAt * 1000)
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
            initial={{ opacity: 0, filter: `blur(${WORD_BLUR}px)` }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{
              delay: wordDelay(i),
              duration: WORD_DURATION,
              ease: WORD_EASE,
            }}
          >
            {word}
          </motion.span>
        ))}
      </p>
      <div className="analysis-takeaways">
        <motion.h3
          className="analysis-kicker"
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ delay: kickerDelay(words.length), duration: BULLET_DURATION }}
        >
          Key takeaways
        </motion.h3>
        <ul className="analysis">
          {scenario.analysis.map((line, i) => {
            const Icon = iconForTakeaway(line)
            return (
              <motion.li
                key={line}
                initial={{ opacity: 0, filter: 'blur(8px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: bulletDelay(words.length, i), duration: BULLET_DURATION }}
              >
                <Icon className="analysis-icon" size={20} weight="regular" aria-hidden />
                <span>{line}</span>
              </motion.li>
            )
          })}
        </ul>
      </div>
      <AnimatePresence>
        {mapCta ? (
          <motion.button
            key="see-map"
            type="button"
            className={`map-evidence-btn glass liquid-glass${technical ? ' is-active' : ''}`}
            onClick={onSeeMap}
            aria-pressed={technical}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <MapTrifold className="map-evidence-icon" size={18} weight="regular" aria-hidden />
            See evidence on map
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
