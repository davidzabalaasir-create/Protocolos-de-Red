import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { Overview } from './components/Overview'
import { PacketFlow } from './components/PacketFlow'
import { ProtocolDrawer } from './components/ProtocolDrawer'
import { Stage } from './components/Stage'
import { Toolbar } from './components/Toolbar'
import { PROTOCOLS } from './data/protocols'

type Theme = 'light' | 'dark'
const STEP_MS = 1400

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme as Theme) ?? 'dark')
  const [protocolId, setProtocolId] = useState(() => location.hash.slice(1) || 'http')
  const [step, setStep] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [drawer, setDrawer] = useState(false)
  const [layerFilter, setLayerFilter] = useState<number | null>(null)

  const protocol = PROTOCOLS.find((p) => p.id === protocolId) ?? PROTOCOLS[0]
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
  }, [protocol.id, protocol.name])

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

  const select = (id: string) => {
    setProtocolId(id)
    setStep(-1)
    setPlaying(false)
    setDrawer(false)
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-accent px-4 py-2 text-accent-fg focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <Header theme={theme} onTheme={setTheme} onOpenMenu={() => setDrawer(true)} />
      <Toolbar
        currentLayer={protocol.layer}
        onSelect={select}
        onLayer={(l) => {
          setLayerFilter(l)
          setDrawer(true)
        }}
      />

      <main id="main" className="flex flex-1 flex-col gap-3 px-3 pb-3 sm:px-4">
        <h1 className="sr-only">Protocolos de Red: {protocol.name}</h1>
        <div className="grid gap-3 lg:grid-cols-[1fr_minmax(18rem,22rem)]">
          <Stage protocol={protocol} step={step} durationMs={STEP_MS / speed} />
          <Overview protocol={protocol} />
        </div>
        <PacketFlow
          protocol={protocol}
          step={step}
          playing={playing}
          speed={speed}
          onSpeed={setSpeed}
          onStep={(i) => {
            setPlaying(false)
            setStep(Math.max(0, Math.min(i, last)))
          }}
          onPlay={() => {
            if (playing) return setPlaying(false)
            if (step >= last) setStep(-1)
            setPlaying(true)
          }}
          onReset={() => {
            setPlaying(false)
            setStep(-1)
          }}
        />
      </main>

      <footer className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        Diseñado por <strong className="text-fg">David</strong> · Inspirado en Protocol Explorer · Hecho con React y Tailwind CSS
      </footer>

      <ProtocolDrawer
        open={drawer}
        layer={layerFilter}
        currentId={protocol.id}
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
