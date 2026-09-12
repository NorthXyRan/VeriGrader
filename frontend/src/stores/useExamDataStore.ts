import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { validateDataRelationships } from '@/services/file/fileValidation'
import {
  HIGHLIGHT_TYPES,
  isHighlightType,
  type GoldStandardExample,
  type HighlightData,
  type HighlightItem,
  type HighlightType,
  type Question,
  type ReasonExample,
  type ReferenceAnswer,
  type StudentAnswer,
  type StudentInfo,
} from '@/types/exam'
import { sanitizeHighlightData } from '@/utils/highlightMetrics'

export type {
  GoldStandardExample,
  HighlightData,
  HighlightItem,
  HighlightType,
  Question,
  ReasonExample,
  ReferenceAnswer,
  StudentAnswer,
  StudentInfo,
} from '@/types/exam'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function loadArray<Value>(key: string, guard: (value: unknown) => value is Value): Value[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value.filter(guard) : []
  } catch {
    return []
  }
}

function isQuestion(value: unknown): value is Question {
  return (
    isRecord(value) &&
    isPositiveInteger(value.question_id) &&
    isNonEmptyString(value.question) &&
    isNonNegativeNumber(value.score) &&
    value.score > 0
  )
}

function isReferenceAnswer(value: unknown): value is ReferenceAnswer {
  return (
    isRecord(value) &&
    isPositiveInteger(value.question_id) &&
    isNonEmptyString(value.answer) &&
    (value.eachScoringPoint === undefined ||
      (isNonNegativeNumber(value.eachScoringPoint) && value.eachScoringPoint > 0))
  )
}

function isStudentAnswer(value: unknown): value is StudentAnswer {
  return (
    isRecord(value) &&
    isPositiveInteger(value.student_id) &&
    isPositiveInteger(value.question_id) &&
    typeof value.answer === 'string'
  )
}

function isHighlightItem(value: unknown): value is HighlightItem {
  return (
    isRecord(value) &&
    typeof value['Student answer'] === 'string' &&
    typeof value['matched reference answer'] === 'string' &&
    typeof value.reason === 'string'
  )
}

function isHighlightData(value: unknown): value is HighlightData {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.student_id) ||
    !isPositiveInteger(value.question_id) ||
    !isNonNegativeNumber(value.total_score) ||
    (value.isGold !== undefined && typeof value.isGold !== 'boolean') ||
    (value.isConfirmed !== undefined && typeof value.isConfirmed !== 'boolean') ||
    !isRecord(value.answer)
  ) {
    return false
  }
  const answer = value.answer
  return HIGHLIGHT_TYPES.every(
    (type) => Array.isArray(answer[type]) && answer[type].every(isHighlightItem),
  )
}

function isReasonExample(value: unknown): value is ReasonExample {
  return (
    isRecord(value) &&
    isPositiveInteger(value.questionId) &&
    isPositiveInteger(value.studentId) &&
    isNonEmptyString(value.studentAnswer) &&
    isHighlightType(value.highlightType) &&
    typeof value.reason === 'string' &&
    (value.matchedReferenceAnswer === undefined || typeof value.matchedReferenceAnswer === 'string')
  )
}

function isGoldStandardExample(value: unknown): value is GoldStandardExample {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.student_id) ||
    !isPositiveInteger(value.question_id) ||
    !(value.total_score === null || isNonNegativeNumber(value.total_score)) ||
    !isRecord(value.answer)
  ) {
    return false
  }
  const answer = value.answer
  return HIGHLIGHT_TYPES.every(
    (type) => Array.isArray(answer[type]) && answer[type].every(isHighlightItem),
  )
}

const cloneHighlightItems = (items: HighlightItem[]) => items.map((item) => ({ ...item }))

function cloneHighlightData(data: HighlightData): HighlightData {
  return {
    ...data,
    answer: {
      correct: cloneHighlightItems(data.answer.correct),
      wrong: cloneHighlightItems(data.answer.wrong),
      unclear: cloneHighlightItems(data.answer.unclear),
    },
  }
}

export const useExamDataStore = defineStore('examData', () => {
  const questions = ref<Question[]>([])
  const referenceAnswers = ref<ReferenceAnswer[]>([])
  const studentAnswers = ref<StudentAnswer[]>([])
  const studentList = ref<StudentInfo[]>([])
  const highlightDataList = ref<HighlightData[]>([])
  const reasonExamples = ref<ReasonExample[]>([])
  const goldStandardExamples = ref<GoldStandardExample[]>([])

  const questionCount = computed(() => questions.value.length)
  const referenceAnswerCount = computed(() => referenceAnswers.value.length)
  const studentCount = computed(() => studentList.value.length)
  const totalAnswerCount = computed(() => studentAnswers.value.length)

  const getQuestionById = (questionId: number) =>
    questions.value.find((question) => question.question_id === questionId)

  const getReferenceAnswer = (questionId: number) =>
    referenceAnswers.value.find((answer) => answer.question_id === questionId)

  const getStudentAnswer = (studentId: number, questionId: number) =>
    studentAnswers.value.find(
      (answer) => answer.student_id === studentId && answer.question_id === questionId,
    )

  const findHighlightData = (studentId: number, questionId: number) =>
    highlightDataList.value.find(
      (data) => data.student_id === studentId && data.question_id === questionId,
    )

  const getHighlightData = (studentId: number, questionId: number) => {
    const data = findHighlightData(studentId, questionId)
    return data ? cloneHighlightData(data) : undefined
  }

  const isDataComplete = computed(() => {
    if (!questions.value.length || !referenceAnswers.value.length || !studentAnswers.value.length) {
      return false
    }
    try {
      return validateDataRelationships(
        questions.value,
        referenceAnswers.value,
        studentAnswers.value,
      )
    } catch {
      return false
    }
  })

  const setQuestions = (data: Question[]) => (questions.value = data)
  const setReferenceAnswers = (data: ReferenceAnswer[]) => (referenceAnswers.value = data)
  const setStudentAnswers = (data: StudentAnswer[]) => {
    studentAnswers.value = data
    studentList.value = [...new Set(data.map((answer) => answer.student_id))].map((id) => ({ id }))
  }

  function addHighlightData(highlight: HighlightData): boolean {
    const existingIndex = highlightDataList.value.findIndex(
      (data) =>
        data.student_id === highlight.student_id && data.question_id === highlight.question_id,
    )
    const existing = highlightDataList.value[existingIndex]
    if (existing?.isGold || existing?.isConfirmed) return false

    const studentAnswer = getStudentAnswer(highlight.student_id, highlight.question_id)
    const referenceAnswer = getReferenceAnswer(highlight.question_id)
    const cleaned = studentAnswer
      ? sanitizeHighlightData(studentAnswer.answer, highlight, {
          referenceContent: referenceAnswer?.answer,
        })
      : highlight

    const stored = cloneHighlightData(cleaned)

    if (existingIndex === -1) highlightDataList.value.push(stored)
    else highlightDataList.value[existingIndex] = stored
    return true
  }

  function setConfirmation(studentId: number, questionId: number, confirmed: boolean): boolean {
    const data = findHighlightData(studentId, questionId)
    if (!data) return false
    data.isConfirmed = confirmed
    return true
  }

  const confirmHighlightData = (studentId: number, questionId: number) =>
    setConfirmation(studentId, questionId, true)
  const unconfirmHighlightData = (studentId: number, questionId: number) =>
    setConfirmation(studentId, questionId, false)
  const isConfirmedPaper = (studentId: number, questionId: number) =>
    findHighlightData(studentId, questionId)?.isConfirmed === true

  function addReasonExample(example: ReasonExample): void {
    const duplicate = reasonExamples.value.some(
      (current) =>
        current.questionId === example.questionId &&
        current.studentId === example.studentId &&
        current.studentAnswer === example.studentAnswer &&
        current.highlightType === example.highlightType &&
        current.reason === example.reason &&
        (current.matchedReferenceAnswer || '') === (example.matchedReferenceAnswer || ''),
    )
    if (!duplicate) reasonExamples.value.push(example)
  }

  function removeReasonExample(
    questionId: number,
    studentId: number,
    studentAnswer: string,
    highlightType: HighlightType,
    reason: string,
    matchedReferenceAnswer?: string,
  ): boolean {
    const originalLength = reasonExamples.value.length
    reasonExamples.value = reasonExamples.value.filter(
      (example) =>
        !(
          example.questionId === questionId &&
          example.studentId === studentId &&
          example.studentAnswer === studentAnswer &&
          example.highlightType === highlightType &&
          example.reason === reason &&
          (example.matchedReferenceAnswer || '') === (matchedReferenceAnswer || '')
        ),
    )
    return reasonExamples.value.length < originalLength
  }

  function toGoldExample(data: HighlightData): GoldStandardExample {
    return {
      student_id: data.student_id,
      question_id: data.question_id,
      answer: {
        correct: cloneHighlightItems(data.answer.correct),
        wrong: cloneHighlightItems(data.answer.wrong),
        unclear: cloneHighlightItems(data.answer.unclear),
      },
      total_score: data.total_score,
    }
  }

  function setGoldPaper(studentId: number, questionId: number): boolean {
    const data = findHighlightData(studentId, questionId)
    if (!data) return false

    data.isGold = true
    data.isConfirmed = true
    goldStandardExamples.value = goldStandardExamples.value.filter(
      (example) => example.student_id !== studentId || example.question_id !== questionId,
    )
    goldStandardExamples.value.push(toGoldExample(data))
    return true
  }

  function removeGoldPaper(studentId: number, questionId: number): boolean {
    const data = findHighlightData(studentId, questionId)
    if (!data) return false

    data.isGold = false
    data.isConfirmed = false
    goldStandardExamples.value = goldStandardExamples.value.filter(
      (example) => example.student_id !== studentId || example.question_id !== questionId,
    )
    return true
  }

  const isGoldPaper = (studentId: number, questionId: number) =>
    findHighlightData(studentId, questionId)?.isGold === true
  const getReasonExamplesByQuestion = (questionId: number) =>
    reasonExamples.value.filter((example) => example.questionId === questionId)
  const getGoldStandardExamplesByQuestion = (questionId: number) =>
    goldStandardExamples.value.filter((example) => example.question_id === questionId)
  const getTotalExampleCountByQuestion = (questionId: number) =>
    getReasonExamplesByQuestion(questionId).length +
    getGoldStandardExamplesByQuestion(questionId).length

  const resetQuestions = () => (questions.value = [])
  const resetReferenceAnswers = () => (referenceAnswers.value = [])
  const resetStudentData = () => {
    studentAnswers.value = []
    studentList.value = []
    highlightDataList.value = []
    reasonExamples.value = []
    goldStandardExamples.value = []
  }
  const resetAllData = () => {
    resetQuestions()
    resetReferenceAnswers()
    resetStudentData()
  }

  function saveToLocal(): void {
    try {
      localStorage.setItem('exam_questions', JSON.stringify(questions.value))
      localStorage.setItem('exam_reference_answers', JSON.stringify(referenceAnswers.value))
      localStorage.setItem('exam_student_answers', JSON.stringify(studentAnswers.value))
      localStorage.setItem('exam_highlight_data', JSON.stringify(highlightDataList.value))
      localStorage.setItem('exam_reason_examples', JSON.stringify(reasonExamples.value))
      localStorage.setItem(
        'exam_gold_standard_examples',
        JSON.stringify(goldStandardExamples.value),
      )
      localStorage.removeItem('exam_student_list')
    } catch {}
  }

  function loadFromLocal(): void {
    questions.value = loadArray('exam_questions', isQuestion)
    referenceAnswers.value = loadArray('exam_reference_answers', isReferenceAnswer)
    setStudentAnswers(loadArray('exam_student_answers', isStudentAnswer))
    highlightDataList.value = loadArray('exam_highlight_data', isHighlightData)
    reasonExamples.value = loadArray('exam_reason_examples', isReasonExample)
    goldStandardExamples.value = loadArray('exam_gold_standard_examples', isGoldStandardExample)
  }

  return {
    questions,
    referenceAnswers,
    studentAnswers,
    studentList,
    highlightDataList,
    reasonExamples,
    goldStandardExamples,
    questionCount,
    referenceAnswerCount,
    studentCount,
    totalAnswerCount,
    getQuestionById,
    getReferenceAnswer,
    getStudentAnswer,
    getHighlightData,
    isDataComplete,
    setQuestions,
    setReferenceAnswers,
    setStudentAnswers,
    addHighlightData,
    confirmHighlightData,
    unconfirmHighlightData,
    isConfirmedPaper,
    addReasonExample,
    removeReasonExample,
    setGoldPaper,
    removeGoldPaper,
    isGoldPaper,
    getReasonExamplesByQuestion,
    getGoldStandardExamplesByQuestion,
    getTotalExampleCountByQuestion,
    resetQuestions,
    resetReferenceAnswers,
    resetStudentData,
    resetAllData,
    saveToLocal,
    loadFromLocal,
  }
})
