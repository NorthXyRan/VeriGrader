export const HIGHLIGHT_TYPES = ['correct', 'wrong', 'unclear'] as const

export type HighlightType = (typeof HIGHLIGHT_TYPES)[number]

export interface Question {
  question_id: number
  question: string
  score: number
}

export interface ReferenceAnswer {
  question_id: number
  answer: string
  eachScoringPoint?: number
}

export interface StudentAnswer {
  student_id: number
  question_id: number
  answer: string
}

export interface StudentInfo {
  id: number
}

export interface HighlightItem {
  'Student answer': string
  'matched reference answer': string
  reason: string
}

export interface HighlightData {
  student_id: number
  question_id: number
  answer: Record<HighlightType, HighlightItem[]>
  total_score: number
  isGold?: boolean
  isConfirmed?: boolean
}

export interface HighlightSelection {
  text: string
  type: HighlightType
  reason: string
  matchedReferenceAnswer?: string
  occurrence: number
}

export type HighlightUpdate =
  | {
      operation: 'add'
      text: string
      type: HighlightType
      reason?: string
    }
  | { operation: 'remove'; text: string; type: HighlightType; occurrence: number }
  | { operation: 'reset' }
  | {
      operation: 'split'
      text: string
      type: HighlightType
      occurrence: number
      newItems: HighlightItem[]
    }

export interface ReasonExample {
  questionId: number
  studentId: number
  studentAnswer: string
  highlightType: HighlightType
  reason: string
  matchedReferenceAnswer?: string
}

export interface GoldStandardExample {
  student_id: number
  question_id: number
  answer: Record<HighlightType, HighlightItem[]>
  total_score: number | null
}

export function isHighlightType(value: unknown): value is HighlightType {
  return typeof value === 'string' && HIGHLIGHT_TYPES.some((type) => type === value)
}
