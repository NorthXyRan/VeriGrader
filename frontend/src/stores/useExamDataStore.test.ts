import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useExamDataStore } from './useExamDataStore'

describe('useExamDataStore', () => {
  const values = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', storage)
    localStorage.clear()
  })

  const prepareStore = () => {
    const store = useExamDataStore()
    store.setQuestions([
      { question_id: 1, question: 'First question', score: 2 },
      { question_id: 2, question: 'Second question', score: 3 },
    ])
    store.setReferenceAnswers([
      { question_id: 1, answer: 'Reference one', eachScoringPoint: 1 },
      { question_id: 2, answer: 'Reference two' },
    ])
    store.setStudentAnswers([
      { student_id: 1, question_id: 1, answer: 'Answer one' },
      { student_id: 1, question_id: 2, answer: 'Answer two' },
      { student_id: 2, question_id: 1, answer: 'Another one' },
      { student_id: 2, question_id: 2, answer: 'Another two' },
    ])
    return store
  }

  it('requires all three input datasets', () => {
    const store = useExamDataStore()
    store.setQuestions([{ question_id: 1, question: 'Q', score: 1 }])
    store.setStudentAnswers([{ student_id: 1, question_id: 1, answer: 'A' }])
    expect(store.isDataComplete).toBe(false)

    store.setReferenceAnswers([{ question_id: 1, answer: 'R' }])
    expect(store.isDataComplete).toBe(true)
  })

  it('does not overwrite confirmed results', () => {
    const store = useExamDataStore()
    store.setQuestions([{ question_id: 1, question: 'Q', score: 1 }])
    store.setReferenceAnswers([{ question_id: 1, answer: 'reference' }])
    store.setStudentAnswers([{ student_id: 1, question_id: 1, answer: 'answer' }])
    store.addHighlightData({
      student_id: 1,
      question_id: 1,
      answer: {
        correct: [
          {
            'Student answer': 'answer',
            'matched reference answer': 'reference',
            reason: 'ok',
          },
        ],
        wrong: [],
        unclear: [],
      },
      total_score: 1,
    })
    store.confirmHighlightData(1, 1)

    store.addHighlightData({
      student_id: 1,
      question_id: 1,
      answer: { correct: [], wrong: [], unclear: [] },
      total_score: 0,
    })

    expect(store.getHighlightData(1, 1)?.total_score).toBe(1)
  })

  it('does not expose mutable grading state', () => {
    const store = useExamDataStore()
    store.setQuestions([{ question_id: 1, question: 'Q', score: 1 }])
    store.setReferenceAnswers([{ question_id: 1, answer: 'reference' }])
    store.setStudentAnswers([{ student_id: 1, question_id: 1, answer: 'answer' }])
    store.addHighlightData({
      student_id: 1,
      question_id: 1,
      answer: {
        correct: [
          {
            'Student answer': 'answer',
            'matched reference answer': 'reference',
            reason: 'ok',
          },
        ],
        wrong: [],
        unclear: [],
      },
      total_score: 1,
    })

    const retrieved = store.getHighlightData(1, 1)
    if (!retrieved) throw new Error('Expected grading data')
    retrieved.total_score = 0
    retrieved.answer.correct.length = 0

    expect(store.getHighlightData(1, 1)?.total_score).toBe(1)
    expect(store.getHighlightData(1, 1)?.answer.correct).toHaveLength(1)
  })

  it('ignores malformed persisted data', () => {
    localStorage.setItem('exam_questions', '{broken')
    localStorage.setItem('exam_student_answers', JSON.stringify([{ bad: true }]))

    const store = useExamDataStore()
    expect(() => store.loadFromLocal()).not.toThrow()
    expect(store.questions).toEqual([])
    expect(store.studentAnswers).toEqual([])
  })

  it('rejects non-positive identifiers and scores from storage', () => {
    localStorage.setItem(
      'exam_questions',
      JSON.stringify([{ question_id: 0, question: 'Q', score: 0 }]),
    )
    localStorage.setItem(
      'exam_reference_answers',
      JSON.stringify([{ question_id: -1, answer: 'A', eachScoringPoint: 0 }]),
    )
    localStorage.setItem(
      'exam_student_answers',
      JSON.stringify([{ student_id: 0, question_id: 0, answer: 'A' }]),
    )

    const store = useExamDataStore()
    store.loadFromLocal()

    expect(store.questions).toEqual([])
    expect(store.referenceAnswers).toEqual([])
    expect(store.studentAnswers).toEqual([])
  })

  it('provides counts and record lookups', () => {
    const store = prepareStore()

    expect(store.questionCount).toBe(2)
    expect(store.referenceAnswerCount).toBe(2)
    expect(store.studentCount).toBe(2)
    expect(store.totalAnswerCount).toBe(4)
    expect(store.studentList).toEqual([{ id: 1 }, { id: 2 }])
    expect(store.getQuestionById(2)?.question).toBe('Second question')
    expect(store.getReferenceAnswer(1)?.answer).toBe('Reference one')
    expect(store.getStudentAnswer(2, 2)?.answer).toBe('Another two')
  })

  it('sanitizes annotations before storing them', () => {
    const store = prepareStore()

    expect(
      store.addHighlightData({
        student_id: 1,
        question_id: 1,
        answer: {
          correct: [
            {
              'Student answer': 'Answer one',
              'matched reference answer': 'Reference one',
              reason: 'Valid match.',
            },
            {
              'Student answer': 'not present',
              'matched reference answer': 'Reference one',
              reason: 'Invalid selection.',
            },
          ],
          wrong: [],
          unclear: [],
        },
        total_score: 1,
      }),
    ).toBe(true)

    expect(store.getHighlightData(1, 1)?.answer.correct).toHaveLength(1)
  })

  it('confirms and unconfirms existing grading data', () => {
    const store = prepareStore()
    expect(store.confirmHighlightData(1, 1)).toBe(false)

    store.addHighlightData({
      student_id: 1,
      question_id: 1,
      answer: { correct: [], wrong: [], unclear: [] },
      total_score: 0,
    })

    expect(store.confirmHighlightData(1, 1)).toBe(true)
    expect(store.isConfirmedPaper(1, 1)).toBe(true)
    expect(store.unconfirmHighlightData(1, 1)).toBe(true)
    expect(store.isConfirmedPaper(1, 1)).toBe(false)
  })

  it('deduplicates, queries, and removes annotation examples', () => {
    const store = useExamDataStore()
    const example = {
      questionId: 1,
      studentId: 2,
      studentAnswer: 'Response',
      highlightType: 'unclear' as const,
      reason: 'Needs more detail.',
    }

    store.addReasonExample(example)
    store.addReasonExample({ ...example })
    store.addReasonExample({ ...example, questionId: 2 })

    expect(store.getReasonExamplesByQuestion(1)).toEqual([example])
    expect(store.getTotalExampleCountByQuestion(1)).toBe(1)
    expect(
      store.removeReasonExample(
        example.questionId,
        example.studentId,
        example.studentAnswer,
        example.highlightType,
        example.reason,
      ),
    ).toBe(true)
    expect(store.removeReasonExample(1, 2, 'missing', 'unclear', 'missing')).toBe(false)
  })

  it('manages gold-standard examples and locks their grading data', () => {
    const store = prepareStore()
    store.addHighlightData({
      student_id: 1,
      question_id: 1,
      answer: { correct: [], wrong: [], unclear: [] },
      total_score: 2,
    })

    expect(store.setGoldPaper(1, 1)).toBe(true)
    expect(store.isGoldPaper(1, 1)).toBe(true)
    expect(store.isConfirmedPaper(1, 1)).toBe(true)
    expect(store.getGoldStandardExamplesByQuestion(1)).toHaveLength(1)
    expect(store.getTotalExampleCountByQuestion(1)).toBe(1)
    expect(store.setGoldPaper(99, 1)).toBe(false)
    expect(store.removeGoldPaper(99, 1)).toBe(false)

    expect(store.removeGoldPaper(1, 1)).toBe(true)
    expect(store.isGoldPaper(1, 1)).toBe(false)
    expect(store.isConfirmedPaper(1, 1)).toBe(false)
    expect(store.getGoldStandardExamplesByQuestion(1)).toEqual([])
  })

  it('resets individual datasets and dependent student state', () => {
    const store = prepareStore()
    store.addReasonExample({
      questionId: 1,
      studentId: 1,
      studentAnswer: 'Answer one',
      highlightType: 'correct',
      reason: 'Correct.',
    })
    store.addHighlightData({
      student_id: 1,
      question_id: 1,
      answer: { correct: [], wrong: [], unclear: [] },
      total_score: 0,
    })
    store.setGoldPaper(1, 1)

    store.resetStudentData()
    expect(store.studentAnswers).toEqual([])
    expect(store.studentList).toEqual([])
    expect(store.highlightDataList).toEqual([])
    expect(store.reasonExamples).toEqual([])
    expect(store.goldStandardExamples).toEqual([])

    store.resetQuestions()
    store.resetReferenceAnswers()
    expect(store.questions).toEqual([])
    expect(store.referenceAnswers).toEqual([])
  })

  it('resets all uploaded and generated data', () => {
    const store = prepareStore()
    store.resetAllData()

    expect(store.questions).toEqual([])
    expect(store.referenceAnswers).toEqual([])
    expect(store.studentAnswers).toEqual([])
  })

  it('round-trips valid persisted data', () => {
    const firstStore = prepareStore()
    firstStore.addReasonExample({
      questionId: 1,
      studentId: 1,
      studentAnswer: 'Answer one',
      highlightType: 'correct',
      reason: 'Matches.',
      matchedReferenceAnswer: 'Reference one',
    })
    firstStore.addHighlightData({
      student_id: 1,
      question_id: 1,
      answer: {
        correct: [
          {
            'Student answer': 'Answer one',
            'matched reference answer': 'Reference one',
            reason: 'Matches.',
          },
        ],
        wrong: [],
        unclear: [],
      },
      total_score: 1,
    })
    firstStore.setGoldPaper(1, 1)
    firstStore.saveToLocal()

    setActivePinia(createPinia())
    const restoredStore = useExamDataStore()
    restoredStore.loadFromLocal()

    expect(restoredStore.isDataComplete).toBe(true)
    expect(restoredStore.getHighlightData(1, 1)).toMatchObject({
      total_score: 1,
      isGold: true,
      isConfirmed: true,
    })
    expect(restoredStore.getReasonExamplesByQuestion(1)).toHaveLength(1)
    expect(restoredStore.getGoldStandardExamplesByQuestion(1)).toHaveLength(1)
    expect(localStorage.getItem('exam_student_list')).toBeNull()
  })

  it('filters invalid entries while preserving valid persisted records', () => {
    localStorage.setItem(
      'exam_questions',
      JSON.stringify([
        { question_id: 1, question: 'Valid', score: 1 },
        { question_id: 2, question: ' ', score: 1 },
      ]),
    )
    localStorage.setItem(
      'exam_reference_answers',
      JSON.stringify([
        { question_id: 1, answer: 'Valid' },
        { question_id: 2, answer: 'Valid', eachScoringPoint: -1 },
      ]),
    )
    localStorage.setItem(
      'exam_student_answers',
      JSON.stringify([
        { student_id: 1, question_id: 1, answer: '' },
        { student_id: 1, question_id: 2, answer: 42 },
      ]),
    )
    localStorage.setItem(
      'exam_highlight_data',
      JSON.stringify([
        {
          student_id: 1,
          question_id: 1,
          answer: { correct: [], wrong: [], unclear: [] },
          total_score: 0,
        },
        {
          student_id: 1,
          question_id: 2,
          answer: { correct: [{ reason: 'incomplete' }], wrong: [], unclear: [] },
          total_score: 0,
        },
      ]),
    )
    localStorage.setItem(
      'exam_reason_examples',
      JSON.stringify([
        {
          questionId: 1,
          studentId: 1,
          studentAnswer: 'Answer',
          highlightType: 'correct',
          reason: '',
        },
        {
          questionId: 1,
          studentId: 1,
          studentAnswer: 'Answer',
          highlightType: 'invalid',
          reason: '',
        },
      ]),
    )
    localStorage.setItem(
      'exam_gold_standard_examples',
      JSON.stringify([
        {
          student_id: 1,
          question_id: 1,
          answer: { correct: [], wrong: [], unclear: [] },
          total_score: null,
        },
        {
          student_id: 2,
          question_id: 1,
          answer: { correct: [], wrong: [], unclear: [] },
          total_score: -1,
        },
      ]),
    )

    const store = useExamDataStore()
    store.loadFromLocal()

    expect(store.questions).toHaveLength(1)
    expect(store.referenceAnswers).toHaveLength(1)
    expect(store.studentAnswers).toHaveLength(1)
    expect(store.highlightDataList).toHaveLength(1)
    expect(store.reasonExamples).toHaveLength(1)
    expect(store.goldStandardExamples).toHaveLength(1)
  })

  it('tolerates unavailable browser storage', () => {
    const store = prepareStore()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => {
        throw new Error('blocked')
      }),
      setItem: vi.fn(() => {
        throw new Error('blocked')
      }),
      removeItem: vi.fn(),
    })

    expect(() => store.saveToLocal()).not.toThrow()
    expect(() => store.loadFromLocal()).not.toThrow()
    expect(store.questions).toEqual([])
  })
})
