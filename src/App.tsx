import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { DuneCanvas } from './scene/DuneCanvas'
import { SkyBackdrop } from './scene/SkyBackdrop'
import { FLY_SECONDS } from './scene/CameraRig'
import { Begin } from './ui/Begin'
import { ScenarioCards } from './ui/KpiDeck'
import { PromptBar } from './ui/PromptBar'
import { AgentReply } from './ui/AgentReply'
import { AgentText } from './ui/AgentText'
import { LiquidGlassLayer } from './ui/GlassLayer'
import { briefingSummary, scenarioById, type ScenarioId } from './data/scenarios'

const MobilityMap = lazy(async () => {
  const mod = await import('./map/MobilityMap')
  return { default: mod.MobilityMap }
})

type Phase = 'landing' | 'flying' | 'briefing' | 'analysis' | 'split'

const FLY_MS = FLY_SECONDS * 1000
const HANDOFF_MS = 1050

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning, Your Highness'
  if (h < 17) return 'Good Afternoon, Your Highness'
  return 'Good Evening, Your Highness'
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('landing')
  const [replyId, setReplyId] = useState<ScenarioId | null>(null)
  const [keepDunes, setKeepDunes] = useState(true)
  const [cardsReady, setCardsReady] = useState(false)
  const flyTimer = useRef(0)
  const hello = greeting()

  useEffect(() => {
    return () => window.clearTimeout(flyTimer.current)
  }, [])

  useEffect(() => {
    if (phase === 'landing' || phase === 'flying') return
    if (!keepDunes) return
    const id = window.setTimeout(() => setKeepDunes(false), HANDOFF_MS)
    return () => window.clearTimeout(id)
  }, [phase, keepDunes])

  useEffect(() => {
    if (phase !== 'briefing') setCardsReady(false)
  }, [phase])

  function begin() {
    setKeepDunes(true)
    setPhase('flying')
    window.clearTimeout(flyTimer.current)
    flyTimer.current = window.setTimeout(() => setPhase('briefing'), FLY_MS)
  }

  function back() {
    if (phase === 'split') setPhase('analysis')
    else if (phase === 'analysis') {
      setReplyId(null)
      setPhase('briefing')
    } else if (phase === 'briefing') {
      window.clearTimeout(flyTimer.current)
      setPhase('landing')
      setKeepDunes(true)
    }
  }

  const openAnalysis = useCallback((id: ScenarioId) => {
    setReplyId(id)
    setPhase('analysis')
  }, [])

  const goSplit = useCallback(() => {
    setPhase((current) => (current === 'analysis' ? 'split' : current))
  }, [])

  const onPrompt = useCallback(
    (id: ScenarioId, _text: string) => {
      openAnalysis(id)
    },
    [openAnalysis],
  )

  const showDunes = phase === 'landing' || phase === 'flying' || keepDunes
  const dunesFading = showDunes && phase !== 'landing' && phase !== 'flying'
  const showMapWidget = phase === 'split' && replyId !== null
  const layers = showMapWidget ? scenarioById(replyId).mapLayers : []

  return (
    <div className={`app stage-${phase}`}>
      <SkyBackdrop />
      {showDunes ? <DuneCanvas flying={phase === 'flying'} fading={dunesFading} /> : null}

      {showMapWidget ? (
        <div className="map-host">
          <Suspense fallback={null}>
            <MobilityMap layers={layers} variant="widget" />
          </Suspense>
        </div>
      ) : null}

      <LiquidGlassLayer />

      <div className="ui">
        <AnimatePresence>
          {phase === 'landing' ? <Begin key="begin" onBegin={begin} /> : null}
        </AnimatePresence>

        {phase === 'briefing' || phase === 'analysis' || phase === 'split' ? (
          <button type="button" className="back-btn" onClick={back} aria-label="Back">
            <img src="/icons/back.svg" alt="" width={32} height={32} />
          </button>
        ) : null}

        {phase === 'briefing' ? (
          <motion.div
            className="briefing"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="greeting">{hello}</h1>
            <AgentText
              className="brief-summary"
              text={briefingSummary}
              onComplete={() => setCardsReady(true)}
            />
            <AnimatePresence>
              {cardsReady ? <ScenarioCards key="scenarios" onPick={openAnalysis} /> : null}
            </AnimatePresence>
          </motion.div>
        ) : null}

        {(phase === 'analysis' || phase === 'split') && replyId ? (
          <>
            <div className="question-chip glass liquid-glass">{scenarioById(replyId).question}</div>
            <AgentReply key={replyId} id={replyId} onRevealed={goSplit} />
          </>
        ) : null}

        {phase === 'briefing' || phase === 'analysis' || phase === 'split' ? (
          <PromptBar shifted={phase === 'split'} onSubmit={onPrompt} />
        ) : null}
      </div>
    </div>
  )
}
