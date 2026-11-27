import type { HighlightData } from '@/types/exam'
import { computeScoreFromReferences, sanitizeHighlightData } from '@/utils/highlightMetrics'

import { demoCases as cases } from './cases'
import type { DemoAnnotation, DemoResponse } from './caseTypes'

export function renderResponse(response: DemoResponse): string {
  return response.paragraphs
    .map((paragraph) =>
      paragraph.map((segment) => (typeof segment === 'string' ? segment : segment.text)).join(' '),
    )
    .join('\n\n')
}

export function responseAnnotations(response: DemoResponse): DemoAnnotation[] {
  return response.paragraphs
    .flat()
    .filter((segment): segment is DemoAnnotation => typeof segment !== 'string')
}

export function getDemoGradingResult(
  studentId: number,
  questionId: number,
  { initialPass = false }: { initialPass?: boolean } = {},
): HighlightData | undefined {
  const demoCase = cases.find(({ question }) => question.question_id === questionId)
  const response = demoCase?.responses.find(({ studentId: id }) => id === studentId)
  if (!demoCase || !response) return undefined

  const answer: HighlightData['answer'] = { correct: [], wrong: [], unclear: [] }
  for (const annotation of responseAnnotations(response)) {
    const { type, reason } = (initialPass && annotation.initialClassification) || annotation
    answer[type].push({
      'Student answer': annotation.text,
      'matched reference answer': annotation.matchedReferenceAnswer,
      reason,
    })
  }

  const result = sanitizeHighlightData(
    renderResponse(response),
    { student_id: studentId, question_id: questionId, answer, total_score: 0 },
    { referenceContent: demoCase.rubric.join('\n\n') },
  )
  result.total_score = computeScoreFromReferences(result, {
    eachPoint: demoCase.pointsPerCriterion,
    maxScore: demoCase.question.score,
  })
  return result
}
