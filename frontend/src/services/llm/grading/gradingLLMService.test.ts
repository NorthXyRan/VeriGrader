import { describe, expect, it } from 'vitest'

import { parseGradingResult } from './gradingLLMService'

describe('parseGradingResult', () => {
  const valid = {
    student_id: 4,
    question_id: 2,
    answer: {
      correct: [
        {
          'Student answer': 'text',
          'matched reference answer': 'reference',
          reason: 'correct',
        },
      ],
      wrong: [],
      unclear: [],
    },
    total_score: 1,
  }

  it('parses plain and fenced JSON', () => {
    expect(parseGradingResult(JSON.stringify(valid), 4, 2)).toEqual(valid)
    expect(parseGradingResult(`\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``, 4, 2)).toEqual(valid)
  })

  it('rejects mismatched IDs and malformed highlights', () => {
    expect(() => parseGradingResult(JSON.stringify(valid), 99, 2)).toThrow(/student_id/i)
    expect(() =>
      parseGradingResult(
        JSON.stringify({ ...valid, answer: { ...valid.answer, correct: [{}] } }),
        4,
        2,
      ),
    ).toThrow(/highlight/i)
    expect(() => parseGradingResult(JSON.stringify(valid), 4, 99)).toThrow(/question_id/i)
    expect(() => parseGradingResult(JSON.stringify({ ...valid, answer: null }), 4, 2)).toThrow(
      /categories/i,
    )
  })

  it('rejects non-finite and out-of-range scores', () => {
    expect(() =>
      parseGradingResult(JSON.stringify({ ...valid, total_score: -1 }), 4, 2, 2),
    ).toThrow(/score/i)
    expect(() => parseGradingResult(JSON.stringify({ ...valid, total_score: 3 }), 4, 2, 2)).toThrow(
      /score/i,
    )
  })
})
