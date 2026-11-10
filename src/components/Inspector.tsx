import { ChevronDown } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import type { Packet } from '../data/protocols'
import { decodePacket, type Field } from '../lib/decode'

const BYTES_PER_ROW = 8

interface Props {
  packet: Packet | null
  index: number
}

/** Byte-by-byte decode of the current packet: layer tree on top, linked hex dump below. */
export const Inspector = memo(function Inspector({ packet, index }: Props) {
  const frame = useMemo(() => (packet ? decodePacket(packet) : null), [packet])
  const [hover, setHover] = useState<{ start: number; len: number } | null>(null)
  const [closed, setClosed] = useState<Set<string>>(new Set(['eth']))

  if (!packet || !frame) {
    return (
      <div className="grid flex-1 place-items-center p-6 text-center text-sm text-muted">
        <p>
          Pulsa <strong className="text-fg">Paso</strong> o elige un paquete de la tabla para ver cada byte decodificado.
        </p>
      </div>
    )
  }

  const total = frame.bytes.length
  const layerOf = (i: number) => frame.layers.find((l) => i >= l.start && i < l.start + l.len)
  const inHover = (i: number) => hover && i >= hover.start && i < hover.start + hover.len
  const toggle = (id: string) =>
    setClosed((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const rows: number[][] = []
  for (let i = 0; i < total; i += BYTES_PER_ROW) rows.push(Array.from(frame.bytes.slice(i, i + BYTES_PER_ROW)))

  const fieldProps = (f: Field) => ({
    onMouseEnter: () => setHover(f),
    onMouseLeave: () => setHover(null),
    onFocus: () => setHover(f),
    onBlur: () => setHover(null),
  })

  return (
    <div className="flex flex-col gap-3 p-4 text-xs">
      <p className="text-sm">
        <strong>Paquete {index + 1}</strong> · {packet.proto} · <span className="text-muted">{total + frame.truncated} bytes</span>
      </p>

      {/* encapsulation bar */}
      <div aria-hidden className="flex h-3 overflow-hidden rounded-full">
        {frame.layers.map((l) => (
          <div key={l.id} title={`${l.name}: ${l.len} bytes`} style={{ flexGrow: l.len, background: l.color }} />
        ))}
      </div>
      <p className="sr-only">
        Encapsulación: {frame.layers.map((l) => `${l.name} ${l.len} bytes`).join(', ')}.
      </p>

      <ul className="flex flex-col gap-1.5">
        {frame.layers.map((l) => {
          const open = !closed.has(l.id)
          return (
            <li key={l.id} className="overflow-hidden rounded-md border border-line">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => toggle(l.id)}
                onMouseEnter={() => setHover(l)}
                onMouseLeave={() => setHover(null)}
                className="flex min-h-10 w-full items-center gap-2 bg-panel-2 px-3 text-left font-bold transition-colors hover:brightness-110"
              >
                <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ background: l.color }} />
                <span className="flex-1">{l.name}</span>
                <span className="font-normal text-muted">{l.len} B</span>
                <ChevronDown aria-hidden className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              {open && (
                <dl className="divide-y divide-line">
                  {l.fields.map((f) => (
                    <div
                      key={f.name + f.start}
                      tabIndex={0}
                      {...fieldProps(f)}
                      className="grid cursor-default grid-cols-[minmax(7rem,40%)_1fr] gap-2 px-3 py-1.5 outline-none hover:bg-panel-2 focus-visible:bg-panel-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                    >
                      <dt className="text-muted">{f.name}</dt>
                      <dd className="break-words">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          )
        })}
      </ul>

      <figure>
        <figcaption className="mb-1 text-[11px] font-bold tracking-widest text-muted uppercase">Bytes en el cable</figcaption>
        <div aria-hidden className="overflow-x-auto rounded-md border border-line bg-bg p-2 leading-5 tabular-nums">
          {rows.map((r, ri) => (
            <div key={ri} className="flex gap-3 whitespace-pre">
              <span className="text-muted">{(ri * BYTES_PER_ROW).toString(16).padStart(4, '0')}</span>
              <span className="flex gap-1">
                {r.map((b, bi) => {
                  const i = ri * BYTES_PER_ROW + bi
                  const l = layerOf(i)
                  return (
                    <span
                      key={bi}
                      className={`rounded-sm px-px transition-colors ${inHover(i) ? 'bg-accent text-accent-fg' : ''}`}
                      style={inHover(i) ? undefined : { boxShadow: `inset 0 -2px 0 ${l?.color ?? 'transparent'}` }}
                    >
                      {b.toString(16).padStart(2, '0')}
                    </span>
                  )
                })}
              </span>
              <span className="text-muted">
                {r.map((b, bi) => {
                  const i = ri * BYTES_PER_ROW + bi
                  return (
                    <span key={bi} className={inHover(i) ? 'bg-accent text-accent-fg' : ''}>
                      {b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '·'}
                    </span>
                  )
                })}
              </span>
            </div>
          ))}
          {frame.truncated > 0 && <p className="mt-1 text-muted">… {frame.truncated} bytes más</p>}
        </div>
        <p className="mt-1 text-[11px] text-muted">Pasa el ratón o el foco por un campo para resaltar sus bytes.</p>
      </figure>
    </div>
  )
})
