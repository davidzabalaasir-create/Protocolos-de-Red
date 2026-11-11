import { useCallback, useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { PacketFlow } from './components/PacketFlow'
import { ProtocolDrawer } from './components/ProtocolDrawer'
import { SidePanel, type PanelTab } from './components/SidePanel'
import { Stage } from './components/Stage'
import { Toolbar } from './components/Toolbar'
import { TourBar } from './components/TourBar'
import { PROTOCOLS } from './data/protocols'
import { displayName, localize, useLang, useT } from './i18n'
import { TOUR } from './data/tour'
import { QUIZ } from './data/quiz'
import { isDone, useProgress } from './lib/progress'

type Theme = 'light' | 'dark'

/** localStorage can throw (private mode, blocked storage): never let that break the app. */
const safeGet = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const safeSet = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* ignore */
  }
}
const STEP_MS = 1400

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme as Theme) ?? 'dark')
  const [protocolId, setProtocolId] = useState(() => location.hash.slice(1) || 'http')
  const [step, setStep] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeedState] = useState(() => {
    const v = Number(safeGet('protocolos:speed'))
    return [0.5, 1, 2].includes(v) ? v : 1
  })
  const setSpeed = useCallback((v: number) => {
    setSpeedState(v)
    safeSet('protocolos:speed', String(v))
  }, [])
  const [focus, setFocus] = useState(() => safeGet('protocolos:focus') === '1')
  const toggleFocus = useCallback(() => {
    setFocus((f) => {
      safeSet('protocolos:focus', f ? '0' : '1')
      return !f
    })
  }, [])
  const [drawer, setDrawer] = useState(false)
  const [layerFilter, setLayerFilter] = useState<number | null>(null)
  const [tab, setTab] = useState<PanelTab>('overview')
  const { progress, markWatched, setQuizScore } = useProgress()

  const t = useT()
  const lang = useLang()
  const protocol = localize(PROTOCOLS.find((p) => p.id === protocolId) ?? PROTOCOLS[0], lang)
  const last = protocol.packets.length - 1

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('protocolos:theme', theme)
    } catch {
      /* storage unavailable */
    }
  }, [theme])

  useEffect(() => {
    history.replaceState(null, '', `#${protocol.id}`)
    document.title = `${protocol.name} · Protocolos de Red`
    document.documentElement.lang = lang
  }, [protocol.id, protocol.name, lang])

  // a lesson counts as watched once its last packet is reached
  useEffect(() => {
    if (step === last) markWatched(protocol.id)
  }, [step, last, protocol.id, markWatched])

  // playback
  useEffect(() => {
    if (!playing) return
    if (step >= last) {
      setPlaying(false)
      return
    }
    const id = setTimeout(() => setStep((s) => s + 1), step < 0 ? 50 : STEP_MS / speed)
    return () => clearTimeout(id)
  }, [playing, step, last, speed])

  const select = useCallback((id: string) => {
    setProtocolId(id)
    setStep(-1)
    setPlaying(false)
    setDrawer(false)
  }, [])

  // Stable callbacks so the memoized Stage / PacketFlow / rows don't re-render needlessly.
  const goTo = useCallback(
    (i: number) => {
      setPlaying(false)
      setStep(Math.max(0, Math.min(i, last)))
    },
    [last],
  )
  const togglePlay = useCallback(() => {
    setPlaying((was) => {
      if (!was) setStep((s) => (s >= last ? -1 : s))
      return !was
    })
  }, [last])
  const reset = useCallback(() => {
    setPlaying(false)
    setStep(-1)
  }, [])
  const inspect = useCallback(
    (i: number) => {
      goTo(i)
      setTab('inspector')
    },
    [goTo],
  )
  const replay = useCallback(() => {
    setStep(-1)
    setPlaying(true)
  }, [])
  const openQuiz = useCallback(() => setTab('quiz'), [])
  const onScore = useCallback((score: number) => setQuizScore(protocolId, score), [protocolId, setQuizScore])
  const openMenu = useCallback(() => setDrawer(true), [])
  const openLayer = useCallback((l: number) => {
    setLayerFilter(l)
    setDrawer(true)
  }, [])

  // next lesson: the guided tour's next stop, otherwise the next one in the catalogue
  const next = useMemo(() => {
    const tourIdx = TOUR.findIndex((s) => s.id === protocol.id)
    const id = tourIdx >= 0 ? TOUR[tourIdx + 1]?.id : PROTOCOLS[PROTOCOLS.findIndex((p) => p.id === protocol.id) + 1]?.id
    const p = id ? PROTOCOLS.find((x) => x.id === id) : undefined
    return p ? { id: p.id, name: displayName(lang, p) } : null
  }, [protocol.id, lang])

  // F toggles focus mode (when not typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'f' || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, dialog[open]')) return
      toggleFocus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleFocus])

  // follow #protocol links typed in the address bar or shared
  useEffect(() => {
    const onHash = () => {
      const id = location.hash.slice(1)
      if (PROTOCOLS.some((p) => p.id === id)) select(id)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [select])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-accent px-4 py-2 text-accent-fg focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        {t('Saltar al contenido')}
      </a>
      <Header theme={theme} onTheme={setTheme} onOpenMenu={openMenu} />
      <Toolbar
        currentLayer={protocol.layer}
        onSelect={select}
        onLayer={openLayer}
      />

      <main id="main" className="flex flex-1 flex-col gap-3 px-3 pb-3 sm:px-4">
        <h1 className="sr-only">Protocolos de Red: {protocol.name}</h1>
        <TourBar currentId={protocol.id} onSelect={select} watched={progress.watched} />
        <div className={`grid items-start gap-3 ${focus ? '' : 'lg:grid-cols-[1fr_minmax(20rem,26rem)]'}`}>
          <Stage protocol={protocol} step={step} durationMs={STEP_MS / speed} onStep={goTo} onReplay={replay} onQuiz={openQuiz} next={next} onNext={select} focus={focus} onFocus={toggleFocus} />
          {!focus && (
          <SidePanel
            protocol={protocol}
            step={step}
            tab={tab}
            onTab={setTab}
            done={isDone(progress, protocol.id, QUIZ[protocol.id]?.length ?? 0)}
            bestScore={progress.quiz[protocol.id]}
            onScore={onScore}
          />
          )}
        </div>
        <PacketFlow
          protocol={protocol}
          step={step}
          playing={playing}
          speed={speed}
          onSpeed={setSpeed}
          onStep={goTo}
          onPlay={togglePlay}
          onReset={reset}
          onInspect={inspect}
        />
      </main>

      <footer className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        {t('Diseñado por')}{' '}<a href="https://github.com/davidzabalaasir-create" target="_blank" rel="noopener noreferrer" className="font-bold text-fg underline">David</a> · {t('Inspirado en Protocol Explorer · Hecho con React y Tailwind CSS')}
      </footer>

      <ProtocolDrawer
        open={drawer}
        layer={layerFilter}
        currentId={protocol.id}
        progress={progress}
        onClose={() => {
          setDrawer(false)
          setLayerFilter(null)
        }}
        onSelect={select}
        onLayer={setLayerFilter}
      />
    </div>
  )
}
