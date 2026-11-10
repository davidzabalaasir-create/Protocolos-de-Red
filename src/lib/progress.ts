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
