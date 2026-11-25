import type { HighlightType, Question } from '@/types/exam'

export interface DemoAnnotation {
  type: HighlightType
  text: string
  matchedReferenceAnswer: string
  reason: string
  missedOnFirstPass?: boolean
}

export interface DemoResponse {
  studentId: number
  paragraphs: readonly (readonly DemoAnnotation[])[]
}

export interface DemoCase {
  question: Question
  pointsPerCriterion: number
  rubric: readonly string[]
  responses: readonly DemoResponse[]
}

export function annotation(
  type: HighlightType,
  text: string,
  matchedReferenceAnswer: string,
  reason: string,
): DemoAnnotation {
  return { type, text, matchedReferenceAnswer, reason }
}
