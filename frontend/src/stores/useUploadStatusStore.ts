import { defineStore } from 'pinia'
import { computed, ref, type Ref } from 'vue'

export type UploadStatus = 'idle' | 'processing' | 'ready' | 'error'

export interface UploadMeta {
  questionCount?: number
  answerCount?: number
  studentCount?: number
}

export interface UploadItem {
  name: string
  status: UploadStatus
  rawContent: string
  error?: string
  meta?: UploadMeta
}

const emptyItem = (): UploadItem => ({ name: '', status: 'idle', rawContent: '' })
const uploadStatuses: UploadStatus[] = ['idle', 'processing', 'ready', 'error']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isUploadStatus(value: unknown): value is UploadStatus {
  return typeof value === 'string' && uploadStatuses.some((status) => status === value)
}

function parseMeta(value: unknown): UploadMeta | undefined {
  if (!isRecord(value)) return undefined
  const meta: UploadMeta = {}

  for (const key of ['questionCount', 'answerCount', 'studentCount'] as const) {
    const count = value[key]
    if (count !== undefined) {
      if (!Number.isSafeInteger(count) || Number(count) < 0) return undefined
      meta[key] = Number(count)
    }
  }
  return meta
}

function parseStoredItem(value: string | null): UploadItem | null {
  if (!value) return null
  try {
    const item: unknown = JSON.parse(value)
    if (!isRecord(item) || typeof item.name !== 'string' || !isUploadStatus(item.status)) {
      return null
    }

    const status = item.status === 'processing' ? 'idle' : item.status
    const error = typeof item.error === 'string' ? item.error : undefined
    return {
      name: item.name,
      status,
      rawContent: '',
      error,
      meta: parseMeta(item.meta),
    }
  } catch {
    return null
  }
}

export const useUploadStatusStore = defineStore('uploadStatus', () => {
  const examPaper = ref<UploadItem>(emptyItem())
  const referenceAnswer = ref<UploadItem>(emptyItem())
  const studentAnswers = ref<UploadItem>(emptyItem())

  const canUploadAnswer = computed(() => examPaper.value.status === 'ready')
  const canUploadStudent = computed(
    () => examPaper.value.status === 'ready' && referenceAnswer.value.status === 'ready',
  )
  const canProceedToGrading = computed(
    () =>
      examPaper.value.status === 'ready' &&
      referenceAnswer.value.status === 'ready' &&
      studentAnswers.value.status === 'ready',
  )

  function update(item: Ref<UploadItem>, changes: Partial<UploadItem>): void {
    item.value = { ...item.value, ...changes }
    saveToLocal()
  }

  function start(item: Ref<UploadItem>, name: string, rawContent: string): void {
    update(item, { name, rawContent, status: 'processing', error: undefined, meta: undefined })
  }

  function ready(item: Ref<UploadItem>, meta: UploadMeta): void {
    update(item, { status: 'ready', meta, error: undefined })
  }

  function fail(item: Ref<UploadItem>, error: string): void {
    update(item, { status: 'error', error })
  }

  function reset(item: Ref<UploadItem>): void {
    item.value = emptyItem()
    saveToLocal()
  }

  const setPaperUploading = (name: string, content: string) => start(examPaper, name, content)
  const setPaperReady = (meta: UploadMeta) => ready(examPaper, meta)
  const setPaperError = (error: string) => fail(examPaper, error)
  const resetPaper = () => reset(examPaper)

  const setAnswerUploading = (name: string, content: string) =>
    start(referenceAnswer, name, content)
  const setAnswerReady = (meta: UploadMeta) => ready(referenceAnswer, meta)
  const setAnswerError = (error: string) => fail(referenceAnswer, error)
  const resetAnswer = () => reset(referenceAnswer)

  const setStudentUploading = (name: string, content: string) =>
    start(studentAnswers, name, content)
  const setStudentReady = (meta: UploadMeta) => ready(studentAnswers, meta)
  const setStudentError = (error: string) => fail(studentAnswers, error)
  const resetStudent = () => reset(studentAnswers)

  function resetAll(): void {
    examPaper.value = emptyItem()
    referenceAnswer.value = emptyItem()
    studentAnswers.value = emptyItem()
    saveToLocal()
  }

  function saveToLocal(): void {
    const withoutContent = (item: UploadItem) => ({ ...item, rawContent: '' })
    try {
      localStorage.setItem('upload_exam_paper', JSON.stringify(withoutContent(examPaper.value)))
      localStorage.setItem(
        'upload_reference_answer',
        JSON.stringify(withoutContent(referenceAnswer.value)),
      )
      localStorage.setItem(
        'upload_student_answers',
        JSON.stringify(withoutContent(studentAnswers.value)),
      )
    } catch {}
  }

  function loadFromLocal(): void {
    try {
      const paper = parseStoredItem(localStorage.getItem('upload_exam_paper'))
      const answer = parseStoredItem(localStorage.getItem('upload_reference_answer'))
      const students = parseStoredItem(localStorage.getItem('upload_student_answers'))
      if (paper) examPaper.value = paper
      if (answer) referenceAnswer.value = answer
      if (students) studentAnswers.value = students
    } catch {}
  }

  return {
    examPaper,
    referenceAnswer,
    studentAnswers,
    canUploadAnswer,
    canUploadStudent,
    canProceedToGrading,
    setPaperUploading,
    setPaperReady,
    setPaperError,
    resetPaper,
    setAnswerUploading,
    setAnswerReady,
    setAnswerError,
    resetAnswer,
    setStudentUploading,
    setStudentReady,
    setStudentError,
    resetStudent,
    resetAll,
    saveToLocal,
    loadFromLocal,
  }
})
