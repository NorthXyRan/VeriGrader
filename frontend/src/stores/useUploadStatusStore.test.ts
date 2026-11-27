import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useUploadStatusStore } from './useUploadStatusStore'

describe('useUploadStatusStore', () => {
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

  it('enforces the paper, reference-answer, and student upload order', () => {
    const store = useUploadStatusStore()
    expect(store.canUploadAnswer).toBe(false)
    expect(store.canUploadStudent).toBe(false)
    expect(store.canProceedToGrading).toBe(false)

    store.setPaperUploading('paper.json', 'paper')
    store.setPaperReady({ questionCount: 2 })
    expect(store.canUploadAnswer).toBe(true)

    store.setAnswerUploading('reference.json', 'reference')
    store.setAnswerReady({ answerCount: 2 })
    expect(store.canUploadStudent).toBe(true)

    store.setStudentUploading('students.json', 'students')
    store.setStudentReady({ studentCount: 2, answerCount: 4 })
    expect(store.canProceedToGrading).toBe(true)
  })

  it('records errors and resets individual items', () => {
    const store = useUploadStatusStore()
    store.setPaperUploading('paper.json', 'content')
    store.setPaperError('Invalid paper')
    expect(store.examPaper).toMatchObject({
      name: 'paper.json',
      rawContent: 'content',
      status: 'error',
      error: 'Invalid paper',
    })

    store.resetPaper()
    expect(store.examPaper).toEqual({ name: '', status: 'idle', rawContent: '' })
  })

  it('persists metadata without retaining uploaded document content', () => {
    const store = useUploadStatusStore()
    store.setPaperUploading('paper.json', 'sensitive content')
    store.setPaperReady({ questionCount: 2 })

    const saved = JSON.parse(localStorage.getItem('upload_exam_paper') || '{}')
    expect(saved).toMatchObject({
      name: 'paper.json',
      status: 'ready',
      rawContent: '',
      meta: { questionCount: 2 },
    })
  })

  it('restores valid metadata and converts interrupted uploads to idle', () => {
    localStorage.setItem(
      'upload_exam_paper',
      JSON.stringify({
        name: 'paper.json',
        status: 'ready',
        rawContent: 'discard me',
        meta: { questionCount: 2 },
      }),
    )
    localStorage.setItem(
      'upload_reference_answer',
      JSON.stringify({ name: 'reference.json', status: 'processing', rawContent: 'discard me' }),
    )

    const store = useUploadStatusStore()
    store.loadFromLocal()

    expect(store.examPaper).toEqual({
      name: 'paper.json',
      status: 'ready',
      rawContent: '',
      error: undefined,
      meta: { questionCount: 2 },
    })
    expect(store.referenceAnswer).toMatchObject({
      name: 'reference.json',
      status: 'idle',
      rawContent: '',
    })
  })

  it('ignores malformed items and invalid metadata', () => {
    localStorage.setItem('upload_exam_paper', '{broken')
    localStorage.setItem(
      'upload_reference_answer',
      JSON.stringify({ name: 'reference.json', status: 'unknown' }),
    )
    localStorage.setItem(
      'upload_student_answers',
      JSON.stringify({
        name: 'students.json',
        status: 'ready',
        meta: { studentCount: -1 },
      }),
    )

    const store = useUploadStatusStore()
    store.loadFromLocal()

    expect(store.examPaper.status).toBe('idle')
    expect(store.referenceAnswer.status).toBe('idle')
    expect(store.studentAnswers.meta).toBeUndefined()
  })

  it('resets all upload state', () => {
    const store = useUploadStatusStore()
    store.setPaperUploading('paper.json', 'paper')
    store.setAnswerUploading('reference.json', 'reference')
    store.setStudentUploading('students.json', 'students')
    store.resetAll()

    expect(store.examPaper.status).toBe('idle')
    expect(store.referenceAnswer.status).toBe('idle')
    expect(store.studentAnswers.status).toBe('idle')
  })

  it('tolerates unavailable browser storage', () => {
    const store = useUploadStatusStore()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => {
        throw new Error('blocked')
      }),
      setItem: vi.fn(() => {
        throw new Error('blocked')
      }),
    })

    expect(() => store.setPaperUploading('paper.json', 'paper')).not.toThrow()
    expect(() => store.loadFromLocal()).not.toThrow()
  })
})
