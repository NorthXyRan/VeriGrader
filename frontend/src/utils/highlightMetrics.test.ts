import { describe, expect, it } from 'vitest'

import type { HighlightData } from '@/stores/useExamDataStore'

import {
  calcHighlightMissingRate,
  calcHighlightOverlapRate,
  computeScoreFromReferences,
  getHighlightStatistics,
  sanitizeHighlightData,
} from './highlightMetrics'

function makeData(): HighlightData {
  return {
    student_id: 1,
    question_id: 1,
    answer: {
      correct: [
        { 'Student answer': 'same', 'matched reference answer': 'point one', reason: 'ok' },
        { 'Student answer': 'same', 'matched reference answer': 'point two', reason: 'ok' },
      ],
      wrong: [{ 'Student answer': 'missing', 'matched reference answer': '', reason: 'no' }],
      unclear: [],
    },
    total_score: 2,
  }
}

describe('highlight metrics', () => {
  it('matches duplicate annotations to distinct occurrences without mutation', () => {
    const data = makeData()
    const before = structuredClone(data)

    expect(getHighlightStatistics('same and same', data)).toEqual({
      expectedHighlightCount: 3,
      actualHighlightCount: 2,
      highlightMissingRate: 1 / 3,
    })
    expect(calcHighlightMissingRate('same and same', data)).toBeCloseTo(1 / 3)
    expect(data).toEqual(before)
  })

  it('computes overlap using located ranges', () => {
    const data = makeData()
    data.answer.correct = [
      { 'Student answer': 'abc', 'matched reference answer': 'one', reason: 'ok' },
      { 'Student answer': 'bc', 'matched reference answer': 'two', reason: 'ok' },
    ]
    data.answer.wrong = []

    expect(calcHighlightOverlapRate('abc', data)).toBe(1)
  })

  it('returns a clean copy and removes invisible matches', () => {
    const data = makeData()
    const cleaned = sanitizeHighlightData('same', data, { referenceContent: 'point one' })

    expect(cleaned.answer.correct).toHaveLength(1)
    expect(cleaned.answer.correct[0]['matched reference answer']).toBe('point one')
    expect(cleaned.answer.wrong).toHaveLength(0)
    expect(data.answer.correct).toHaveLength(2)
  })

  it('deduplicates overlapping reference snippets and clamps scores', () => {
    const data = makeData()
    data.answer.correct[1]['matched reference answer'] = 'point one detail'

    expect(computeScoreFromReferences(data, { eachPoint: 2, maxScore: 1 })).toBe(1)
  })

  it('handles empty annotations and an unclamped score', () => {
    const data = makeData()
    data.answer = { correct: [], wrong: [], unclear: [] }

    expect(getHighlightStatistics('', data)).toEqual({
      expectedHighlightCount: 0,
      actualHighlightCount: 0,
      highlightMissingRate: 0,
    })
    expect(calcHighlightOverlapRate('', data)).toBe(0)
    expect(computeScoreFromReferences(data)).toBe(0)
  })
})
