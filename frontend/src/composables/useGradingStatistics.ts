import { computed } from 'vue'
import { useExamDataStore } from '@/stores/useExamDataStore'

export function useGradingStatistics() {
  const examDataStore = useExamDataStore()

  const getAllGrandingStats = computed(() => {
    return examDataStore.highlightDataList.map((h) => {
      const correct = h.answer?.correct?.length || 0
      const wrong = h.answer?.wrong?.length || 0
      const unclear = h.answer?.unclear?.length || 0

      const total = correct + wrong + unclear

      return {
        student_id: h.student_id,
        question_id: h.question_id,
        correct_count: correct,
        wrong_count: wrong,
        unclear_count: unclear,

        unclear_rate: total === 0 ? 0 : unclear / total,
      }
    })
  })

  const getUnclearRate = (studentId: number, questionId: number) => {
    const stat = getAllGrandingStats.value.find(
      (s) => s.student_id === studentId && s.question_id === questionId,
    )
    return stat ? stat.unclear_rate : 0
  }

  return {
    getAllGrandingStats,
    getUnclearRate,
  }
}
