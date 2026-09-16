import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'

const THINK_DELAY = 0.32
const WORD_STAGGER = 0.1
const WORD_DURATION = 0.58

function wordDelay(index: number) {
  return THINK_DELAY + index * WORD_STAGGER
}

function streamDoneAt(wordCount: number) {
  return wordDelay(Math.max(wordCount - 1, 0)) + WORD_DURATION
}

type Props = {
  text: string
  className?: string
  onComplete?: () => void
}

/** Word-by-word stream used for agent-style copy (briefing summary, replies). */
export function AgentText({ text, className, onComplete }: Props) {
  const words = text.split(' ')
  const doneAt = streamDoneAt(words.length)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const t = window.setTimeout(() => onCompleteRef.current?.(), doneAt * 1000)
    return () => window.clearTimeout(t)
  }, [text, doneAt])

  return (
    <p className={className}>
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
  )
}
