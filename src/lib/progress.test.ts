import { expect, it } from 'vitest'
import { mergeProgress, parseProgress, sameProgress } from './progress'

it('merges two devices without losing progress', () => {
  const a = { watched: ['dns', 'tcp'], quiz: { dns: 1, tcp: 2 } }
  const b = { watched: ['tcp', 'http'], quiz: { dns: 2, http: 1 } }
  expect(mergeProgress(a, b)).toEqual({ watched: ['dns', 'tcp', 'http'], quiz: { dns: 2, tcp: 2, http: 1 } })
  expect(sameProgress(mergeProgress(a, b), mergeProgress(b, a))).toBe(true)
  expect(sameProgress(a, b)).toBe(false)
})

it('only trusts well-formed cloud data', () => {
  expect(parseProgress(null)).toBeNull()
  expect(parseProgress('x')).toBeNull()
  expect(parseProgress({ watched: ['dns', 3, null], quiz: { dns: 2, tcp: 'x', udp: Infinity } })).toEqual({ watched: ['dns'], quiz: { dns: 2 } })
})
