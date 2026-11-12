import { describe, expect, it } from 'vitest'
import { buildSession, counts, INTERVALS, isDue, MASTERED, MAX_BOX, review } from './srs'

const rand = () => 0.5

describe('spaced repetition', () => {
  it('moves cards up on success and back to the start on failure', () => {
    let s = review({}, 'a', true, 100)
    expect(s.a).toEqual([1, 101])
    s = review(s, 'a', true, 101)
    expect(s.a).toEqual([2, 104])
    s = review(s, 'a', false, 104)
    expect(s.a).toEqual([0, 104]) // due again the same day
    for (let d = 0; d < 10; d++) s = review(s, 'a', true, 200)
    expect(s.a[0]).toBe(MAX_BOX)
    expect(s.a[1]).toBe(200 + INTERVALS[MAX_BOX])
  })

  it('knows what is new, due and mastered', () => {
    const day = 100
    let s = review({}, 'a', true, day) // due day 101
    s = review(s, 'b', true, 90) // due 91 → overdue
    for (let i = 0; i < MASTERED; i++) s = review(s, 'c', true, day - 50)
    expect(isDue(s, 'a', day)).toBe(false)
    expect(isDue(s, 'b', day)).toBe(true)
    expect(counts(['a', 'b', 'c', 'd'], s, day)).toEqual({ total: 4, nuevas: 1, paraHoy: 2, dominadas: 1 })
  })

  it('builds batches: due first, then new, capped', () => {
    const ids = ['a', 'b', 'c', 'd', 'e']
    let s = review({}, 'a', true, 90) // overdue
    s = review(s, 'b', true, 100) // due tomorrow
    const { queue, free } = buildSession(ids, s, 100, 3, rand)
    expect(free).toBe(false)
    expect(queue[0]).toBe('a')
    expect(queue).toHaveLength(3)
    expect(queue).not.toContain('b')
    // nothing pending → free batch
    let done: ReturnType<typeof review> = {}
    for (const id of ids) done = review({ ...done }, id, true, 100)
    const libre = buildSession(ids, done, 100, 2, rand)
    expect(libre.free).toBe(true)
    expect(libre.queue).toHaveLength(2)
  })
})
