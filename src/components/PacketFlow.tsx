import { Binary, ChevronLeft, Download, Pause, Play, RotateCcw, StepForward } from 'lucide-react'
import { memo, useEffect, useRef, type Ref } from 'react'
import { KIND_META, kindColor, addrOf, type Packet, type Protocol } from '../data/protocols'
import { downloadPcapng } from '../lib/pcap'
import { Button } from './ui/Button'

interface Props {
  protocol: Protocol
  step: number
  playing: boolean
  speed: number
  onStep: (i: number) => void
  onPlay: () => void
  onSpeed: (s: number) => void
  onReset: () => void
  onInspect: (i: number) => void
}

const SPEEDS = [0.5, 1, 2]

/** Shortcuts only fire when focus isn't in something that already uses those keys. */
function isInteractiveTarget(el: EventTarget | null) {
  return el instanceof HTMLElement && !!el.closest('input, select, textarea, button, a, [role="tab"], [role="radio"], dialog[open]')
}

export const PacketFlow = memo(function PacketFlow({ protocol, step, playing, speed, onStep, onPlay, onSpeed, onReset, onInspect }: Props) {
  const kinds = [...new Set(protocol.packets.map((p) => p.kind))]
  const total = protocol.packets.length
  const last = total - 1
  const rowRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    rowRef.current?.scrollIntoView({ block: 'nearest' })
  }, [step])

  // Space: play/pause · ←/→: previous/next · R: restart
  const latest = useRef({ step, onStep, onPlay, onReset })
  useEffect(() => {
    latest.current = { step, onStep, onPlay, onReset }
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isInteractiveTarget(e.target)) return
      const { step, onStep, onPlay, onReset } = latest.current
      if (e.key === ' ') onPlay()
      else if (e.key === 'ArrowRight') onStep(step + 1)
      else if (e.key === 'ArrowLeft') onStep(step - 1)
      else if (e.key.toLowerCase() === 'r') onReset()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const shown = Math.max(step + 1, 0)

  return (
    <section aria-labelledby="flow-title" className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2">
        <h2 id="flow-title" className="text-base font-bold tracking-widest uppercase">
          Flujo de paquetes
        </h2>
        <ul aria-label="Leyenda" className="flex flex-wrap gap-3 text-xs">
          {kinds.map((k) => (
            <li key={k} className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: kindColor(k) }} />
              {KIND_META[k].label}
            </li>
          ))}
        </ul>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Velocidad" className="flex gap-0.5 rounded-lg border border-line-strong bg-panel p-1 shadow-sm">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={speed === s}
                onClick={() => onSpeed(s)}
                className="min-h-9 min-w-11 rounded-md px-2 text-xs font-bold tabular-nums hover:bg-panel-2 aria-checked:bg-accent aria-checked:text-accent-fg"
              >
                {s}×
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="icon" label="Paquete anterior" shortcut="←" onClick={() => onStep(step - 1)} disabled={step <= 0}>
              <ChevronLeft aria-hidden className="size-5" />
            </Button>
            <Button variant="primary" className="min-w-36" label={playing ? 'Pausar' : 'Reproducir'} shortcut="Espacio" onClick={onPlay}>
              {playing ? <Pause aria-hidden className="size-4 fill-current" /> : <Play aria-hidden className="size-4 fill-current" />}
              {playing ? 'Pausa' : step >= last ? 'Repetir' : 'Reproducir'}
            </Button>
            <Button label="Siguiente paquete" shortcut="→" onClick={() => onStep(step + 1)} disabled={step >= last}>
              <StepForward aria-hidden className="size-4" />
              Paso
            </Button>
            <Button size="icon" variant="ghost" label="Reiniciar" shortcut="R" onClick={onReset} disabled={step < 0}>
              <RotateCcw aria-hidden className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" label="Descargar la captura (.pcapng, se abre en Wireshark)" onClick={() => downloadPcapng(protocol)}>
              <Download aria-hidden className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-line px-4 py-1.5 text-[11px] text-muted">
        <div
          role="progressbar"
          aria-label="Progreso de la captura"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={shown}
          aria-valuetext={`Paquete ${shown} de ${total}`}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2"
        >
          <div
            className="h-full origin-left rounded-full bg-accent"
            style={{ transform: `scaleX(${total ? shown / total : 0})` }}
          />
        </div>
        <span className="tabular-nums">
          {shown}/{total}
        </span>
        <span className="hidden sm:inline">
          <kbd className="rounded border border-line px-1">Espacio</kbd> reproducir · <kbd className="rounded border border-line px-1">←</kbd>
          <kbd className="ml-0.5 rounded border border-line px-1">→</kbd> mover
        </span>
      </div>

      <div className="max-h-72 overflow-auto">
        <table className="w-full min-w-[46rem] text-left text-xs">
          <caption className="sr-only">Paquetes de {protocol.name}. Selecciona una fila para ir a ese paquete.</caption>
          <thead className="sticky top-0 z-10 bg-panel">
            <tr className="text-[11px] tracking-wider uppercase">
              {['N.º', 'Tiempo', 'Origen', 'Destino', 'Protocolo', 'Info', 'Tamaño', 'Bytes'].map((h) => (
                <th key={h} scope="col" className="px-4 py-2 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {protocol.packets.map((p, i) => (
              <Row key={i} p={p} i={i} current={i === step} onStep={onStep} onInspect={onInspect} rowRef={i === step ? rowRef : undefined} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
})

/** Memoized so a step change only re-renders the two rows whose state changed. */
const Row = memo(function Row({ p, i, current, onStep, onInspect, rowRef }: { p: Packet; i: number; current: boolean; onStep: (i: number) => void; onInspect: (i: number) => void; rowRef?: Ref<HTMLTableRowElement> }) {
  return (
    <tr
      ref={rowRef}
      aria-current={current ? 'step' : undefined}
      onClick={() => onStep(i)}
      className="cursor-pointer border-t border-line hover:bg-panel-2 aria-[current]:bg-panel-2 aria-[current]:shadow-[inset_3px_0_0_var(--accent)]"
    >
      <td className="px-4 py-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onStep(i)
          }}
          className="grid size-8 place-items-center rounded-full text-[11px] font-bold text-[var(--k-on)]"
          style={{ background: kindColor(p.kind) }}
        >
          {i + 1}
          <span className="sr-only">: ir a este paquete</span>
        </button>
      </td>
      <td className="px-4 py-1 tabular-nums">{p.t.toFixed(3)}s</td>
      <td className="px-4 py-1">{addrOf(p.from)}</td>
      <td className="px-4 py-1">{addrOf(p.to)}</td>
      <td className="px-4 py-1">{p.proto}</td>
      <td className="px-4 py-1">{p.info}</td>
      <td className="px-4 py-1 tabular-nums">{p.size}</td>
      <td className="px-2 py-1">
        <button
          type="button"
          title="Ver bytes en el inspector"
          onClick={(e) => {
            e.stopPropagation()
            onInspect(i)
          }}
          className="grid size-8 place-items-center rounded-md border border-line-strong hover:border-accent hover:bg-accent hover:text-accent-fg"
        >
          <Binary aria-hidden className="size-4" />
          <span className="sr-only">Inspeccionar paquete {i + 1}</span>
        </button>
      </td>
    </tr>
  )
})
