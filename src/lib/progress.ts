import { useCallback, useSyncExternalStore } from 'react'

/** Per-protocol progress (lesson played to the end, quiz passed) persisted in localStorage. */
export interface Progress {
  watched: string[]
  quiz: Record<string, number>
}

const KEY = 'protocolos:progress'
const listeners = new Set<() => void>()
let cache: Progress = load()

function load(): Progress {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '')
    return { watched: v.watched ?? [], quiz: v.quiz ?? {} }
  } catch {
    return { watched: [], quiz: {} }
  }
}

function save(next: Progress) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* private mode */
  }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useProgress() {
  const progress = useSyncExternalStore(subscribe, () => cache)
  const markWatched = useCallback((id: string) => {
    if (!cache.watched.includes(id)) save({ ...cache, watched: [...cache.watched, id] })
  }, [])
  const setQuizScore = useCallback((id: string, score: number) => {
    if ((cache.quiz[id] ?? -1) < score) save({ ...cache, quiz: { ...cache.quiz, [id]: score } })
  }, [])
  const reset = useCallback(() => save({ watched: [], quiz: {} }), [])
  return { progress, markWatched, setQuizScore, reset }
}

/** A lesson counts as done when it was watched to the end and its quiz was aced. */
export const isDone = (p: Progress, id: string, questions: number) => p.watched.includes(id) && (p.quiz[id] ?? 0) >= questions

// ── cloud sync (used by the optional account feature) ──
export const getProgress = () => cache
export const replaceProgress = (next: Progress) => save(next)
export const subscribeProgress = subscribe

/** Combine two devices' progress without losing anything: every watched lesson, the best quiz scores. */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const quiz = { ...a.quiz }
  for (const [id, score] of Object.entries(b.quiz)) quiz[id] = Math.max(quiz[id] ?? 0, score)
  return { watched: [...new Set([...a.watched, ...b.watched])], quiz }
}

export const sameProgress = (a: Progress, b: Progress) =>
  a.watched.length === b.watched.length && a.watched.every((id) => b.watched.includes(id)) && Object.keys({ ...a.quiz, ...b.quiz }).every((id) => a.quiz[id] === b.quiz[id])

/** Accepts only well-formed progress (it comes from user-editable metadata). */
export function parseProgress(v: unknown): Progress | null {
  if (!v || typeof v !== 'object') return null
  const o = v as { watched?: unknown; quiz?: unknown }
  const watched = Array.isArray(o.watched) ? o.watched.filter((x): x is string => typeof x === 'string').slice(0, 500) : []
  const quiz: Record<string, number> = {}
  if (o.quiz && typeof o.quiz === 'object') for (const [k, s] of Object.entries(o.quiz)) if (typeof s === 'number' && Number.isFinite(s)) quiz[k] = s
  return { watched, quiz }
}
