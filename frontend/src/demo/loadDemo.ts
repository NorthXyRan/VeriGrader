import { useExamDataStore } from '@/stores/useExamDataStore'
import { useUploadStatusStore } from '@/stores/useUploadStatusStore'
import type { HighlightData } from '@/types/exam'
import { computeScoreFromReferences, sanitizeHighlightData } from '@/utils/highlightMetrics'

import { advancedCases } from './advancedCases'
import { coreCases } from './caseStudy'
import type { DemoResponse } from './caseTypes'

const cases = [...coreCases, ...advancedCases]
const initiallyGradedStudents = new Set([101, 102, 103])

function renderResponse(response: DemoResponse): string {
  return response.paragraphs
    .map((paragraph) => paragraph.map(({ text }) => text).join(' '))
    .join('\n\n')
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
  for (const annotation of response.paragraphs.flat()) {
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

export function loadDemo(): void {
  const examStore = useExamDataStore()
  const uploadStore = useUploadStatusStore()
  const questions = cases.map(({ question }) => ({ ...question }))
  const referenceAnswers = cases.map(({ question, rubric, pointsPerCriterion }) => ({
    question_id: question.question_id,
    answer: rubric.join('\n\n'),
    eachScoringPoint: pointsPerCriterion,
  }))
  const studentAnswers = cases.flatMap(({ question, responses }) =>
    responses.map((response) => ({
      student_id: response.studentId,
      question_id: question.question_id,
      answer: renderResponse(response),
    })),
  )

  examStore.resetAllData()
  examStore.setQuestions(questions)
  examStore.setReferenceAnswers(referenceAnswers)
  examStore.setStudentAnswers(studentAnswers)

  for (const { student_id, question_id } of studentAnswers) {
    if (!initiallyGradedStudents.has(student_id)) continue
    const result = getDemoGradingResult(student_id, question_id, { initialPass: true })
    if (result) examStore.addHighlightData(result)
  }

  uploadStore.resetAll()
  uploadStore.setPaperUploading('paper.json', JSON.stringify({ questions }, null, 2))
  uploadStore.setPaperReady({ questionCount: examStore.questionCount })
  uploadStore.setAnswerUploading(
    'reference_answers.json',
    JSON.stringify({ answers: referenceAnswers }, null, 2),
  )
  uploadStore.setAnswerReady({ answerCount: examStore.referenceAnswerCount })
  uploadStore.setStudentUploading('student_answers.json', JSON.stringify(studentAnswers, null, 2))
  uploadStore.setStudentReady({
    studentCount: examStore.studentCount,
    answerCount: examStore.totalAnswerCount,
  })
  examStore.saveToLocal()
}
