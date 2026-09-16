import { motion } from 'motion/react'
import { scenarios, type ScenarioId } from '../data/scenarios'

type Props = {
  onPick: (id: ScenarioId) => void
}

export function ScenarioCards({ onPick }: Props) {
  return (
    <motion.div
      className="scenario-row"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {scenarios.map((s, i) => (
        <motion.button
          key={s.id}
          type="button"
          className="scenario-card glass liquid-glass"
          onClick={() => onPick(s.id)}
          initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.08 + i * 0.1, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="scenario-num">{String(i + 1).padStart(2, '0')}</span>
          <span className="scenario-q">{s.question}</span>
        </motion.button>
      ))}
    </motion.div>
  )
}
