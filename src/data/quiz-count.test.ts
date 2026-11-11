import { expect, it } from 'vitest'
import { QUIZ } from './quiz'
import { QUIZ_COUNT } from './quiz-count'

it('quiz counts match the questions', () => {
  expect(QUIZ_COUNT).toEqual(Object.fromEntries(Object.entries(QUIZ).map(([k, v]) => [k, v.length])))
})
