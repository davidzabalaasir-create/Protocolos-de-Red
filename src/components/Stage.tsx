import { Camera, Cloud, Cpu, Laptop, Network, Phone, Printer, Router, Server, Wifi, Workflow, type LucideIcon } from 'lucide-react'
import { nodeLabel, useLang, useT } from '../i18n'
import { memo, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { kindColor, LINKS, NODES, addrOf, nodesFor, route, type NodeId, type NodeKind, type Packet, type Protocol } from '../data/protocols'

const ICONS: Record<NodeKind, LucideIcon> = {
  laptop: Laptop,
  router: Router,
  switch: Network,
  printer: Printer,
  cloud: Cloud,
  server: Server,
  phone: Phone,
  camera: Camera,
  wifi: Wifi,
  chip: Cpu,
}

const motionQuery = typeof window !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)') : null
const subscribeMotion = (cb: () => void) => {
  motionQuery?.addEventListener('change', cb)
  return () => motionQuery?.removeEventListener('change', cb)
}
const usePrefersReducedMotion = () => useSyncExternalStore(subscribeMotion, () => motionQuery?.matches ?? false)

type Pt = { x: number; y: number }

/** Precomputes segment lengths once so each frame is O(segments) with no allocation. */
function makePath(pts: Pt[]) {
  const segs = pts.slice(1).map((b, i) => ({ a: pts[i], b, len: Math.hypot(b.x - pts[i].x, b.y - pts[i].y) }))
  const total = segs.reduce((s, x) => s + x.len, 0)
  return (t: number): Pt => {
    let d = t * total
    for (const s of segs) {
      if (d <= s.len) {
        const k = s.len ? d / s.len : 0
        return { x: s.a.x + (s.b.x - s.a.x) * k, y: s.a.y + (s.b.y - s.a.y) * k }
      }
      d -= s.len
    }
    return pts[pts.length - 1]
  }
}

/** Crop the diagram to the nodes in use so small scenarios aren't lost in empty space. */
function viewBoxFor(ids: Set<NodeId>) {
  const ns = [...ids].map((id) => NODES[id])
  const minX = Math.min(...ns.map((n) => n.x)) - 90
  const maxX = Math.max(...ns.map((n) => n.x)) + 90
  const minY = Math.min(...ns.map((n) => n.y)) - 50
  const maxY = Math.max(...ns.map((n) => n.y)) + 80
  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`
}

interface Props {
  protocol: Protocol
  step: number
  durationMs: number
}

export const Stage = memo(function Stage({ protocol, step, durationMs }: Props) {
  const t = useT()
  const lang = useLang()
  const [view, setView] = useState<'net' | 'seq'>('net')
  const packet = step >= 0 ? protocol.packets[step] : null
  const color = packet ? kindColor(packet.kind) : ''

  const summary = packet
    ? t('Paquete {n} de {total}: {proto} de {from} a {to}. {info}.', { n: step + 1, total: protocol.packets.length, proto: packet.proto, from: nodeLabel(lang, packet.from, NODES[packet.from].label), to: nodeLabel(lang, packet.to, NODES[packet.to].label), info: packet.display ?? packet.info })
    : t('Diagrama de red de {name}. Pulsa Reproducir o Paso para empezar.', { name: protocol.name })

  const tabs = [
    ['net', 'Red', Network],
    ['seq', 'Secuencia', Workflow],
  ] as const

  return (
    <section aria-labelledby="stage-title" className="grid-bg relative flex min-h-[22rem] flex-col rounded-lg border border-line bg-panel">
      <h2 id="stage-title" className="sr-only">
        {t('Visualización')}
      </h2>
      <div role="tablist" aria-label={t('Tipo de vista')} className="m-3 flex w-fit gap-0.5 rounded-lg border border-line-strong bg-panel p-1 shadow-sm">
        {tabs.map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={view === id}
            aria-controls="stage-panel"
            tabIndex={view === id ? 0 : -1}
            onClick={() => setView(id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                const next = view === 'net' ? 'seq' : 'net'
                setView(next)
                document.getElementById(`tab-${next}`)?.focus()
              }
            }}
            className="flex min-h-10 items-center gap-1.5 rounded-md px-3 text-xs font-bold tracking-wider uppercase hover:bg-panel-2 aria-selected:bg-accent aria-selected:text-accent-fg aria-selected:shadow-sm"
          >
            <Icon aria-hidden className="size-4" />
            {t(label)}
          </button>
        ))}
      </div>

      <div id="stage-panel" role="tabpanel" aria-labelledby={`tab-${view}`} className="flex-1 px-2 pb-3">
        {view === 'net' ? (
          <NetworkDiagram protocol={protocol} packet={packet} step={step} durationMs={durationMs} summary={summary} />
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
})

/** Static topology: only re-renders when the protocol or the highlighted route changes, never per frame. */
const Topology = memo(function Topology({ visible, active, color }: { visible: Set<NodeId>; active: Set<NodeId>; color: string }) {
  const lang = useLang()
  return (
    <>
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
            <rect x={n.x - 30} y={n.y - 30} width={60} height={60} rx={10} fill="var(--panel-2)" stroke={on ? color : 'var(--line)'} strokeWidth={on ? 2.5 : 1.5} />
            <Icon x={n.x - 16} y={n.y - 16} width={32} height={32} color="var(--fg)" strokeWidth={1.5} />
            <text x={n.x} y={n.y + 50} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg)">
              {nodeLabel(lang, n.id, n.label)}
            </text>
            {n.addr && (
              <text x={n.x} y={n.y + 68} textAnchor="middle" fontSize="13" fill="var(--muted)">
                {n.addr}
              </text>
            )}
          </g>
        )
      })}
    </>
  )
})

const EMPTY = new Set<NodeId>()

function NetworkDiagram({ protocol, packet, step, durationMs, summary }: { protocol: Protocol; packet: Packet | null; step: number; durationMs: number; summary: string }) {
  const t = useT()
  const reduced = usePrefersReducedMotion()
  const visible = nodesFor(protocol)
  const viewBox = useMemo(() => viewBoxFor(visible), [visible])
  const path = packet ? route(packet.from, packet.to) : null
  const active = useMemo(() => (path ? new Set(path) : EMPTY), [path])
  const color = packet ? kindColor(packet.kind) : ''

  const dotRef = useRef<SVGGElement>(null)
  const [arrived, setArrived] = useState(false)

  // Move the packet by writing the transform directly: zero React renders while it travels.
  useLayoutEffect(() => {
    const g = dotRef.current
    if (!g || !path) return
    const at = makePath(path.map((id) => NODES[id]))
    const place = (t: number) => {
      const p = at(t)
      g.setAttribute('transform', `translate(${p.x} ${p.y})`)
    }
    setArrived(false)
    if (reduced) {
      place(1)
      setArrived(true)
      return
    }
    const ms = Math.min(durationMs * 0.8, 900)
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min((now - start) / ms, 1)
      place(t)
      if (t < 1) raf = requestAnimationFrame(tick)
      else setArrived(true)
    }
    place(0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [path, step, durationMs, reduced])

  return (
    <svg viewBox={viewBox} role="img" aria-label={summary} className="h-full max-h-[460px] w-full">
      <Topology visible={visible} active={active} color={color} />
      {packet && (
        <g ref={dotRef} aria-hidden style={{ willChange: 'transform' }}>
          <circle r={14} fill={color} opacity={0.25} />
          <circle r={8} fill={color} stroke="var(--bg)" strokeWidth={2} />
          {packet.kind === 'err' && /PERDIDO/.test(packet.info) && arrived && (
            <text y={-20} textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>
              {t('✕ perdido')}
            </text>
          )}
        </g>
      )}
    </svg>
  )
}

const SequenceDiagram = memo(function SequenceDiagram({ protocol, step, summary }: { protocol: Protocol; step: number; summary: string }) {
  const t = useT()
  const lang = useLang()
  const actors = useMemo(() => [...new Set(protocol.packets.flatMap((p) => [p.from, p.to]))], [protocol])
  const colW = 900 / actors.length
  const x = (id: NodeId) => colW * actors.indexOf(id) + colW / 2
  const rowH = 38
  const h = 70 + protocol.packets.length * rowH + 20

  return (
    <svg viewBox={`0 0 900 ${h}`} role="img" aria-label={`${t('Diagrama de secuencia.')} ${summary}`} className="w-full">
      {actors.map((id) => (
        <g key={id} aria-hidden>
          <text x={x(id)} y={22} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--fg)">
            {nodeLabel(lang, id, NODES[id].label)}
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
        const c = done ? kindColor(p.kind) : 'var(--line)'
        return (
          <g key={i} aria-hidden opacity={i === step ? 1 : done ? 0.85 : 0.5}>
            <line x1={x1} x2={x2 - dir * 8} y1={y} y2={y} stroke={c} strokeWidth={i === step ? 3 : 2} strokeDasharray={p.kind === 'err' ? '6 4' : undefined} />
            <polygon points={`${x2},${y} ${x2 - dir * 10},${y - 5} ${x2 - dir * 10},${y + 5}`} fill={c} />
            <text x={(x1 + x2) / 2} y={y - 7} textAnchor="middle" fontSize="12" fill={done ? 'var(--fg)' : 'var(--muted)'}>
              {i + 1}. {(p.display ?? p.info).length > 38 ? (p.display ?? p.info).slice(0, 37) + '…' : (p.display ?? p.info)}
            </text>
          </g>
        )
      })}
    </svg>
  )
})
