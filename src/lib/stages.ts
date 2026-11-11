import { NODES, type NodeId, type Packet, type Protocol } from '../data/protocols'

/**
 * Groups a lesson's packets into stages (resolve the name, open the connection, secure it,
 * exchange data, close…) so the lesson reads as a story. Derived from the packets themselves,
 * so every lesson gets stages without hand-written data.
 */
export interface StageInfo {
  /** Translation key + variables for the title */
  title: string
  vars?: Record<string, string>
  /** For pair titles, the two endpoints (labels are translated by the caller) */
  pair?: [NodeId, NodeId]
  from: number
  to: number
}

const HANDSHAKE = /\[SYN\]|\[SYN, ACK\]|\[ACK\] Seq=1 Ack=1$/

function keyOf(p: Packet, lesson: Protocol, byPair: boolean): string | null {
  if (p.proto === 'DNS' && lesson.id !== 'dns' && lesson.id !== 'dnssec') return 'dns'
  if (p.proto === 'TCP' && HANDSHAKE.test(p.info)) return 'open'
  if (/\[FIN/.test(p.info)) return 'close'
  if (p.kind === 'tls' && !['wpa3', 'wireguard', 'ipsec'].includes(lesson.id)) return 'secure'
  if (p.proto === 'TCP') return null // plain ACKs/data belong to whatever came before
  if (byPair) return `pair:${[p.from, p.to].sort().join('|')}:${p.proto}`
  return `app:${p.proto}`
}

function build(lesson: Protocol, byPair: boolean): StageInfo[] {
  const stages: (StageInfo & { key: string })[] = []
  lesson.packets.forEach((p, i) => {
    const key = keyOf(p, lesson, byPair) ?? stages[stages.length - 1]?.key ?? 'app:' + p.proto
    const last = stages[stages.length - 1]
    if (last && last.key === key) {
      last.to = i
      return
    }
    let st: StageInfo
    if (key === 'dns') st = { title: 'Resolución DNS', from: i, to: i }
    else if (key === 'open') st = { title: 'Conexión TCP', from: i, to: i }
    else if (key === 'close') st = { title: 'Cierre de la conexión', from: i, to: i }
    else if (key === 'secure') st = { title: 'Saludo seguro', from: i, to: i }
    else if (key.startsWith('pair:')) {
      const [a, b] = key.split(':')[1].split('|') as [NodeId, NodeId]
      st = { title: '{proto}: {a} ↔ {b}', vars: { proto: p.proto }, pair: [a, b], from: i, to: i }
    } else st = { title: 'Intercambio {proto}', vars: { proto: p.proto }, from: i, to: i }
    stages.push({ ...st, key })
  })
  return stages
}

const cache = new WeakMap<Protocol, StageInfo[]>()

export function stagesFor(lesson: Protocol): StageInfo[] {
  const hit = cache.get(lesson)
  if (hit) return hit
  // Prefer "who talks to whom" stages; fall back to one stage per protocol if that gets too busy
  let stages = build(lesson, true)
  if (stages.length > 6) stages = build(lesson, false)
  cache.set(lesson, stages)
  return stages
}

export const stageIndex = (stages: StageInfo[], step: number) => stages.findIndex((s) => step >= s.from && step <= s.to)

export const nodeName = (id: NodeId) => NODES[id].label
