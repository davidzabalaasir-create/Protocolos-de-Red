import { route, type NodeId, type Protocol } from '../data/protocols'

/**
 * Rhythm of a lesson, modelled on the original: when a packet reaches devices that were not on
 * screen yet, the camera reframes first and only then the packet leaves; its trip takes longer
 * the more hops it has; then a short pause before the next one. All values are at 1× speed.
 */
export const CAMERA_MS = 950
export const HOP_MS = 620
export const DWELL_MS = 650
const MIN_TRAVEL_MS = 700

export interface PacketTiming {
  /** wait for the camera before the packet leaves */
  delay: number
  /** time on the wire */
  travel: number
  /** delay + travel + pause: when the next packet may start */
  total: number
}

const cache = new WeakMap<Protocol, PacketTiming[]>()

export function lessonTimings(lesson: Protocol): PacketTiming[] {
  const hit = cache.get(lesson)
  if (hit) return hit
  const seen = new Set<NodeId>()
  if (lesson.packets[0]) seen.add(lesson.packets[0].from)
  const out = lesson.packets.map((p) => {
    const r = route(p.from, p.to)
    const reveals = r.some((id) => !seen.has(id))
    r.forEach((id) => seen.add(id))
    const delay = reveals ? CAMERA_MS : 0
    const travel = Math.max(MIN_TRAVEL_MS, (r.length - 1) * HOP_MS)
    return { delay, travel, total: delay + travel + DWELL_MS }
  })
  cache.set(lesson, out)
  return out
}

export const packetTiming = (lesson: Protocol, i: number): PacketTiming =>
  lessonTimings(lesson)[i] ?? { delay: 0, travel: MIN_TRAVEL_MS, total: MIN_TRAVEL_MS + DWELL_MS }
