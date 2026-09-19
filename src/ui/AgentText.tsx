import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { WORD_BLUR, WORD_DURATION, WORD_EASE, streamDoneAt, wordDelay } from './agentCadence'

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
  )
}
