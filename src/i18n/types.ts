import type { Question } from '../data/quiz'

export type Lang = 'es' | 'en'

/** Translated text of one lesson; arrays align 1:1 with the Spanish source. */
export interface LessonText {
  full: string
  description: string
  facts: [string, string][]
  notes: string[]
  quiz: Question[]
}
