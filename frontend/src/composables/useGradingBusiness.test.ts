import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/deployment', () => ({
  isPagesDemo: true,
  workspaceStorageKey: (key: string) => key,
}))
vi.mock('@/components/Message', () => ({
  Message: { info: vi.fn(), success: vi.fn(), error: vi.fn(), close: vi.fn() },
}))

import sample from '@/demo/cases/q1'
import { getDemoGradingResult, renderResponse } from '@/demo/gradingResults'
import { generateReasonForHighlight } from '@/services/llm/grading/reasonGenerationService'
import { useExamDataStore } from '@/stores/useExamDataStore'
import { useGradingBusiness } from './useGradingBusiness'

describe('relabeling an existing annotation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => vi.useRealTimers())

  function prepare() {
    const store = useExamDataStore()
    store.setQuestions([{ question_id: 1, question: 'Q', score: 1 }])
    store.setReferenceAnswers([{ question_id: 1, answer: 'point one', eachScoringPoint: 1 }])
    store.setStudentAnswers([{ student_id: 1, question_id: 1, answer: 'custom response' }])
    store.addHighlightData({
      student_id: 1,
      question_id: 1,
      answer: {
        correct: [],
        wrong: [],
        unclear: [
          {
            'Student answer': 'custom response',
            'matched reference answer': 'point one',
            reason: 'Needs review.',
          },
        ],
      },
      total_score: 0,
    })
    return store
  }

  it('preserves the reference and recomputes the score through direct label changes', () => {
    const store = prepare()
    const { saveReasonDirectly } = useGradingBusiness()
    for (const type of ['correct', 'wrong', 'correct'] as const) {
      saveReasonDirectly('custom response', type, 'Instructor rationale.', 1, 1)
      const result = store.getHighlightData(1, 1)!
      expect(result.answer[type][0]?.['matched reference answer']).toBe('point one')
      expect(result.total_score).toBe(type === 'correct' ? 1 : 0)
      expect(Object.values(result.answer).flat()).toHaveLength(1)
    }
  })

  it('keeps the live reference for a custom Pages annotation missing from demo fixtures', async () => {
    const store = prepare()
    const pending = useGradingBusiness().generateReasonWithFeedback(
      'custom response',
      'correct',
      1,
      1,
    )
    await vi.advanceTimersByTimeAsync(350)
    await pending
    expect(store.getHighlightData(1, 1)).toMatchObject({
      answer: { correct: [{ 'matched reference answer': 'point one' }], unclear: [] },
      total_score: 1,
    })
  })

  it.each([sample.rubric[0]!, ''])(
    'preserves the live Pages reference %j instead of the prepared match',
    async (liveReference) => {
      const store = useExamDataStore()
      const initial = getDemoGradingResult(1, 1)!
      const piece = initial.answer.unclear[0]!
      piece['matched reference answer'] = liveReference
      store.setQuestions([sample.question])
      store.setReferenceAnswers([
        { question_id: 1, answer: sample.rubric.join('\n\n'), eachScoringPoint: 1 },
      ])
      store.setStudentAnswers([
        { student_id: 1, question_id: 1, answer: renderResponse(sample.responses[0]!) },
      ])
      store.addHighlightData(initial)
      const pending = useGradingBusiness().generateReasonWithFeedback(
        piece['Student answer'],
        'correct',
        1,
        1,
      )
      await vi.advanceTimersByTimeAsync(350)
      await pending
      const updated = store
        .getHighlightData(1, 1)!
        .answer.correct.find((item) => item['Student answer'] === piece['Student answer'])
      expect(updated?.['matched reference answer']).toBe(liveReference)
    },
  )

  it('keeps the demo reference across labels without reusing an incompatible rationale', async () => {
    const initial = getDemoGradingResult(1, 1)!.answer.unclear[0]!
    const pending = generateReasonForHighlight({
      question: sample.question,
      referenceAnswer: { question_id: 1, answer: sample.rubric.join('\n\n'), eachScoringPoint: 1 },
      studentAnswer: {
        student_id: 1,
        question_id: 1,
        answer: renderResponse(sample.responses[0]!),
      },
      highlightedText: initial['Student answer'],
      highlightType: 'correct',
    })
    await vi.advanceTimersByTimeAsync(350)
    const generated = await pending
    expect(generated.matchedReferenceAnswer).toBe(initial['matched reference answer'])
    expect(generated.reason).not.toBe(initial.reason)
    expect(generated.reason).toBe('Click here to write your rationale for this annotation.')
  })
})
