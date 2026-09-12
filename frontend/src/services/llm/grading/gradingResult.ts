import type { HighlightData, HighlightItem, HighlightType } from '@/types/exam'
import { HIGHLIGHT_TYPES } from '@/types/exam'

import { parseJsonObject } from '../jsonResponse'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseHighlightItem(value: unknown, type: HighlightType, index: number): HighlightItem {
  if (
    !isRecord(value) ||
    typeof value['Student answer'] !== 'string' ||
    typeof value['matched reference answer'] !== 'string' ||
    typeof value.reason !== 'string'
  ) {
    throw new Error(`Invalid ${type} highlight at index ${index}`)
  }

  return {
    'Student answer': value['Student answer'],
    'matched reference answer': value['matched reference answer'],
    reason: value.reason,
  }
}

export function parseGradingResult(
  content: string,
  expectedStudentId: number,
  expectedQuestionId: number,
  maxScore = Number.POSITIVE_INFINITY,
): HighlightData {
  const result = parseJsonObject(content)
  if (result.student_id !== expectedStudentId) {
    throw new Error('Grading result student_id does not match the request')
  }
  if (result.question_id !== expectedQuestionId) {
    throw new Error('Grading result question_id does not match the request')
  }
  if (!isRecord(result.answer)) throw new Error('Grading result is missing answer categories')

  const answer: HighlightData['answer'] = { correct: [], wrong: [], unclear: [] }
  for (const type of HIGHLIGHT_TYPES) {
    const items = result.answer[type]
    if (!Array.isArray(items)) throw new Error(`Grading result is missing ${type} highlights`)
    answer[type] = items.map((item, index) => parseHighlightItem(item, type, index))
  }

  if (
    typeof result.total_score !== 'number' ||
    !Number.isFinite(result.total_score) ||
    result.total_score < 0 ||
    result.total_score > maxScore
  ) {
    throw new Error('Grading result score is invalid')
  }

  return {
    student_id: expectedStudentId,
    question_id: expectedQuestionId,
    answer,
    total_score: result.total_score,
  }
}
