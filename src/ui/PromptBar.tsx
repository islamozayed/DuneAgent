import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { matchScenario, type ScenarioId } from '../data/scenarios'

type Props = {
  onSubmit: (id: ScenarioId, text: string) => void
  shifted?: boolean
}

export function PromptBar({ onSubmit, shifted = false }: Props) {
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const recRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    return () => recRef.current?.abort()
  }, [])

  function toggleMic() {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Ctor) {
      setMicError('Voice is not available in this browser.')
      return
    }
    if (listening) {
      recRef.current?.stop()
      setListening(false)
      return
    }
    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = (event) => {
      const piece = Array.from(event.results)
        .map((r) => r[0]?.transcript ?? '')
        .join(' ')
        .trim()
      if (piece) setText(piece)
    }
    rec.onerror = (event) => {
      setListening(false)
      if (event.error === 'not-allowed') setMicError('Microphone blocked — type instead.')
      else setMicError('Voice capture ended. You can type instead.')
    }
    rec.onend = () => setListening(false)
    recRef.current = rec
    setMicError(null)
    setListening(true)
    rec.start()
  }

  function submit() {
    const trimmed = text.trim()
    if (!trimmed) return
    recRef.current?.stop()
    onSubmit(matchScenario(trimmed), trimmed)
    setText('')
  }

  return (
    <motion.div
      className={shifted ? 'prompt-bar glass liquid-glass shifted' : 'prompt-bar glass liquid-glass'}
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
        placeholder="Tell me which of the two you’d like to ask about"
        aria-label="Question"
      />
      <div className="prompt-icons">
        <button
          type="button"
          className={listening ? 'icon-btn live' : 'icon-btn'}
          onClick={toggleMic}
          aria-label={listening ? 'Stop listening' : 'Ask with voice'}
        >
          <img src="/icons/mic.svg" alt="" width={32} height={32} />
        </button>
        <button type="button" className="icon-btn" onClick={submit} disabled={!text.trim()} aria-label="Send">
          <img src="/icons/send.svg" alt="" width={32} height={32} />
        </button>
      </div>
      {micError ? <p className="mic-note">{micError}</p> : null}
    </motion.div>
  )
}
