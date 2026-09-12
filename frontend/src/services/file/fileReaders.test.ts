import { describe, expect, it } from 'vitest'

import exampleAnswers from '../../../../examples/reference_answers.json'
import examplePaper from '../../../../examples/paper.json'
import exampleStudents from '../../../../examples/student_answers.json'
import { validateDataRelationships, validateJsonData, validateUploadFile } from './fileValidation'

describe('published example data', () => {
  it('matches the accepted upload schemas and relationships', () => {
    expect(validateJsonData(examplePaper, 'paper')).toBe(true)
    expect(validateJsonData(exampleAnswers, 'answer')).toBe(true)
    expect(validateJsonData(exampleStudents, 'student')).toBe(true)
    expect(
      validateDataRelationships(examplePaper.questions, exampleAnswers.answers, exampleStudents),
    ).toBe(true)
  })
})

describe('validateJsonData', () => {
  it('accepts valid paper, answer, and student data', () => {
    expect(
      validateJsonData(
        { questions: [{ question_id: 1, question: 'Question?', score: 2 }] },
        'paper',
      ),
    ).toBe(true)
    expect(
      validateJsonData(
        { answers: [{ question_id: 1, answer: 'Answer', eachScoringPoint: 1 }] },
        'answer',
      ),
    ).toBe(true)
    expect(validateJsonData([{ student_id: 1, question_id: 1, answer: '' }], 'student')).toBe(true)
  })

  it.each([
    [{ questions: [{ question_id: 1, question: 'Q', score: 0 }] }, 'paper'],
    [{ questions: [{ question_id: 1, question: 'Q', score: Number.NaN }] }, 'paper'],
    [{ answers: [{ question_id: '1', answer: 'A' }] }, 'answer'],
    [[{ student_id: 1, question_id: 1, answer: 'A' }, { student_id: 2 }], 'student'],
  ] as const)('rejects invalid records throughout a file', (data, type) => {
    expect(() => validateJsonData(data, type)).toThrow()
  })

  it('rejects duplicate question and student-question identifiers', () => {
    expect(() =>
      validateJsonData(
        {
          questions: [
            { question_id: 1, question: 'Q1', score: 1 },
            { question_id: 1, question: 'Q2', score: 1 },
          ],
        },
        'paper',
      ),
    ).toThrow(/duplicate/i)

    expect(() =>
      validateJsonData(
        [
          { student_id: 1, question_id: 1, answer: 'A' },
          { student_id: 1, question_id: 1, answer: 'B' },
        ],
        'student',
      ),
    ).toThrow(/duplicate/i)
  })
})

describe('validateUploadFile', () => {
  it('rejects unsupported extensions and oversized files', () => {
    expect(() => validateUploadFile(new File(['x'], 'paper.doc'), 'paper')).toThrow(/format/i)
    expect(() => validateUploadFile(new File(['1234'], 'paper.json'), 'paper', 3)).toThrow(/size/i)
    expect(() => validateUploadFile(new File(['x'], 'students.txt'), 'student')).toThrow(/format/i)
  })

  it('accepts supported files', () => {
    expect(validateUploadFile(new File(['{}'], 'paper.JSON'), 'paper')).toBe(true)
    expect(validateUploadFile(new File(['[]'], 'students.json'), 'student')).toBe(true)
  })
})

describe('validateDataRelationships', () => {
  const questions = [
    { question_id: 1, question: 'Q1', score: 1 },
    { question_id: 2, question: 'Q2', score: 1 },
  ]
  const answers = [
    { question_id: 1, answer: 'A1' },
    { question_id: 2, answer: 'A2' },
  ]

  it('accepts complete related data', () => {
    expect(
      validateDataRelationships(questions, answers, [
        { student_id: 1, question_id: 1, answer: '' },
        { student_id: 1, question_id: 2, answer: 'A' },
      ]),
    ).toBe(true)
  })

  it('rejects missing references and incomplete student submissions', () => {
    expect(() => validateDataRelationships(questions, answers.slice(0, 1))).toThrow(/reference/i)
    expect(() =>
      validateDataRelationships(questions, answers, [
        { student_id: 1, question_id: 1, answer: 'A' },
      ]),
    ).toThrow(/student/i)
  })

  it('rejects duplicate identifiers even when both datasets match', () => {
    const duplicateQuestions = [questions[0], questions[0]]
    const duplicateAnswers = [answers[0], answers[0]]

    expect(() => validateDataRelationships(duplicateQuestions, duplicateAnswers)).toThrow(
      /duplicate/i,
    )
  })

  it('rejects a duplicated student answer that replaces a missing question', () => {
    expect(() =>
      validateDataRelationships(questions, answers, [
        { student_id: 1, question_id: 1, answer: 'First version' },
        { student_id: 1, question_id: 1, answer: 'Duplicate version' },
      ]),
    ).toThrow(/student/i)
  })
})
