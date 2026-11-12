// Spaced repetition for the flashcards: a small Leitner system.
// Each card lives in a box 0–5; a right answer moves it up one box and schedules it
// further away, a wrong answer sends it back to box 0 (due today).

/** per card: [box, day it is due again], days counted since the Unix epoch */
export type SrsState = Record<string, [box: number, due: number]>

export const INTERVALS = [0, 1, 3, 7, 15, 30] // days until the next review, by box
export const MAX_BOX = INTERVALS.length - 1
/** from this box on, a card counts as mastered */
export const MASTERED = 4

const DAY = 86_400_000
export const todayNumber = (now = Date.now()) => Math.floor(now / DAY)

const KEY = 'protocolos:repaso'

export function loadSrs(): SrsState {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '')
    if (!v || typeof v !== 'object') return {}
    const out: SrsState = {}
    for (const [id, e] of Object.entries(v)) if (Array.isArray(e) && typeof e[0] === 'number' && typeof e[1] === 'number') out[id] = [e[0], e[1]]
    return out
  } catch {
    return {}
  }
}

export function saveSrs(state: SrsState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* private mode */
  }
}

export function review(state: SrsState, id: string, ok: boolean, day = todayNumber()): SrsState {
  const box = ok ? Math.min((state[id]?.[0] ?? 0) + 1, MAX_BOX) : 0
  return { ...state, [id]: [box, day + INTERVALS[box]] }
}

export const isNew = (state: SrsState, id: string) => !(id in state)
export const isDue = (state: SrsState, id: string, day = todayNumber()) => !isNew(state, id) && state[id][1] <= day

export function counts(ids: string[], state: SrsState, day = todayNumber()) {
  let nuevas = 0
  let paraHoy = 0
  let dominadas = 0
  for (const id of ids) {
    if (isNew(state, id)) nuevas++
    else if (isDue(state, id, day)) paraHoy++
    if (!isNew(state, id) && state[id][0] >= MASTERED) dominadas++
  }
  return { total: ids.length, nuevas, paraHoy, dominadas }
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * A study batch: due reviews first, then new cards, up to `max`.
 * When nothing is pending, a free batch of random cards (reviewing early is fine).
 */
export function buildSession(ids: string[], state: SrsState, day = todayNumber(), max = 20, rand: () => number = Math.random) {
  const due = shuffle(ids.filter((id) => isDue(state, id, day)), rand)
  const fresh = shuffle(ids.filter((id) => isNew(state, id)), rand)
  const queue = [...due, ...fresh].slice(0, max)
  return queue.length ? { queue, free: false } : { queue: shuffle(ids, rand).slice(0, max), free: true }
}
