import { computed, type Ref } from 'vue'

import { useExamDataStore } from '@/stores/useExamDataStore'

export function useCurrentGradingContext(studentId: Ref<number>, questionId: Ref<number>) {
  const store = useExamDataStore()

  const currentQuestion = computed(() => store.getQuestionById(questionId.value))
  const currentReferenceAnswer = computed(
    () =>
      store.getReferenceAnswer(questionId.value)?.answer ??
      'No reference answer is available. Check the uploaded data.',
  )
  const currentStudentAnswer = computed(
    () =>
      store.getStudentAnswer(studentId.value, questionId.value)?.answer ??
      'No student response is available for this question.',
  )
  const currentHighlightData = computed(() => {
    if (!studentId.value || !questionId.value) return null
    return store.getHighlightData(studentId.value, questionId.value) ?? null
  })

  const initializeIds = (): void => {
    const firstStudent = store.studentList[0]
    const firstQuestion = store.questions[0]
    if (firstStudent) studentId.value = firstStudent.id
    if (firstQuestion) questionId.value = firstQuestion.question_id
  }

  return {
    currentQuestion,
    currentReferenceAnswer,
    currentStudentAnswer,
    currentHighlightData,
    initializeIds,
  }
}
