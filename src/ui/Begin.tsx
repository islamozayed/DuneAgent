import { motion } from 'motion/react'

type Props = {
  onBegin: () => void
}

export function Begin({ onBegin }: Props) {
  return (
    <motion.div
      className="landing"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, filter: 'blur(12px)' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <img
        className="landing-kicker"
        src="/icons/dune-logo.svg"
        alt="DUNE"
        width={693}
        height={215}
      />
      <h1 className="landing-title">
        The Agentic Co-Pilot for
        <br />
        the Future of Abu Dhabi
      </h1>
      <button type="button" className="begin glass liquid-glass" onClick={onBegin}>
        Begin
        <img src="/icons/begin-arrow.svg" alt="" width={35} height={8} />
      </button>
    </motion.div>
  )
}
