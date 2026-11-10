import { ChevronLeft, Pause, Play, RotateCcw, StepForward } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { KIND_META, addrOf, type Protocol } from '../data/protocols'

interface Props {
  protocol: Protocol
  step: number
  playing: boolean
  speed: number
  onStep: (i: number) => void
  onPlay: () => void
  onSpeed: (s: number) => void
  onReset: () => void
}

export function PacketFlow({ protocol, step, playing, speed, onStep, onPlay, onSpeed, onReset }: Props) {
  const kinds = [...new Set(protocol.packets.map((p) => p.kind))]
  const last = protocol.packets.length - 1
  const rowRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    rowRef.current?.scrollIntoView({ block: 'nearest' })
  }, [step])

  const base =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-xs font-bold uppercase disabled:cursor-not-allowed disabled:opacity-50'
  const btn = `${base} border-line-strong bg-panel hover:bg-panel-2`
  const primary = `${base} border-accent bg-accent text-accent-fg hover:brightness-110`

  return (
    <section aria-labelledby="flow-title" className="rounded-lg border border-line bg-panel">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2">
        <h2 id="flow-title" className="text-base font-bold tracking-widest uppercase">
          Flujo de paquetes
        </h2>
        <ul aria-label="Leyenda" className="flex flex-wrap gap-3 text-xs">
          {kinds.map((k) => (
            <li key={k} className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: KIND_META[k].color }} />
              {KIND_META[k].label}
            </li>
          ))}
        </ul>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="speed">
            Velocidad
          </label>
          <select
            id="speed"
            value={speed}
            onChange={(e) => onSpeed(Number(e.target.value))}
            className="min-h-11 rounded-md border border-line-strong bg-panel px-2 text-xs"
          >
            {[0.5, 1, 2].map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
          <button type="button" className={btn} onClick={() => onStep(step - 1)} disabled={step <= 0}>
            <ChevronLeft aria-hidden className="size-4" />
            <span className="sr-only">Paquete anterior</span>
          </button>
          <button type="button" onClick={onPlay} className={primary}>
            {playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
            {playing ? 'Pausa' : 'Reproducir'}
          </button>
          <button type="button" className={btn} onClick={() => onStep(step + 1)} disabled={step >= last}>
            <StepForward aria-hidden className="size-4" />
            Paso
          </button>
          <button type="button" className={btn} onClick={onReset}>
            <RotateCcw aria-hidden className="size-4" />
            <span className="sr-only">Reiniciar</span>
          </button>
        </div>
      </div>

      <div className="max-h-72 overflow-auto">
        <table className="w-full min-w-[46rem] text-left text-xs">
          <caption className="sr-only">
            Paquetes de {protocol.name}. Selecciona una fila para ir a ese paquete.
          </caption>
          <thead className="sticky top-0 bg-panel">
            <tr className="text-[11px] tracking-wider uppercase">
              {['N.º', 'Tiempo', 'Origen', 'Destino', 'Protocolo', 'Info', 'Tamaño'].map((h) => (
                <th key={h} scope="col" className="px-4 py-2 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {protocol.packets.map((p, i) => (
              <tr
                key={i}
                ref={i === step ? rowRef : undefined}
                aria-current={i === step ? 'step' : undefined}
                className="border-t border-line aria-[current]:bg-panel-2 aria-[current]:outline aria-[current]:outline-1 aria-[current]:outline-accent"
              >
                <td className="px-4 py-1.5">
                  <button
                    type="button"
                    onClick={() => onStep(i)}
                    className="grid size-7 place-items-center rounded-full text-[11px] font-bold text-[#0b1020]"
                    style={{ background: KIND_META[p.kind].color }}
                  >
                    {i + 1}
                    <span className="sr-only">: ir a este paquete</span>
                  </button>
                </td>
                <td className="px-4 py-1.5 tabular-nums">{p.t.toFixed(3)}s</td>
                <td className="px-4 py-1.5">{addrOf(p.from)}</td>
                <td className="px-4 py-1.5">{addrOf(p.to)}</td>
                <td className="px-4 py-1.5">{p.proto}</td>
                <td className="px-4 py-1.5">{p.info}</td>
                <td className="px-4 py-1.5 tabular-nums">{p.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
