import { useExamDataStore } from '@/stores/useExamDataStore'
import { useUploadStatusStore } from '@/stores/useUploadStatusStore'

import { demoCases as cases } from './cases'
import { getDemoGradingResult, renderResponse } from './gradingResults'

export function loadDemo(): void {
  const examStore = useExamDataStore()
  const uploadStore = useUploadStatusStore()
  const questions = cases.map(({ question }) => ({ ...question }))
  const referenceAnswers = cases.map(({ question, rubric, pointsPerCriterion }) => ({
    question_id: question.question_id,
    answer: rubric.join('\n\n'),
    eachScoringPoint: pointsPerCriterion,
  }))
  const studentAnswers = cases.flatMap(({ question, responses }) =>
    responses.map((response) => ({
      student_id: response.studentId,
      question_id: question.question_id,
      answer: renderResponse(response),
    })),
  )

  examStore.resetAllData()
  examStore.setQuestions(questions)
  examStore.setReferenceAnswers(referenceAnswers)
  examStore.setStudentAnswers(studentAnswers)

  for (const { student_id, question_id } of studentAnswers) {
    const result = getDemoGradingResult(student_id, question_id, { initialPass: true })
    if (result) examStore.addHighlightData(result)
  }

  uploadStore.resetAll()
  uploadStore.setPaperUploading('paper.json', JSON.stringify({ questions }, null, 2))
  uploadStore.setPaperReady({ questionCount: examStore.questionCount })
  uploadStore.setAnswerUploading(
    'reference_answers.json',
    JSON.stringify({ answers: referenceAnswers }, null, 2),
  )
  uploadStore.setAnswerReady({ answerCount: examStore.referenceAnswerCount })
  uploadStore.setStudentUploading('student_answers.json', JSON.stringify(studentAnswers, null, 2))
  uploadStore.setStudentReady({
    studentCount: examStore.studentCount,
    answerCount: examStore.totalAnswerCount,
  })
  examStore.saveToLocal()
}
