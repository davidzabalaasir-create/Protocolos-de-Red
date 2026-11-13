import { LESSONS_EN_1 } from './en-lessons-1'
import { LESSONS_EN_2 } from './en-lessons-2'
import { LESSONS_EN_3 } from './en-lessons-3'
import { LESSONS_EN_4 } from './en-lessons-4'
import { LESSONS_EN_5 } from './en-lessons-5'
import { LESSONS_EN_6 } from './en-lessons-6'
import type { LessonText } from './types'

export const LESSONS_EN_ALL: Record<string, LessonText> = {
  ...LESSONS_EN_1,
  ...LESSONS_EN_2,
  ...LESSONS_EN_3,
  ...LESSONS_EN_4,
  ...LESSONS_EN_5,
  ...LESSONS_EN_6,
}
