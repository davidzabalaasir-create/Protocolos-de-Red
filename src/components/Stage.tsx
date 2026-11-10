import { Cloud, Laptop, Network, Printer, Router, Server, Workflow, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { KIND_META, LINKS, NODES, addrOf, nodesFor, route, type NodeKind, type Protocol } from '../data/protocols'

const ICONS: Record<NodeKind, LucideIcon> = {
  laptop: Laptop,
  router: Router,
  switch: Network,
  printer: Printer,
  cloud: Cloud,
  server: Server,
}

interface Props {
  protocol: Protocol
  step: number
  durationMs: number
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/** 0 → 1 over `ms` every time `key` changes. */
function useProgress(key: string, ms: number, disabled: boolean) {
  const [p, setP] = useState(1)
  useEffect(() => {
    if (disabled) {
      setP(1)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const v = Math.min((now - start) / ms, 1)
      setP(v)
      if (v < 1) raf = requestAnimationFrame(tick)
    }
    setP(0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [key, ms, disabled])
  return p
}

function pointAlong(path: { x: number; y: number }[], t: number) {
  const segs = path.slice(1).map((b, i) => {
    const a = path[i]
    return { a, b, len: Math.hypot(b.x - a.x, b.y - a.y) }
  })
  const total = segs.reduce((s, x) => s + x.len, 0)
  let d = t * total
  for (const s of segs) {
    if (d <= s.len) {
      const k = s.len ? d / s.len : 0
      return { x: s.a.x + (s.b.x - s.a.x) * k, y: s.a.y + (s.b.y - s.a.y) * k }
    }
    d -= s.len
  }
  return path[path.length - 1]
}

/** Crop the diagram to the nodes in use so small scenarios aren't lost in empty space. */
function viewBoxFor(ids: Set<string>) {
  const ns = [...ids].map((id) => NODES[id as keyof typeof NODES])
  const minX = Math.min(...ns.map((n) => n.x)) - 90
  const maxX = Math.max(...ns.map((n) => n.x)) + 90
  const minY = Math.min(...ns.map((n) => n.y)) - 50
  const maxY = Math.max(...ns.map((n) => n.y)) + 80
  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`
}

export function Stage({ protocol, step, durationMs }: Props) {
  const [view, setView] = useState<'net' | 'seq'>('net')
  const reduced = usePrefersReducedMotion()
  const packet = step >= 0 ? protocol.packets[step] : null
  const progress = useProgress(`${protocol.id}-${step}`, Math.min(durationMs * 0.8, 900), reduced || !packet)

  const visible = new Set(nodesFor(protocol))
  const active = packet ? new Set(route(packet.from, packet.to)) : new Set()
  const pathPts = packet ? route(packet.from, packet.to).map((id) => NODES[id]) : []
  const dot = packet ? pointAlong(pathPts, progress) : null
  const color = packet ? KIND_META[packet.kind].color : ''

  const summary = packet
    ? `Paquete ${step + 1} de ${protocol.packets.length}: ${packet.proto} de ${NODES[packet.from].label} a ${NODES[packet.to].label}. ${packet.info}.`
    : `Diagrama de red de ${protocol.name}. Pulsa Reproducir o Paso para empezar.`

  return (
    <section aria-labelledby="stage-title" className="grid-bg relative flex min-h-[22rem] flex-col rounded-lg border border-line bg-panel">
      <h2 id="stage-title" className="sr-only">
        Visualización
      </h2>
      <div role="tablist" aria-label="Tipo de vista" className="m-3 flex w-fit rounded-md border border-line-strong bg-panel p-0.5 text-xs font-bold uppercase">
        {(
          [
            ['net', 'Red', Network],
            ['seq', 'Secuencia', Workflow],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={view === id}
            aria-controls="stage-panel"
            onClick={() => setView(id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                const next = view === 'net' ? 'seq' : 'net'
                setView(next)
                document.getElementById(`tab-${next}`)?.focus()
              }
            }}
            tabIndex={view === id ? 0 : -1}
            className="flex min-h-10 items-center gap-1.5 rounded px-3 aria-selected:bg-accent aria-selected:text-accent-fg"
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <div id="stage-panel" role="tabpanel" aria-labelledby={`tab-${view}`} className="flex-1 px-2 pb-3">
        {view === 'net' ? (
          <svg viewBox={viewBoxFor(visible)} role="img" aria-label={summary} className="h-full max-h-[460px] w-full">
            {LINKS.filter(([a, b]) => visible.has(a) && visible.has(b)).map(([a, b]) => {
              const on = active.has(a) && active.has(b)
              return (
                <line
                  key={a + b}
                  x1={NODES[a].x}
                  y1={NODES[a].y}
                  x2={NODES[b].x}
                  y2={NODES[b].y}
                  stroke={on ? color : 'var(--line)'}
                  strokeWidth={on ? 2.5 : 1.5}
                  strokeDasharray={on ? undefined : '4 4'}
                />
              )
            })}
            {[...visible].map((id) => {
              const n = NODES[id]
              const Icon = ICONS[n.kind]
              const on = active.has(id)
              return (
                <g key={id} aria-hidden>
                  <rect
                    x={n.x - 30}
                    y={n.y - 30}
                    width={60}
                    height={60}
                    rx={10}
                    fill="var(--panel-2)"
                    stroke={on ? color : 'var(--line)'}
                    strokeWidth={on ? 2.5 : 1.5}
                  />
                  <Icon x={n.x - 16} y={n.y - 16} width={32} height={32} color="var(--fg)" strokeWidth={1.5} />
                  <text x={n.x} y={n.y + 50} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg)">
                    {n.label}
                  </text>
                  {n.addr && (
                    <text x={n.x} y={n.y + 68} textAnchor="middle" fontSize="13" fill="var(--muted)">
                      {n.addr}
                    </text>
                  )}
                </g>
              )
            })}
            {dot && packet && (
              <g aria-hidden>
                <circle cx={dot.x} cy={dot.y} r={14} fill={color} opacity={0.25} />
                <circle cx={dot.x} cy={dot.y} r={8} fill={color} stroke="var(--bg)" strokeWidth={2} />
                {packet.kind === 'err' && progress === 1 && (
                  <text x={dot.x} y={dot.y - 20} textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>
                    ✕ perdido
                  </text>
                )}
              </g>
            )}
          </svg>
        ) : (
          <SequenceDiagram protocol={protocol} step={step} summary={summary} />
        )}
      </div>

      {packet && (
        <p className="mx-3 mb-3 rounded-md border border-line bg-panel-2 p-3 text-sm leading-relaxed">
          <span className="mr-2 inline-block size-2.5 rounded-full align-middle" style={{ background: color }} aria-hidden />
          <strong>{packet.proto}:</strong> {packet.note}
        </p>
      )}
      <p className="sr-only" aria-live="polite">
        {packet ? `${summary} ${packet.note}` : ''}
      </p>
    </section>
  )
}

function SequenceDiagram({ protocol, step, summary }: { protocol: Protocol; step: number; summary: string }) {
  const actors = [...new Set(protocol.packets.flatMap((p) => [p.from, p.to]))]
  const colW = 900 / actors.length
  const x = (id: string) => colW * actors.indexOf(id as never) + colW / 2
  const rowH = 38
  const h = 70 + protocol.packets.length * rowH + 20

  return (
    <svg viewBox={`0 0 900 ${h}`} role="img" aria-label={`Diagrama de secuencia. ${summary}`} className="w-full">
      {actors.map((id) => (
        <g key={id} aria-hidden>
          <text x={x(id)} y={22} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg)">
            {NODES[id].label}
          </text>
          <text x={x(id)} y={40} textAnchor="middle" fontSize="12" fill="var(--muted)">
            {addrOf(id)}
          </text>
          <line x1={x(id)} x2={x(id)} y1={50} y2={h - 10} stroke="var(--line)" strokeDasharray="4 4" />
        </g>
      ))}
      {protocol.packets.map((p, i) => {
        const y = 75 + i * rowH
        const x1 = x(p.from)
        const x2 = x(p.to)
        const dir = x2 > x1 ? 1 : -1
        const done = i <= step
        const c = done ? KIND_META[p.kind].color : 'var(--line)'
        return (
          <g key={i} aria-hidden opacity={i === step ? 1 : done ? 0.85 : 0.5}>
            <line x1={x1} x2={x2 - dir * 8} y1={y} y2={y} stroke={c} strokeWidth={i === step ? 3 : 2} strokeDasharray={p.kind === 'err' ? '6 4' : undefined} />
            <polygon points={`${x2},${y} ${x2 - dir * 10},${y - 5} ${x2 - dir * 10},${y + 5}`} fill={c} />
            <text x={(x1 + x2) / 2} y={y - 7} textAnchor="middle" fontSize="12" fill={done ? 'var(--fg)' : 'var(--muted)'}>
              {i + 1}. {p.info.length > 38 ? p.info.slice(0, 37) + '…' : p.info}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
