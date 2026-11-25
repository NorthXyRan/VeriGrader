import { useExamDataStore } from '@/stores/useExamDataStore'
import { useUploadStatusStore } from '@/stores/useUploadStatusStore'
import type { HighlightData } from '@/types/exam'
import { computeScoreFromReferences } from '@/utils/highlightMetrics'

import paper from '../../../examples/paper.json'
import referenceAnswers from '../../../examples/reference_answers.json'
import studentAnswers from '../../../examples/student_answers.json'

const sampleResults: Omit<HighlightData, 'total_score'>[] = [
  {
    student_id: 1,
    question_id: 1,
    answer: {
      correct: [
        {
          'Student answer': 'Plants absorb sunlight with chlorophyll',
          'matched reference answer': 'Chlorophyll absorbs light energy',
          reason: 'Identifies chlorophyll as the pigment that captures the energy in sunlight.',
        },
        {
          'Student answer':
            'use its energy to make glucose from water and carbon dioxide. Oxygen is released.',
          'matched reference answer': 'convert carbon dioxide and water into glucose and oxygen',
          reason:
            'Explains how captured light energy supports glucose production and identifies oxygen as a product.',
        },
      ],
      wrong: [],
      unclear: [],
    },
  },
  {
    student_id: 1,
    question_id: 2,
    answer: {
      correct: [
        {
          'Student answer': 'replace old taps with low-flow fixtures',
          'matched reference answer': 'install water-efficient fixtures in homes',
          reason: 'Low-flow fixtures reduce water consumption when household taps are in use.',
        },
        {
          'Student answer': 'ask households to fix leaking pipes',
          'matched reference answer': 'encourage residents to repair leaks',
          reason: 'Repairing leaking pipes prevents water loss in households.',
        },
      ],
      wrong: [],
      unclear: [],
    },
  },
  {
    student_id: 2,
    question_id: 1,
    answer: {
      correct: [],
      wrong: [
        {
          'Student answer': 'Sunlight keeps plants warm so their roots can absorb oxygen.',
          'matched reference answer': 'Sunlight provides the energy that drives photosynthesis.',
          reason:
            'Photosynthesis is driven by light energy absorbed by chlorophyll. Warming the plant and oxygen uptake by roots do not explain that process.',
        },
      ],
      unclear: [],
    },
  },
  {
    student_id: 2,
    question_id: 2,
    answer: {
      correct: [
        {
          'Student answer': 'Charge households according to measured water use',
          'matched reference answer': 'use metering or conservation pricing',
          reason: 'Charging by metered use gives households an incentive to conserve water.',
        },
      ],
      wrong: [],
      unclear: [
        {
          'Student answer': 'provide rebates for efficient appliances',
          'matched reference answer': 'install water-efficient fixtures in homes',
          reason:
            'Rebates could support conservation. The answer leaves unclear whether the eligible appliances use less water.',
        },
      ],
    },
  },
]

export function loadDemo(): void {
  const examStore = useExamDataStore()
  const uploadStore = useUploadStatusStore()

  examStore.resetAllData()
  examStore.setQuestions(paper.questions.map((question) => ({ ...question })))
  examStore.setReferenceAnswers(referenceAnswers.answers.map((answer) => ({ ...answer })))
  examStore.setStudentAnswers(studentAnswers.map((answer) => ({ ...answer })))

  for (const sample of sampleResults) {
    const question = examStore.getQuestionById(sample.question_id)
    const reference = examStore.getReferenceAnswer(sample.question_id)
    const result = { ...sample, total_score: 0 }
    result.total_score = computeScoreFromReferences(result, {
      eachPoint: reference?.eachScoringPoint ?? 1,
      maxScore: question?.score,
    })
    examStore.addHighlightData(result)
  }

  uploadStore.resetAll()
  uploadStore.setPaperUploading('paper.json', JSON.stringify(paper, null, 2))
  uploadStore.setPaperReady({ questionCount: examStore.questionCount })
  uploadStore.setAnswerUploading(
    'reference_answers.json',
    JSON.stringify(referenceAnswers, null, 2),
  )
  uploadStore.setAnswerReady({ answerCount: examStore.referenceAnswerCount })
  uploadStore.setStudentUploading('student_answers.json', JSON.stringify(studentAnswers, null, 2))
  uploadStore.setStudentReady({
    studentCount: examStore.studentCount,
    answerCount: examStore.totalAnswerCount,
  })
  examStore.saveToLocal()
}
