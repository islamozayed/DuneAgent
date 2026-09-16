import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { matchScenario, scenarios, type ScenarioId } from '../data/scenarios'
import { getVoice, startVoice, stopVoice, subscribeVoice } from '../voice'

type Props = {
  onSubmit: (id: ScenarioId, text: string) => void
  shifted?: boolean
}

export function PromptBar({ onSubmit, shifted = false }: Props) {
  const [text, setText] = useState('')
  const [voice, setVoice] = useState(getVoice)
  const pendingTranscript = useRef(false)
  const voicing = voice.mode !== 'idle'
  const stopping = voice.mode === 'disbanding'

  useEffect(() => subscribeVoice(setVoice), [])

  useEffect(() => {
    if (voice.mode !== 'idle' || !pendingTranscript.current) return
    pendingTranscript.current = false
    setText(scenarios[0].question)
  }, [voice.mode])

  function toggleMic() {
    if (voice.mode === 'idle') {
      pendingTranscript.current = true
      setText('')
      startVoice()
      return
    }
    if (voice.mode === 'forming' || voice.mode === 'listening') stopVoice()
  }

  function submit() {
    const trimmed = text.trim()
    if (!trimmed || voicing) return
    onSubmit(matchScenario(trimmed), trimmed)
    setText('')
  }

  const barClass = [
    'prompt-bar',
    'glass',
    'liquid-glass',
    shifted ? 'shifted' : '',
    voicing ? 'is-listening' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <motion.div
      className={barClass}
      initial={{ y: 18 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.35, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
        placeholder={voicing ? 'Listening…' : 'Tell me which of the two you’d like to ask about'}
        aria-label="Question"
        readOnly={voicing}
      />
      <div className="prompt-icons">
        <button
          type="button"
          className={voicing ? 'icon-btn live' : 'icon-btn'}
          onClick={toggleMic}
          disabled={stopping}
          aria-label={voicing ? 'Stop listening' : 'Ask with voice'}
        >
          <img src={voicing ? '/icons/stop.svg' : '/icons/mic.svg'} alt="" width={32} height={32} />
        </button>
        <button type="button" className="icon-btn" onClick={submit} disabled={voicing || !text.trim()} aria-label="Send">
          <img src="/icons/send.svg" alt="" width={32} height={32} />
        </button>
      </div>
    </motion.div>
  )
}
