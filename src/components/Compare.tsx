import { X } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { PROTOCOLS, route, type Protocol } from '../data/protocols'
import { displayName, localize, useLang, useT } from '../i18n'
import { SequenceDiagram } from './Stage'
import { Button } from './ui/Button'

/** Natural pairings for "compare with…" */

const bytes = (size: string) => {
  const m = size.match(/([\d.]+)\s*(KB|B)/)
  return m ? Number(m[1]) * (m[2] === 'KB' ? 1024 : 1) : 0
}

function stats(p: Protocol) {
  const total = p.packets.reduce((n, k) => n + bytes(k.size), 0)
  const dur = p.packets[p.packets.length - 1].t - p.packets[0].t
  const devices = new Set(p.packets.flatMap((k) => route(k.from, k.to))).size
  const roundTrips = p.packets.filter((k, i) => i > 0 && k.from === p.packets[i - 1].to && k.to === p.packets[i - 1].from).length
  const encrypted = p.packets.some((k) => k.kind === 'tls')
  return { packets: p.packets.length, total, dur, devices, roundTrips, encrypted }
}

const fmtBytes = (n: number) => (n >= 1024 ? `${(n / 1024).toFixed(1)} KB` : `${Math.round(n)} B`)
const fmtTime = (s: number) => (s < 1 ? `${Math.round(s * 1000)} ms` : `${s.toFixed(1)} s`)

interface Props {
  pair: [string, string]
  onChange: (pair: [string, string]) => void
  onClose: () => void
}

/** Two lessons side by side: their sequence diagrams and the numbers that tell them apart. */
export function Compare({ pair, onChange, onClose }: Props) {
  const t = useT()
  const lang = useLang()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])
  const lessons = pair.map((id) => localize(PROTOCOLS.find((p) => p.id === id)!, lang)) as [Protocol, Protocol]
  const s = useMemo(() => lessons.map(stats), [lessons])

  const rows: [string, (x: ReturnType<typeof stats>) => string, (x: ReturnType<typeof stats>) => number][] = [
    [t('Paquetes'), (x) => String(x.packets), (x) => x.packets],
    [t('Tiempo total'), (x) => fmtTime(x.dur), (x) => x.dur],
    [t('Bytes'), (x) => fmtBytes(x.total), (x) => x.total],
    [t('Equipos'), (x) => String(x.devices), (x) => x.devices],
    [t('Respuestas inmediatas'), (x) => String(x.roundTrips), (x) => x.roundTrips],
    [t('Cifrado'), (x) => (x.encrypted ? t('Sí') : t('No')), () => 0],
  ]

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="compare-title" className="m-auto h-[min(92dvh,56rem)] w-[min(96vw,80rem)] max-w-none rounded-lg border border-line bg-panel p-0 text-fg">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 id="compare-title" className="text-sm font-bold tracking-widest uppercase">
          {t('Comparar protocolos')}
        </h2>
        <Button variant="ghost" size="icon" label={t('Cerrar comparación')} shortcut="Esc" onClick={onClose}>
          <X aria-hidden className="size-5" />
        </Button>
      </div>
      <div className="grid max-h-[calc(100%-3.5rem)] gap-4 overflow-y-auto p-4 lg:grid-cols-2">
        {lessons.map((lesson, i) => (
          <section key={i} aria-label={displayName(lang, lesson)} className="flex min-w-0 flex-col gap-3 rounded-lg border border-line bg-panel-2 p-3">
            <label className="flex flex-col gap-1 text-xs font-bold tracking-wider uppercase">
              {i === 0 ? t('Protocolo A') : t('Protocolo B')}
              <select
                value={lesson.id}
                onChange={(e) => onChange(i === 0 ? [e.target.value, pair[1]] : [pair[0], e.target.value])}
                className="min-h-11 rounded-lg border border-line-strong bg-panel px-2 text-sm font-normal normal-case tracking-normal"
              >
                {PROTOCOLS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {displayName(lang, p)}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm text-muted">{lesson.full}</p>
            <div className="overflow-x-auto rounded-md border border-line bg-panel p-1">
              <SequenceDiagram protocol={lesson} step={lesson.packets.length - 1} summary={t('Secuencia completa de {name}', { name: lesson.name })} />
            </div>
          </section>
        ))}
        <section aria-labelledby="compare-numbers" className="lg:col-span-2">
          <h3 id="compare-numbers" className="mb-2 text-xs font-bold tracking-widest uppercase">
            {t('En cifras')}
          </h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] tracking-wider uppercase">
                <th scope="col" className="py-1 pr-4"></th>
                <th scope="col" className="py-1 pr-4">{lessons[0].name}</th>
                <th scope="col" className="py-1 pr-4">{lessons[1].name}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, show, num]) => {
                const [a, b] = [num(s[0]), num(s[1])]
                const better = (v: number, o: number) => (label === t('Cifrado') || v === o ? '' : v < o ? 'font-bold text-green-700 dark:text-green-400' : '')
                return (
                  <tr key={label} className="border-t border-line">
                    <th scope="row" className="py-1.5 pr-4 font-normal text-muted">
                      {label}
                    </th>
                    <td className={`py-1.5 pr-4 tabular-nums ${better(a, b)}`}>{show(s[0])}</td>
                    <td className={`py-1.5 pr-4 tabular-nums ${better(b, a)}`}>{show(s[1])}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted">{t('En verde, el valor más bajo de cada fila.')}</p>
        </section>
      </div>
    </dialog>
  )
}
