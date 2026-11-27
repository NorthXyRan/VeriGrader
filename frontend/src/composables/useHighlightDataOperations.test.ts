import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useExamDataStore } from '@/stores/useExamDataStore'

import { useHighlightDataOperations } from './useHighlightDataOperations'

describe('useHighlightDataOperations', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
  })

  const prepareStore = () => {
    const store = useExamDataStore()
    store.setQuestions([{ question_id: 1, question: 'Q', score: 2 }])
    store.setReferenceAnswers([
      { question_id: 1, answer: 'point one; point two', eachScoringPoint: 1 },
    ])
    store.setStudentAnswers([{ student_id: 1, question_id: 1, answer: 'same and same' }])
    store.addHighlightData({
      student_id: 1,
      question_id: 1,
      answer: {
        correct: [
          { 'Student answer': 'same', 'matched reference answer': 'point one', reason: 'one' },
          { 'Student answer': 'same', 'matched reference answer': 'point two', reason: 'two' },
        ],
        wrong: [],
        unclear: [],
      },
      total_score: 2,
    })
    return store
  }

  it('removes only the requested occurrence and recomputes the score', () => {
    const store = prepareStore()
    const { removeAnnotation } = useHighlightDataOperations()

    expect(removeAnnotation('same', 'correct', 1, 1, 1)).toBe(true)
    expect(store.getHighlightData(1, 1)?.answer.correct).toEqual([
      { 'Student answer': 'same', 'matched reference answer': 'point one', reason: 'one' },
    ])
    expect(store.getHighlightData(1, 1)?.total_score).toBe(1)
  })

  it('does not modify confirmed results', () => {
    const store = prepareStore()
    store.confirmHighlightData(1, 1)

    const { removeAnnotation } = useHighlightDataOperations()
    expect(removeAnnotation('same', 'correct', 1, 1, 0)).toBe(false)
    expect(store.getHighlightData(1, 1)?.answer.correct).toHaveLength(2)
  })

  it('validates required annotation fields', () => {
    const { validateAnnotationData } = useHighlightDataOperations()
    expect(validateAnnotationData({ text: ' ' })).toBe(false)
    expect(
      validateAnnotationData({
        text: 'answer',
        type: 'correct',
        matchedReferenceAnswer: '',
        reason: '',
        studentId: 0,
        questionId: 1,
      }),
    ).toBe(false)
    expect(
      validateAnnotationData({
        text: 'answer',
        type: 'correct',
        matchedReferenceAnswer: '',
        reason: '',
        studentId: 1,
        questionId: -1,
      }),
    ).toBe(false)
    expect(
      validateAnnotationData({
        text: 'answer',
        type: 'correct',
        matchedReferenceAnswer: '',
        reason: '',
        studentId: 1,
        questionId: 1,
      }),
    ).toBe(true)
  })

  it('creates an annotation, moves it between categories, and reports statistics', () => {
    const store = useExamDataStore()
    store.setQuestions([{ question_id: 1, question: 'Q', score: 2 }])
    store.setReferenceAnswers([
      { question_id: 1, answer: 'point one; point two', eachScoringPoint: 1 },
    ])
    store.setStudentAnswers([{ student_id: 1, question_id: 1, answer: 'student answer' }])
    const operations = useHighlightDataOperations()
    const annotation = {
      text: 'student answer',
      type: 'correct' as const,
      matchedReferenceAnswer: 'point one',
      reason: 'Matches the first point.',
      studentId: 1,
      questionId: 1,
    }

    expect(operations.saveAnnotation(annotation)).toBe(true)
    expect(operations.getAnnotationStats(1, 1)).toEqual({
      correct: 1,
      wrong: 0,
      unclear: 0,
      totalScore: 1,
    })
    expect(operations.findAnnotation('student answer', 1, 1)?.type).toBe('correct')

    expect(operations.saveAnnotation({ ...annotation, type: 'wrong' })).toBe(true)
    expect(operations.getAnnotationStats(1, 1)).toEqual({
      correct: 0,
      wrong: 1,
      unclear: 0,
      totalScore: 0,
    })
  })

  it('returns false when an annotation or grading record is absent', () => {
    prepareStore()
    const { removeAnnotation, resetAllAnnotations } = useHighlightDataOperations()

    expect(removeAnnotation('missing', 'wrong', 1, 1)).toBe(false)
    expect(removeAnnotation('missing', 'wrong', 99, 1)).toBe(false)
    expect(resetAllAnnotations(99, 1)).toBe(false)
  })

  it('resets annotations and score', () => {
    const store = prepareStore()
    const operations = useHighlightDataOperations()

    expect(operations.resetAllAnnotations(1, 1)).toBe(true)
    expect(store.getHighlightData(1, 1)).toMatchObject({
      answer: { correct: [], wrong: [], unclear: [] },
      total_score: 0,
    })
    expect(operations.findAnnotation('same', 1, 1)).toBeNull()
  })

  it('does not modify gold-standard results', () => {
    const store = prepareStore()
    store.setGoldPaper(1, 1)
    const operations = useHighlightDataOperations()

    expect(
      operations.saveAnnotation({
        text: 'same',
        type: 'wrong',
        matchedReferenceAnswer: '',
        reason: '',
        studentId: 1,
        questionId: 1,
      }),
    ).toBe(false)
    expect(operations.resetAllAnnotations(1, 1)).toBe(false)
    expect(store.getHighlightData(1, 1)?.answer.correct).toHaveLength(2)
  })

  it('returns empty lookup results before grading', () => {
    const operations = useHighlightDataOperations()
    expect(operations.getHighlightData(1, 1)).toBeUndefined()
    expect(operations.getAnnotationStats(1, 1)).toBeNull()
    expect(operations.findAnnotation('answer', 1, 1)).toBeNull()
  })
})
