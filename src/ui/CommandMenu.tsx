import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_DUNE_COLORS,
  getDuneColors,
  normalizeHex,
  resetDuneColors,
  setDuneColor,
  subscribeDuneColors,
  type DuneColors,
} from '../data/duneColors'

export type UiMode = 'desktop' | 'showcase'

const STORAGE_KEY = 'dune-ui-mode'

const MODES: { id: UiMode; label: string; hint: string }[] = [
  { id: 'desktop', label: 'Desktop', hint: 'Compact agentic UI' },
  { id: 'showcase', label: 'Showcase', hint: 'Cinematic presentation' },
]

const COLOR_ROWS: { key: keyof DuneColors; label: string }[] = [
  { key: 'sand', label: 'Sand' },
  { key: 'skyZenith', label: 'Sky zenith' },
  { key: 'skyHorizon', label: 'Sky horizon' },
  { key: 'moon', label: 'Moon' },
]

function readMode(): UiMode {
  return document.documentElement.dataset.uiMode === 'desktop' ? 'desktop' : 'showcase'
}

function applyMode(mode: UiMode) {
  document.documentElement.dataset.uiMode = mode
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* private mode / blocked storage */
  }
  window.dispatchEvent(new Event('resize'))
}

function ColorRow({
  label,
  colorKey,
  value,
  draft,
  onDraft,
}: {
  label: string
  colorKey: keyof DuneColors
  value: string
  draft: string
  onDraft: (next: string) => void
}) {
  return (
    <label className="command-color">
      <input
        type="color"
        className="command-color-swatch"
        value={value}
        aria-label={label}
        onChange={(event) => {
          const next = event.target.value
          onDraft(next)
          setDuneColor(colorKey, next)
        }}
      />
      <span className="command-color-label">{label}</span>
      <input
        type="text"
        className="command-color-hex"
        value={draft}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-label={`${label} hex`}
        onChange={(event) => {
          const raw = event.target.value
          onDraft(raw)
          const next = normalizeHex(raw, '')
          if (next) setDuneColor(colorKey, next)
        }}
        onBlur={() => onDraft(getDuneColors()[colorKey])}
      />
    </label>
  )
}

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<UiMode>(readMode)
  const [active, setActive] = useState(0)
  const [colors, setColors] = useState<DuneColors>(getDuneColors)
  const [drafts, setDrafts] = useState<DuneColors>(getDuneColors)
  const panelRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  const pick = useCallback((next: UiMode) => {
    applyMode(next)
    setMode(next)
    setOpen(false)
  }, [])

  useEffect(() => subscribeDuneColors((next) => {
    setColors(next)
    setDrafts(next)
  }), [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        event.stopPropagation()
        setOpen((isOpen) => {
          const next = !isOpen
          if (next) {
            const current = readMode()
            setMode(current)
            setActive(Math.max(0, MODES.findIndex((item) => item.id === current)))
            const stored = getDuneColors()
            setColors(stored)
            setDrafts(stored)
          }
          return next
        })
        return
      }

      if (!open) return

      const typing = event.target instanceof HTMLInputElement

      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }

      if (typing) return

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActive((index) => (index + 1) % MODES.length)
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActive((index) => (index - 1 + MODES.length) % MODES.length)
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        pick(MODES[active]?.id ?? 'desktop')
      }
    }

    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, active, close, pick])

  useEffect(() => {
    if (!open) return
    const selected = panelRef.current?.querySelector<HTMLButtonElement>('.command-item.is-active')
    selected?.focus()
  }, [open, active])

  if (!open) return null

  return (
    <div
      className="command-scrim"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div
        ref={panelRef}
        className="command-menu glass"
        role="dialog"
        aria-modal="true"
        aria-label="Command"
      >
        <p className="command-kicker">Mode</p>
        {MODES.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={[
              'command-item',
              index === active ? 'is-active' : '',
              item.id === mode ? 'is-selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onMouseEnter={() => setActive(index)}
            onClick={() => pick(item.id)}
          >
            <span className="command-item-copy">
              <span className="command-item-label">{item.label}</span>
              <span className="command-item-hint">{item.hint}</span>
            </span>
            {item.id === mode ? (
              <span className="command-check" aria-hidden>
                ✓
              </span>
            ) : null}
          </button>
        ))}

        {/* Dune color picker hidden for now — keep wiring (duneColors + localStorage). */}
        {false && (
        <div className="command-colors">
          <div className="command-color-head">
            <p className="command-kicker">Dune color</p>
            <button
              type="button"
              className="command-reset"
              onClick={() => {
                resetDuneColors()
                const next = DEFAULT_DUNE_COLORS
                setColors(next)
                setDrafts(next)
              }}
            >
              Reset
            </button>
          </div>
          {COLOR_ROWS.map((row) => (
            <ColorRow
              key={row.key}
              label={row.label}
              colorKey={row.key}
              value={colors[row.key]}
              draft={drafts[row.key]}
              onDraft={(next) => setDrafts((prev) => ({ ...prev, [row.key]: next }))}
            />
          ))}
        </div>
        )}
      </div>
    </div>
  )
}
