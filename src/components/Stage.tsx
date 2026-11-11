import { Network, Workflow } from 'lucide-react'
import { IsoDevice } from './IsoDevice'
import { CAMERA_MS, packetTiming } from '../lib/timing'
import { Focus, Maximize, Minimize, Minimize2 } from 'lucide-react'
import { Button } from './ui/Button'
import { StageStrip } from './StageStrip'
import { StageCard } from './StageCard'
import { LessonOutro } from './LessonOutro'
import { stagesFor } from '../lib/stages'
import { nodeLabel, useLang, useT } from '../i18n'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { kindColor, LINKS, NODES, addrOf, nodesFor, route, type NodeId, type Packet, type Protocol } from '../data/protocols'


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

type Box = { x: number; y: number; w: number; h: number }

/** Bounding box of some nodes, with room for the labels under each icon. */
function boxFor(ids: Iterable<NodeId>): Box {
  const ns = [...ids].map((id) => NODES[id])
  const minX = Math.min(...ns.map((n) => n.x)) - 90
  const maxX = Math.max(...ns.map((n) => n.x)) + 90
  const minY = Math.min(...ns.map((n) => n.y)) - 75
  const maxY = Math.max(...ns.map((n) => n.y)) + 80
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

/** Grow a box around its centre to the given aspect ratio and a minimum width (so the layout never jumps). */
function fit(b: Box, aspect: number, minW: number): Box {
  let w = Math.max(b.w, minW)
  let h = w / aspect
  if (h < b.h) {
    h = b.h
    w = h * aspect
  }
  return { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w, h }
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const toAttr = (b: Box) => `${b.x} ${b.y} ${b.w} ${b.h}`

interface Props {
  protocol: Protocol
  step: number
  speed: number
  onStep: (i: number) => void
  onReplay: () => void
  onQuiz: () => void
  next: { id: string; name: string } | null
  onNext: (id: string) => void
  focus: boolean
  onFocus: () => void
}

const VIEW_KEY = 'protocolos:view'
const savedView = (): 'net' | 'seq' => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'seq' ? 'seq' : 'net'
  } catch {
    return 'net'
  }
}

export const Stage = memo(function Stage({ protocol, step, speed, onStep, onReplay, onQuiz, next, onNext, focus, onFocus }: Props) {
  const t = useT()
  const lang = useLang()
  const [view, setViewState] = useState<'net' | 'seq'>(savedView)
  const setView = (v: 'net' | 'seq') => {
    setViewState(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      /* private mode */
    }
  }
  const sectionRef = useRef<HTMLElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  useEffect(() => {
    const on = () => setFullscreen(document.fullscreenElement === sectionRef.current)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else sectionRef.current?.requestFullscreen().catch(() => {})
  }
  const isLast = step === protocol.packets.length - 1
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
    <section ref={sectionRef} aria-labelledby="stage-title" className="grid-bg relative flex min-h-[22rem] flex-col rounded-lg border border-line bg-panel">
      <h2 id="stage-title" className="sr-only">
        {t('Visualización')}
      </h2>
      <div className="m-3 flex flex-wrap items-center justify-between gap-2">
      <div role="tablist" aria-label={t('Tipo de vista')} className="flex w-fit gap-0.5 rounded-lg border border-line-strong bg-panel p-1 shadow-sm">
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
        <div className="flex gap-1">
          <Button size="iconSm" variant="ghost" aria-pressed={focus} label={t('Modo foco')} shortcut="F" onClick={onFocus}>
            {focus ? <Minimize2 aria-hidden className="size-4" /> : <Focus aria-hidden className="size-4" />}
          </Button>
          {typeof document !== 'undefined' && document.fullscreenEnabled && (
            <Button size="iconSm" variant="ghost" aria-pressed={fullscreen} label={fullscreen ? t('Salir de pantalla completa') : t('Pantalla completa')} onClick={toggleFullscreen}>
              {fullscreen ? <Minimize aria-hidden className="size-4" /> : <Maximize aria-hidden className="size-4" />}
            </Button>
          )}
        </div>
      </div>
      <StageStrip protocol={protocol} step={step} onStep={onStep} />

      <div id="stage-panel" role="tabpanel" aria-labelledby={`tab-${view}`} className="flex-1 px-2 pb-3">
        {view === 'net' ? (
          <NetworkDiagram protocol={protocol} packet={packet} step={step} speed={speed} summary={summary} />
        ) : (
          <SequenceDiagram protocol={protocol} step={step} summary={summary} />
        )}
      </div>

      {packet && !isLast && <StageCard protocol={protocol} step={step} />}
      {packet && isLast && <LessonOutro protocol={protocol} onReplay={onReplay} onQuiz={onQuiz} next={next} onNext={onNext} />}
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
const Topology = memo(function Topology({ visible, revealed, links, delays, active, flow, segOf, stepKey, color, pageLoaded }: { visible: Set<NodeId>; revealed: Set<NodeId>; links: Set<string>; delays: Map<NodeId, number>; active: Set<NodeId>; flow: Map<string, 1 | -1>; segOf: Map<string, number>; stepKey: number; color: string; pageLoaded: boolean }) {
  const lang = useLang()
  return (
    <>
      {LINKS.filter(([a, b]) => visible.has(a) && visible.has(b)).map(([a, b]) => {
        const dir = flow.get(a + b)
        const on = dir !== undefined
        const seg = segOf.get(a + b)
        // arrowhead near the far end of the hop, pointing the way the packet travels
        const [from, to] = dir === -1 ? [NODES[b], NODES[a]] : [NODES[a], NODES[b]]
        const ang = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI
        const len = Math.hypot(to.x - from.x, to.y - from.y)
        const ax = from.x + ((to.x - from.x) * (len - 42)) / len
        const ay = from.y + ((to.y - from.y) * (len - 42)) / len
        return (
          <g key={on ? `${a + b}-${stepKey}` : a + b}>
          {on && (
            <polygon className="net-arrow" data-seg={seg} points="0,-5.5 11,0 0,5.5" fill={color} transform={`translate(${ax} ${ay}) rotate(${ang})`} aria-hidden />
          )}
          <line
            data-seg={on ? seg : undefined}
            className={`net-lane${on ? (dir === 1 ? ' is-flowing' : ' is-flowing is-reverse') : ''}`}
            data-hidden={links.has(a + b) || links.has(b + a) ? undefined : ''}
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
            stroke={on ? color : 'var(--line-strong)'}
            strokeWidth={on ? 2.6 : 1.6}
            strokeDasharray="6 5"
          />
          </g>
        )
      })}
      {[...visible].map((id) => {
        const n = NODES[id]
        const on = active.has(id)
        return (
          <g key={id} aria-hidden className="net-node" data-hidden={revealed.has(id) ? undefined : ''} style={{ transitionDelay: `${delays.get(id) ?? 0}ms` }}>
            <IsoDevice kind={n.kind} x={n.x} y={n.y} active={on} stroke={on ? color : 'var(--iso-line)'} page={id === 'client' && pageLoaded} />
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

function NetworkDiagram({ protocol, packet, step, speed, summary }: { protocol: Protocol; packet: Packet | null; step: number; speed: number; summary: string }) {
  const reduced = usePrefersReducedMotion()
  const visible = nodesFor(protocol)
  const full = useMemo(() => boxFor(visible), [visible])
  const path = packet ? route(packet.from, packet.to) : null
  const active = useMemo(() => (path ? new Set(path) : EMPTY), [path])
  const flow = useMemo(() => {
    const m = new Map<string, 1 | -1>()
    path?.slice(1).forEach((v, i) => {
      const u = path[i]
      const fwd = LINKS.some(([a, b]) => a === u && b === v)
      m.set(fwd ? u + v : v + u, fwd ? 1 : -1)
    })
    return m
  }, [path])
  const segOf = useMemo(() => {
    const m = new Map<string, number>()
    path?.slice(1).forEach((v, i) => {
      const u = path[i]
      m.set(u + v, i)
      m.set(v + u, i)
    })
    return m
  }, [path])
  const color = packet ? kindColor(packet.kind) : ''

  const dotRef = useRef<SVGGElement>(null)
  const lost = !!packet && packet.kind === 'err' && /PERDIDO/.test(packet.info)
  const [arrived, setArrived] = useState(false)

  // Move the packet by writing the transform directly: zero React renders while it travels.
  useLayoutEffect(() => {
    const g = dotRef.current
    if (!g || !path) return
    const pts = path.map((id) => NODES[id])
    const at = makePath(pts)
    // where each hop starts, as a fraction of the whole trip
    const lens = pts.slice(1).map((b, i) => Math.hypot(b.x - pts[i].x, b.y - pts[i].y))
    const totalLen = lens.reduce((a, b) => a + b, 0) || 1
    const starts = lens.map((_, i) => lens.slice(0, i).reduce((a, b) => a + b, 0) / totalLen)
    const svg = g.ownerSVGElement
    let dimTimer = 0
    const dimLater = () => {
      dimTimer = window.setTimeout(() => svg?.querySelectorAll<SVGElement>('[data-seg]').forEach((el) => el.removeAttribute('data-lit')), 900)
    }
    const light = (t: number) => {
      const reached = starts.filter((s0) => t >= s0 - 0.001).length - 1
      svg?.querySelectorAll<SVGElement>('[data-seg]').forEach((el) => {
        if (Number(el.dataset.seg) <= reached) el.setAttribute('data-lit', '')
        else el.removeAttribute('data-lit')
      })
    }
    const place = (t: number) => {
      const p = at(t)
      g.setAttribute('transform', `translate(${p.x} ${p.y})`)
      light(t)
    }
    setArrived(false)
    if (reduced) {
      g.removeAttribute('opacity')
      place(1)
      setArrived(true)
      return
    }
    const timing = packetTiming(protocol, step)
    const delay = timing.delay / speed
    const ms = timing.travel / speed
    const start = performance.now() + delay
    let raf = 0
    let fallback = 0
    const tick = (now: number) => {
      if (now < start) {
        raf = requestAnimationFrame(tick)
        return
      }
      g.removeAttribute('opacity')
      const t = Math.min((now - start) / ms, 1)
      place(t)
      if (t < 1) raf = requestAnimationFrame(tick)
      else {
        setArrived(true)
        clearTimeout(fallback)
        dimLater()
      }
    }
    // waiting for the camera: the tag is not on the wire yet
    g.setAttribute('opacity', delay > 0 ? '0' : '1')
    place(0)
    if (delay > 0) svg?.querySelectorAll<SVGElement>('[data-seg]').forEach((el) => el.removeAttribute('data-lit'))
    raf = requestAnimationFrame(tick)
    fallback = window.setTimeout(() => {
      cancelAnimationFrame(raf)
      g.removeAttribute('opacity')
      place(1)
      setArrived(true)
      dimLater()
    }, delay + ms + 250)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(fallback)
      clearTimeout(dimTimer)
    }
  }, [path, step, speed, reduced, protocol])

  // ── Camera: close-up on the first sender, zoom out to the whole network, then frame each packet's path ──
  const svgRef = useRef<SVGSVGElement>(null)
  const cam = useRef<Box | null>(null)
  const camRaf = useRef(0)
  const camFallback = useRef(0)
  const aspect = full.w / full.h

  // Like the original: only the devices the conversation has reached so far are on screen,
  // and the camera frames them, starting with a close-up of whoever speaks first.
  const { revealed, links, delays } = useMemo(() => {
    const revealed = new Set<NodeId>()
    const links = new Set<string>()
    const delays = new Map<NodeId, number>()
    const first = protocol.packets[0]?.from
    if (first) revealed.add(first)
    protocol.packets.slice(0, Math.max(step + 1, 0)).forEach((pk, i, arr) => {
      const r = route(pk.from, pk.to)
      r.forEach((id, k) => {
        if (!revealed.has(id)) {
          revealed.add(id)
          // stagger the devices that appear with the current packet along its path
          if (i === arr.length - 1) delays.set(id, k * 110)
        }
        if (k) links.add(r[k - 1] + id)
      })
    })
    return { revealed, links, delays }
  }, [protocol, step])
  const first = protocol.packets[0]?.from
  const shownProtocol = useRef<string | null>(null)

  const web = WEB_LESSONS[protocol.id]
  const [typed, setTyped] = useState(0)
  useEffect(() => {
    if (!web) return
    if (reduced || step >= 0) {
      setTyped(web.url.length)
      return
    }
    setTyped(0)
    let n = 0
    const id = setInterval(() => {
      n++
      setTyped(n)
      if (n >= web.url.length) clearInterval(id)
    }, 85)
    return () => clearInterval(id)
  }, [web, step, reduced])
  const urlBar = web && protocol.packets[0]?.from === 'client' ? { text: web.url.slice(0, typed), secure: web.secure, typing: typed < web.url.length, loaded: step === protocol.packets.length - 1 } : null
  const closeUp = first ? boxFor([first]) : full
  if (web && first === 'client') {
    closeUp.y -= 70
    closeUp.h += 70
    closeUp.w = Math.max(closeUp.w, 300)
  }
  const target = step < 0 && first ? fit(closeUp, aspect, full.w * 0.34) : fit(boxFor(revealed), aspect, full.w * 0.42)
  const targetKey = toAttr(target)

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const set = (b: Box) => {
      cam.current = b
      svg.setAttribute('viewBox', toAttr(b))
    }
    const animate = (to: Box, ms: number) => {
      cancelAnimationFrame(camRaf.current)
      const from = cam.current ?? to
      const start = performance.now()
      const tick = (now: number) => {
        const k = easeInOutCubic(Math.min((now - start) / ms, 1))
        set({ x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, w: from.w + (to.w - from.w) * k, h: from.h + (to.h - from.h) * k })
        if (k < 1) camRaf.current = requestAnimationFrame(tick)
      }
      camRaf.current = requestAnimationFrame(tick)
      // if frames are paused (hidden tab/pane), still end up on the right framing
      clearTimeout(camFallback.current)
      camFallback.current = window.setTimeout(() => {
        cancelAnimationFrame(camRaf.current)
        set(to)
      }, ms + 250)
    }

    const isNewLesson = shownProtocol.current !== protocol.id
    shownProtocol.current = protocol.id
    if (reduced || isNewLesson) set(target)
    else animate(target, CAMERA_MS / speed)
    return () => {
      cancelAnimationFrame(camRaf.current)
      clearTimeout(camFallback.current)
    }
    // targetKey captures every change of `target`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocol.id, targetKey, reduced])

  return (
    <svg ref={svgRef} role="img" aria-label={summary} className="h-full max-h-[460px] w-full">
      <Topology visible={visible} revealed={revealed} links={links} delays={delays} active={active} flow={flow} segOf={segOf} stepKey={step} color={color} pageLoaded={!!urlBar?.loaded && arrived} />
      {packet && (
        <g ref={dotRef} aria-hidden style={{ willChange: 'transform' }}>
          <PacketTag packet={packet} color={color} lost={lost && arrived} arrived={arrived && !lost} />
        </g>
      )}
      {packet && arrived && !lost && (
        <circle key={`pulse-${step}`} className="net-pulse" cx={NODES[packet.to].x} cy={NODES[packet.to].y} r={34} fill="none" stroke={color} strokeWidth={2.5} aria-hidden />
      )}
      <MilestoneNotes protocol={protocol} step={step} />
      {urlBar && <UrlBar x={NODES.client.x} y={NODES.client.y} text={urlBar.text} secure={urlBar.secure} typing={urlBar.typing} loaded={urlBar.loaded} />}
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

/** Lessons that start with the user typing an address, as in the original. */
const WEB_LESSONS: Record<string, { url: string; secure: boolean }> = {
  http: { url: 'www.ejemplo.com', secure: false },
  https: { url: 'https://www.ejemplo.com', secure: true },
  http2: { url: 'https://www.ejemplo.com', secure: true },
  http3: { url: 'https://www.ejemplo.com', secure: true },
  websocket: { url: 'www.ejemplo.com/chat', secure: false },
  tls: { url: 'https://www.ejemplo.com', secure: true },
  proxy: { url: 'https://www.ejemplo.com', secure: true },
  captive: { url: 'www.ejemplo.com', secure: false },
  nat: { url: 'www.ejemplo.com', secure: false },
}

/** Short label shown on the travelling packet (SYN, DNS QUERY, CLIENT HELLO…). */
function tagLabel(p: Packet) {
  const flags = p.info.match(/\[([A-Z, ]+)\]/)?.[1]
  if (p.proto === 'TCP' && flags) return flags.replace(/, /g, '-').replace('PSH-ACK', 'DATA')
  if (p.proto === 'DNS') return p.kind === 'req' || /Consulta/.test(p.info) ? 'DNS QUERY' : 'DNS ANSWER'
  const hello = p.info.match(/(Client|Server) Hello/)
  if (hello) return `${hello[1].toUpperCase()} HELLO`
  if (/Application Data/.test(p.info)) return 'APP DATA'
  const status = p.info.match(/^(HTTP\/[\d.]+|RTSP\/[\d.]+|SIP\/[\d.]+) (\d{3})/)
  if (status) return `${p.proto} ${status[2]}`
  const word = p.info.match(/^([A-Z][A-Z_-]{2,})\b/)?.[1]
  return (word && word.length <= 12 ? `${p.proto === word ? '' : p.proto + ' '}${word}` : p.proto).toUpperCase()
}

function PacketTag({ packet, color, lost, arrived }: { packet: Packet; color: string; lost: boolean; arrived: boolean }) {
  const label = tagLabel(packet)
  const field = (packet.display ?? packet.info).replace(/\s+/g, ' ')
  const short = field.length > 30 ? field.slice(0, 29) + '…' : field
  const locked = packet.kind === 'tls'
  const tagW = label.length * 8.2 + (locked ? 36 : 22)
  const bodyW = Math.max(tagW, short.length * 6.9 + 18)
  return (
    <g className={`net-tag${lost ? ' is-lost' : ''}${arrived ? ' is-arrived' : ''}`}>
      <rect x={-bodyW / 2} y={11} width={bodyW} height={22} rx={3} fill="var(--panel)" stroke={color} strokeWidth={1.5} />
      <text x={0} y={26} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="var(--fg)">
        {short}
      </text>
      <rect x={-tagW / 2} y={-12} width={tagW} height={24} rx={4} fill={color} />
      {locked && (
        <g transform={`translate(${-tagW / 2 + 9} -6)`} fill="none" stroke="var(--k-on)" strokeWidth={1.5} strokeLinejoin="round">
          <rect x={0} y={5} width={10} height={8} rx={1.5} />
          <path d="M2.5 5V3a2.5 2.5 0 0 1 5 0v2" />
        </g>
      )}
      <text x={locked ? 7 : 0} y={4.5} textAnchor="middle" fontSize="12.5" fontWeight="800" letterSpacing="0.06em" fill="var(--k-on)">
        {label}
      </text>
      {lost && (
        <path d="M-14 -40 l28 28 M14 -40 l-28 28" className="net-drop" stroke="var(--k-err)" strokeWidth={4} strokeLinecap="round" />
      )}
    </g>
  )
}

function UrlBar({ x, y, text, secure, typing, loaded }: { x: number; y: number; text: string; secure: boolean; typing: boolean; loaded: boolean }) {
  const w = 230
  const bx = x - 40
  const by = y - 108
  return (
    <g className="net-url" aria-hidden>
      <path d={`M${x} ${y - 32} L${x} ${by + 30}`} stroke="var(--line-strong)" strokeWidth={1.5} strokeDasharray="3 3" fill="none" />
      <rect x={bx} y={by} width={w} height={30} rx={4} fill="var(--panel)" stroke="var(--accent)" strokeWidth={1.6} />
      {secure ? (
        <g transform={`translate(${bx + 10} ${by + 8})`} fill="none" stroke="var(--k-tcp)" strokeWidth={1.6} strokeLinejoin="round">
          <rect x={0} y={6} width={11} height={8} rx={1.5} />
          <path d="M2.5 6V4a3 3 0 0 1 6 0v2" />
        </g>
      ) : (
        <g transform={`translate(${bx + 16} ${by + 15})`} fill="none" stroke="var(--accent)" strokeWidth={1.3}>
          <circle r={6} />
          <path d="M-6 0h12M0 -6c-3 3.5 -3 8.5 0 12M0 -6c3 3.5 3 8.5 0 12" />
        </g>
      )}
      <text x={bx + 30} y={by + 20} fontSize="13" fontWeight="600" fill="var(--fg)">
        {text}
        {typing && <tspan className="net-caret">|</tspan>}
      </text>
      {loaded && <path d={`M${bx + w - 22} ${by + 15} l4 4 l8 -9`} stroke="var(--k-tcp)" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    </g>
  )
}

/** Small badges under the first device once a milestone is reached (connected, encrypted…). */
function MilestoneNotes({ protocol, step }: { protocol: Protocol; step: number }) {
  const t = useT()
  const first = protocol.packets[0]?.from
  if (!first || step < 0) return null
  const stages = stagesFor(protocol)
  const doneKinds = new Set(stages.filter((s) => s.to <= step).map((s) => s.title))
  const notes: { text: string; color: string }[] = []
  if (doneKinds.has('Resolución DNS')) notes.push({ text: t('IP RESUELTA'), color: 'var(--k-dns)' })
  if (doneKinds.has('Conexión TCP') && !doneKinds.has('Cierre de la conexión')) notes.push({ text: t('CONECTADO'), color: 'var(--k-tcp)' })
  if (doneKinds.has('Saludo seguro')) notes.push({ text: t('CIFRADO'), color: 'var(--k-tls)' })
  if (doneKinds.has('Cierre de la conexión')) notes.push({ text: t('CERRADO'), color: 'var(--k-ctrl)' })
  if (!notes.length) return null
  const n = NODES[first]
  return (
    <g aria-hidden className="net-notes">
      {notes.map((note, i) => {
        const w = note.text.length * 7.6 + 26
        const y = n.y + 84 + i * 26
        return (
          <g key={note.text} className="net-note">
            <rect x={n.x - w / 2} y={y} width={w} height={21} rx={3} fill="var(--panel)" stroke={note.color} strokeWidth={1.5} />
            <circle cx={n.x - w / 2 + 11} cy={y + 10.5} r={3.5} fill={note.color} />
            <text x={n.x - w / 2 + 20} y={y + 14.5} fontSize="11" fontWeight="800" letterSpacing="0.06em" fill="var(--fg)">
              {note.text}
            </text>
          </g>
        )
      })}
    </g>
  )
}

