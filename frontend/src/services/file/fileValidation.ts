import type { Question, ReferenceAnswer, StudentAnswer } from '@/types/exam'

export type UploadDataType = 'paper' | 'answer' | 'student'
export type PaperData = { questions: Question[] }
export type AnswerData = { answers: ReferenceAnswer[] }

export interface UploadDataMap {
  paper: PaperData
  answer: AnswerData
  student: StudentAnswer[]
}

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024

const ALLOWED_EXTENSIONS: Record<UploadDataType, readonly string[]> = {
  paper: ['.json', '.txt', '.docx'],
  answer: ['.json', '.txt', '.docx'],
  student: ['.json'],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} contains duplicate IDs`)
}

export function validateJsonData<Type extends UploadDataType>(
  jsonData: unknown,
  type: Type,
): jsonData is UploadDataMap[Type] {
  if (type === 'paper') {
    if (!isRecord(jsonData) || !Array.isArray(jsonData.questions) || !jsonData.questions.length) {
      throw new Error('Paper must contain a non-empty questions array')
    }

    const ids = jsonData.questions.map((question, index) => {
      if (
        !isRecord(question) ||
        !isPositiveInteger(question.question_id) ||
        !isNonEmptyString(question.question) ||
        !isPositiveNumber(question.score)
      ) {
        throw new Error(`Invalid paper question at index ${index}`)
      }
      return String(question.question_id)
    })
    assertUnique(ids, 'Paper')
    return true
  }

  if (type === 'answer') {
    if (!isRecord(jsonData) || !Array.isArray(jsonData.answers) || !jsonData.answers.length) {
      throw new Error('Reference answer file must contain a non-empty answers array')
    }

    const ids = jsonData.answers.map((answer, index) => {
      if (
        !isRecord(answer) ||
        !isPositiveInteger(answer.question_id) ||
        !isNonEmptyString(answer.answer) ||
        (answer.eachScoringPoint !== undefined && !isPositiveNumber(answer.eachScoringPoint))
      ) {
        throw new Error(`Invalid reference answer at index ${index}`)
      }
      return String(answer.question_id)
    })
    assertUnique(ids, 'Reference answer file')
    return true
  }

  if (type === 'student') {
    if (!Array.isArray(jsonData) || !jsonData.length) {
      throw new Error('Student answer file must be a non-empty array')
    }

    const ids = jsonData.map((answer, index) => {
      if (
        !isRecord(answer) ||
        !isPositiveInteger(answer.student_id) ||
        !isPositiveInteger(answer.question_id) ||
        typeof answer.answer !== 'string'
      ) {
        throw new Error(`Invalid student answer at index ${index}`)
      }
      return `${answer.student_id}:${answer.question_id}`
    })
    assertUnique(ids, 'Student answer file')
    return true
  }

  throw new Error('Unknown upload data type')
}

export function validateUploadFile(
  file: Pick<File, 'name' | 'size'>,
  type: UploadDataType,
  maxSize = MAX_UPLOAD_SIZE,
): true {
  const name = file.name.toLowerCase()
  if (!ALLOWED_EXTENSIONS[type].some((extension) => name.endsWith(extension))) {
    throw new Error(`Unsupported ${type} file format`)
  }
  if (file.size > maxSize)
    throw new Error(`File size exceeds ${Math.floor(maxSize / 1024 / 1024)} MB`)
  return true
}

function sameIds(left: number[], right: number[]): boolean {
  if (left.length !== right.length) return false
  const expected = new Set(left)
  return (
    expected.size === left.length &&
    new Set(right).size === right.length &&
    right.every((id) => expected.has(id))
  )
}

export function validateDataRelationships(
  questions: Question[],
  referenceAnswers: ReferenceAnswer[],
  studentAnswers?: StudentAnswer[],
): true {
  const questionIds = questions.map((question) => question.question_id)
  const referenceIds = referenceAnswers.map((answer) => answer.question_id)
  assertUnique(questionIds.map(String), 'Paper')
  assertUnique(referenceIds.map(String), 'Reference answer file')

  if (!sameIds(questionIds, referenceIds)) {
    throw new Error('Reference answers must match every paper question exactly')
  }

  if (!studentAnswers) return true

  const answersByStudent = new Map<number, number[]>()
  for (const answer of studentAnswers) {
    const ids = answersByStudent.get(answer.student_id) ?? []
    ids.push(answer.question_id)
    answersByStudent.set(answer.student_id, ids)
  }

  for (const [studentId, ids] of answersByStudent) {
    if (!sameIds(questionIds, ids)) {
      throw new Error(`Student ${studentId} must have exactly one answer for every paper question`)
    }
  }

  return true
}
