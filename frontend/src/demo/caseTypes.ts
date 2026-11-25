import type { HighlightType, Question } from '@/types/exam'

export interface DemoAnnotation {
  type: HighlightType
  text: string
  matchedReferenceAnswer: string
  reason: string
  initialClassification?: { type: HighlightType; reason: string }
}

/** Plain strings are response text the model leaves unannotated, such as headings or filler. */
export type DemoSegment = DemoAnnotation | string

export interface DemoResponse {
  studentId: number
  paragraphs: readonly (readonly DemoSegment[])[]
}

export interface DemoCase {
  question: Question
  pointsPerCriterion: number
  rubric: readonly string[]
  responses: readonly DemoResponse[]
}

export function flagged(
  base: DemoAnnotation,
  initialType: HighlightType,
  initialReason: string,
): DemoAnnotation {
  return { ...base, initialClassification: { type: initialType, reason: initialReason } }
}

export function annotation(
  type: HighlightType,
  text: string,
  matchedReferenceAnswer: string,
  reason: string,
): DemoAnnotation {
  return { type, text, matchedReferenceAnswer, reason }
}
