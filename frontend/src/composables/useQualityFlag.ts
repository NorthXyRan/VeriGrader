import { useGradingStatistics } from '@/composables/useGradingStatistics'
import { gradingThresholds as T } from '@/config/gradingThresholds'
import { useExamDataStore } from '@/stores/useExamDataStore'
import { calcHighlightMissingRate, calcHighlightOverlapRate } from '@/utils/highlightMetrics'
import { computed } from 'vue'

export function useQualityFlag() {
  const store = useExamDataStore()
  const stats = useGradingStatistics()

  function qualityFlag(studentId: number, questionId: number) {
    return computed(() => {
      const h = store.getHighlightData(studentId, questionId)
      if (!h) return null

      if (store.isGoldPaper(studentId, questionId)) {
        return null
      }

      const urRate = stats.getUnclearRate(studentId, questionId)

      const stAns = store.getStudentAnswer(studentId, questionId)
      const content = stAns?.answer || ''

      const overlapRate = calcHighlightOverlapRate(content, h)
      const missingRate = calcHighlightMissingRate(content, h)

      if (overlapRate > T.overlapRed) return 'red'
      if (missingRate > T.missingRed) return 'red'
      if (urRate > T.unclearRedundantRed) return 'red'

      if (missingRate > T.missingYellow) return 'orange'
      if (urRate > T.unclearRedundantYellow) return 'orange'

      return null
    })
  }

  return { qualityFlag }
}
