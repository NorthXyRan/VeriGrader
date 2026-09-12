import { useExamDataStore } from '@/stores/useExamDataStore'
import {
  HIGHLIGHT_TYPES,
  type HighlightData,
  type HighlightItem,
  type HighlightType,
} from '@/types/exam'
import { computeScoreFromReferences } from '@/utils/highlightMetrics'
import { getHighlightItemIndex } from '@/utils/highlightRanges'

import { ErrorType, useErrorHandler } from './useErrorHandler'

export interface AnnotationData {
  text: string
  type: HighlightType
  matchedReferenceAnswer: string
  reason: string
  studentId: number
  questionId: number
}

export function useHighlightDataOperations() {
  const store = useExamDataStore()
  const { handleError, handleValidationError } = useErrorHandler()

  const validateAnnotationData = (data: Partial<AnnotationData>): data is AnnotationData => {
    if (!data.text?.trim()) {
      handleValidationError('text', 'must not be empty')
      return false
    }
    if (!data.type || !HIGHLIGHT_TYPES.includes(data.type)) {
      handleValidationError('type', 'must be correct, wrong, or unclear')
      return false
    }
    if (!Number.isSafeInteger(data.studentId) || Number(data.studentId) <= 0) {
      handleValidationError('student ID', 'must be a positive integer')
      return false
    }
    if (!Number.isSafeInteger(data.questionId) || Number(data.questionId) <= 0) {
      handleValidationError('question ID', 'must be a positive integer')
      return false
    }
    return true
  }

  const getHighlightData = (studentId: number, questionId: number) =>
    store.getHighlightData(studentId, questionId)

  const isLocked = (studentId: number, questionId: number) =>
    store.isGoldPaper(studentId, questionId) || store.isConfirmedPaper(studentId, questionId)

  const save = (data: HighlightData): boolean => {
    const saved = store.addHighlightData(data)
    if (saved) store.saveToLocal()
    return saved
  }

  const emptyHighlightData = (studentId: number, questionId: number): HighlightData => ({
    student_id: studentId,
    question_id: questionId,
    answer: { correct: [], wrong: [], unclear: [] },
    total_score: 0,
  })

  const saveAnnotation = (data: AnnotationData): boolean => {
    try {
      if (!validateAnnotationData(data) || isLocked(data.studentId, data.questionId)) return false

      const highlight =
        getHighlightData(data.studentId, data.questionId) ??
        emptyHighlightData(data.studentId, data.questionId)
      const item: HighlightItem = {
        'Student answer': data.text,
        'matched reference answer': data.matchedReferenceAnswer,
        reason: data.reason,
      }

      for (const type of HIGHLIGHT_TYPES) {
        highlight.answer[type] = highlight.answer[type].filter(
          (current) => current['Student answer'] !== data.text,
        )
      }
      highlight.answer[data.type].push(item)

      const reference = store.getReferenceAnswer(data.questionId)
      const question = store.getQuestionById(data.questionId)
      highlight.total_score = computeScoreFromReferences(highlight, {
        eachPoint: reference?.eachScoringPoint,
        maxScore: question?.score,
      })

      return save(highlight)
    } catch (error) {
      handleError(error, ErrorType.GRADING, 'save annotation')
      return false
    }
  }

  const removeAnnotation = (
    text: string,
    type: HighlightType,
    studentId: number,
    questionId: number,
    occurrence = 0,
  ): boolean => {
    try {
      if (isLocked(studentId, questionId)) return false

      const highlight = getHighlightData(studentId, questionId)
      if (!highlight) return false

      const index = getHighlightItemIndex(highlight, type, text, occurrence)
      if (index === -1) return false

      highlight.answer[type].splice(index, 1)
      const reference = store.getReferenceAnswer(questionId)
      const question = store.getQuestionById(questionId)
      highlight.total_score = computeScoreFromReferences(highlight, {
        eachPoint: reference?.eachScoringPoint,
        maxScore: question?.score,
      })

      return save(highlight)
    } catch (error) {
      handleError(error, ErrorType.GRADING, 'remove annotation')
      return false
    }
  }

  const resetAllAnnotations = (studentId: number, questionId: number): boolean => {
    try {
      if (isLocked(studentId, questionId)) return false

      const highlight = getHighlightData(studentId, questionId)
      if (!highlight) return false

      highlight.answer = { correct: [], wrong: [], unclear: [] }
      highlight.total_score = 0
      return save(highlight)
    } catch (error) {
      handleError(error, ErrorType.GRADING, 'reset annotations')
      return false
    }
  }

  const findAnnotation = (
    text: string,
    studentId: number,
    questionId: number,
  ): { type: HighlightType; item: HighlightItem } | null => {
    const highlight = getHighlightData(studentId, questionId)
    if (!highlight) return null

    for (const type of HIGHLIGHT_TYPES) {
      const item = highlight.answer[type].find((entry) => entry['Student answer'] === text)
      if (item) return { type, item }
    }
    return null
  }

  const getAnnotationStats = (studentId: number, questionId: number) => {
    const highlight = getHighlightData(studentId, questionId)
    if (!highlight) return null

    return {
      correct: highlight.answer.correct.length,
      wrong: highlight.answer.wrong.length,
      unclear: highlight.answer.unclear.length,
      totalScore: highlight.total_score,
    }
  }

  return {
    saveAnnotation,
    removeAnnotation,
    resetAllAnnotations,
    findAnnotation,
    getAnnotationStats,
    getHighlightData,
    validateAnnotationData,
  }
}
