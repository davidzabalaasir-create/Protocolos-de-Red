import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { packetTiming } from './lib/timing'
import { lessonUrl, parseUrl } from './lib/url'
import { Header } from './components/Header'
import { PacketFlow } from './components/PacketFlow'
import { ProtocolDrawer, ProtocolSidebar } from './components/ProtocolDrawer'
import { SidePanel, type PanelTab } from './components/SidePanel'
import { Stage } from './components/Stage'
import { Toolbar } from './components/Toolbar'
import { TourBar } from './components/TourBar'
import { partnerOf } from './lib/pairs'

const Compare = lazy(() => import('./components/Compare').then((m) => ({ default: m.Compare })))
const Exam = lazy(() => import('./components/Exam').then((m) => ({ default: m.Exam })))
const EmbedDialog = lazy(() => import('./components/EmbedDialog').then((m) => ({ default: m.EmbedDialog })))
import { EmbedFrame } from './components/EmbedFrame'
import { PROTOCOLS } from './data/protocols'
import { displayName, localize, useLang, useT } from './i18n'
import { TOUR } from './data/tour'
import { QUIZ_COUNT } from './data/quiz-count'
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

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme as Theme) ?? 'dark')
  const initial = useMemo(() => parseUrl(), [])
  const [protocolId, setProtocolId] = useState(() => initial.id ?? 'http')
  const [step, setStep] = useState(() => {
    const lesson = PROTOCOLS.find((p) => p.id === (initial.id ?? 'http'))
    return initial.step !== null && lesson ? Math.max(-1, Math.min(initial.step, lesson.packets.length - 1)) : -1
  })
  const [compare, setCompare] = useState<[string, string] | null>(initial.compare)
  const [exam, setExam] = useState(initial.exam)
  const embed = initial.embed
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
  // wide screens get a fixed sidebar (remembered open/closed); narrow ones use the drawer
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && matchMedia('(min-width: 1280px)').matches)
  useEffect(() => {
    const mq = matchMedia('(min-width: 1280px)')
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  const [sidebar, setSidebarState] = useState(() => safeGet('protocolos:list') !== '0')
  const setSidebar = useCallback((v: boolean) => {
    setSidebarState(v)
    safeSet('protocolos:list', v ? '1' : '0')
  }, [])
  const showSidebar = wide && sidebar && !focus
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

  // keep the address in sync: a new lesson is a new history entry, a new step just updates it
  const lastId = useRef(protocol.id)
  useEffect(() => {
    const url = compare ? `${lessonUrl(protocol.id, -1, embed)}#comparar=${compare.join(',')}` : exam ? `${lessonUrl(protocol.id, -1, embed)}#examen` : lessonUrl(protocol.id, step, embed)
    if (location.pathname + location.search + location.hash === url) return
    if (lastId.current !== protocol.id) history.pushState(null, '', url)
    else history.replaceState(null, '', url)
    lastId.current = protocol.id
  }, [protocol.id, step, compare, exam, embed])
  useEffect(() => {
    document.title = `${protocol.name} · Protocolos de Red`
    document.documentElement.lang = lang
  }, [protocol.name, lang])

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
    const id = setTimeout(() => setStep((s) => s + 1), step < 0 ? 50 : packetTiming(protocol, step).total / speed)
    return () => clearTimeout(id)
  }, [playing, step, last, speed, protocol])

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
  const [embedOpen, setEmbedOpen] = useState(false)
  const openCompare = useCallback((id: string) => setCompare([id, partnerOf(id)]), [])
  const openEmbed = useCallback(() => setEmbedOpen(true), [])
  const openExam = useCallback(() => {
    setDrawer(false)
    setExam(true)
  }, [])
  const hideSidebar = useCallback(() => setSidebar(false), [setSidebar])
  const closeDrawer = useCallback(() => {
    setDrawer(false)
    setLayerFilter(null)
  }, [])
  const onScore = useCallback((score: number) => setQuizScore(protocolId, score), [protocolId, setQuizScore])
  const openMenu = useCallback(() => {
    if (wide && !focus) setSidebar(!sidebar)
    else setDrawer(true)
  }, [wide, focus, sidebar, setSidebar])
  const openLayer = useCallback(
    (l: number) => {
      setLayerFilter(l)
      if (wide && !focus) setSidebar(true)
      else setDrawer(true)
    },
    [wide, focus, setSidebar],
  )

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

  // follow links typed in the address bar, shared, or reached with Back/Forward
  useEffect(() => {
    const onNav = () => {
      const r = parseUrl()
      setCompare(r.compare)
      setExam(r.exam)
      const changed = !!r.id && r.id !== lastId.current
      if (changed) {
        lastId.current = r.id!
        setProtocolId(r.id!)
        setPlaying(false)
      }
      const lesson = PROTOCOLS.find((p) => p.id === (r.id ?? lastId.current))
      // a bare in-page anchor (like the skip link) must not reset the lesson
      if (r.step !== null && lesson) setStep(Math.max(-1, Math.min(r.step, lesson.packets.length - 1)))
      else if (changed) setStep(-1)
    }
    window.addEventListener('hashchange', onNav)
    window.addEventListener('popstate', onNav)
    return () => {
      window.removeEventListener('hashchange', onNav)
      window.removeEventListener('popstate', onNav)
    }
  }, [])

  if (embed)
    return (
      <EmbedFrame protocol={protocol}>
        <Stage protocol={protocol} step={step} speed={speed} onStep={goTo} onReplay={replay} onQuiz={openQuiz} next={null} onNext={select} focus onFocus={() => {}} />
        <PacketFlow protocol={protocol} step={step} playing={playing} speed={speed} onSpeed={setSpeed} onStep={goTo} onPlay={togglePlay} onReset={reset} onInspect={goTo} />
      </EmbedFrame>
    )

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

      <div className="flex flex-1 items-start gap-3 px-3 pb-3 sm:px-4">
      {showSidebar && (
        <ProtocolSidebar layer={layerFilter} currentId={protocol.id} progress={progress} onSelect={select} onLayer={setLayerFilter} onHide={hideSidebar} onExam={openExam} />
      )}
      <main id="main" className="flex min-w-0 flex-1 flex-col gap-3">
        <h1 className="sr-only">Protocolos de Red: {protocol.name}</h1>
        <TourBar currentId={protocol.id} onSelect={select} watched={progress.watched} />
        <div className={`grid items-start gap-3 ${focus ? '' : 'lg:grid-cols-[1fr_minmax(20rem,26rem)]'}`}>
          <Stage protocol={protocol} step={step} speed={speed} onStep={goTo} onReplay={replay} onQuiz={openQuiz} next={next} onNext={select} focus={focus} onFocus={toggleFocus} />
          {!focus && (
          <SidePanel
            protocol={protocol}
            step={step}
            tab={tab}
            onTab={setTab}
            done={isDone(progress, protocol.id, QUIZ_COUNT[protocol.id] ?? 0)}
            bestScore={progress.quiz[protocol.id]}
            onScore={onScore}
            onSelect={select}
            onCompare={openCompare}
            onEmbed={openEmbed}
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
      </div>

      <footer className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        {t('Diseñado por')}{' '}<a href="https://github.com/davidzabalaasir-create" target="_blank" rel="noopener noreferrer" className="font-bold text-fg underline">David</a> · {t('Inspirado en Protocol Explorer · Hecho con React y Tailwind CSS')} · <a href="/privacidad/" className="underline">{t('Privacidad')}</a>
      </footer>

      <ProtocolDrawer
        open={drawer}
        layer={layerFilter}
        currentId={protocol.id}
        progress={progress}
        onClose={closeDrawer}
        onSelect={select}
        onLayer={setLayerFilter}
        onExam={openExam}
      />
      <Suspense fallback={null}>
        {compare && <Compare pair={compare} onChange={setCompare} onClose={() => setCompare(null)} />}
        {exam && <Exam progress={progress} onClose={() => setExam(false)} />}
        {embedOpen && <EmbedDialog protocol={protocol} onClose={() => setEmbedOpen(false)} />}
      </Suspense>
    </div>
  )
}
