import { describe, expect, it } from 'vitest'

import { gradingThresholds } from '@/config/gradingThresholds'
import type { HighlightData } from '@/types/exam'

import { demoCases } from './cases'
import { getDemoGradingResult, responseAnnotations } from './gradingResults'

const studentIds = Array.from({ length: 12 }, (_, index) => index + 1)
/** Papers the first pass flags for review, per question. Regrading settles them. */
const flaggedStudents: Record<number, number[]> = {
  1: [4, 6, 8],
  2: [4, 8, 11],
  3: [4, 6],
  4: [2, 4, 6, 10],
}

function unclearShare(result: HighlightData): number {
  const { correct, wrong, unclear } = result.answer
  const total = correct.length + wrong.length + unclear.length
  return total === 0 ? 0 : unclear.length / total
}

function isFlagged(result: HighlightData): boolean {
  return unclearShare(result) > gradingThresholds.unclearRedundantYellow
}

describe('Pages demo cases', () => {
  it('contains four structured questions', () => {
    expect(demoCases.map(({ question }) => question.question_id)).toEqual([1, 2, 3, 4])
  })

  describe.each(demoCases)('question $question.question_id', (demoCase) => {
    const { question, rubric, pointsPerCriterion, responses } = demoCase

    it('has one scoring point per available mark', () => {
      expect(rubric.length * pointsPerCriterion).toBe(question.score)
      expect(new Set(rubric).size).toBe(rubric.length)
    })

    it('has one response from each of students 1-12', () => {
      expect(responses.map(({ studentId }) => studentId)).toEqual(studentIds)
    })

    it.each(responses.map((response) => [response.studentId, response] as const))(
      'student %i has locatable, non-overlapping annotations',
      (studentId, response) => {
        const annotations = responseAnnotations(response)
        expect(annotations.length).toBeGreaterThan(0)
        for (const annotation of annotations) {
          expect(rubric).toContain(annotation.matchedReferenceAnswer)
          expect(annotation.reason.length).toBeGreaterThan(30)
          for (const other of annotations) {
            if (other !== annotation) expect(other.text.includes(annotation.text)).toBe(false)
          }
        }

        for (const initialPass of [false, true]) {
          const result = getDemoGradingResult(studentId, question.question_id, { initialPass })!
          const located =
            result.answer.correct.length + result.answer.wrong.length + result.answer.unclear.length
          expect(located).toBe(annotations.length)
        }
      },
    )

    it('spreads scores across the cohort', () => {
      const scores = studentIds.map(
        (id) => getDemoGradingResult(id, question.question_id)!.total_score,
      )
      expect(Math.max(...scores)).toBeGreaterThanOrEqual(question.score - 1)
      expect(Math.min(...scores)).toBeLessThanOrEqual(3)
      expect(new Set(scores).size).toBeGreaterThanOrEqual(5)
    })

    it('flags a few papers on the first pass and resolves them on regrade', () => {
      const expected = flaggedStudents[question.question_id]!
      const flagged = studentIds.filter((id) =>
        isFlagged(getDemoGradingResult(id, question.question_id, { initialPass: true })!),
      )
      expect(flagged).toEqual(expected)
      for (const id of expected) {
        expect(getDemoGradingResult(id, question.question_id)!.answer.unclear).toHaveLength(0)
      }
    })

    it('regrades every other paper to the same result', () => {
      const expected = flaggedStudents[question.question_id]!
      for (const id of studentIds.filter((id) => !expected.includes(id))) {
        expect(getDemoGradingResult(id, question.question_id)).toEqual(
          getDemoGradingResult(id, question.question_id, { initialPass: true }),
        )
      }
    })
  })

  it('opens question 1 with an unclear point for student 1', () => {
    const first = getDemoGradingResult(1, 1)!
    expect(first.answer.unclear.length).toBeGreaterThan(0)
    expect(first.answer.correct.length).toBeGreaterThan(0)
    expect(isFlagged(first)).toBe(false)
  })
})
