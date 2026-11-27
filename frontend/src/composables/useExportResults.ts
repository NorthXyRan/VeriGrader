import { useExamDataStore } from '@/stores/useExamDataStore'
import { downloadJSON } from '@/utils/downloadUtils'
import { Message } from '@/components/Message'
import { ref } from 'vue'

export function useExportResults() {
  const examDataStore = useExamDataStore()
  const isExporting = ref(false)

  const transformToStandardFormat = () => {
    const sortedData = [...examDataStore.highlightDataList].sort((a, b) => {
      if (a.student_id !== b.student_id) {
        return a.student_id - b.student_id
      }
      return a.question_id - b.question_id
    })

    return sortedData.map((highlightData) => ({
      student_id: highlightData.student_id,
      question_id: highlightData.question_id,
      answer: {
        correct: highlightData.answer.correct.map((item) => ({
          'Student answer': item['Student answer'],
          'matched reference answer': item['matched reference answer'],
          reason: item.reason,
        })),
        wrong: highlightData.answer.wrong.map((item) => ({
          'Student answer': item['Student answer'],
          'matched reference answer': item['matched reference answer'],
          reason: item.reason,
        })),
        unclear: highlightData.answer.unclear.map((item) => ({
          'Student answer': item['Student answer'],
          'matched reference answer': item['matched reference answer'],
          reason: item.reason,
        })),
      },
      total_score: highlightData.total_score,
    }))
  }

  const exportResults = async () => {
    if (isExporting.value) return

    try {
      isExporting.value = true

      if (examDataStore.highlightDataList.length === 0) {
        Message.warning('No grading results to export')
        return
      }

      const exportMessageId = Message.info('Exporting results...', 0)

      const exportData = transformToStandardFormat()

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
      const filename = `result_${timestamp}.json`

      downloadJSON(exportData, filename)

      Message.close(exportMessageId)
      Message.success(`Successfully exported ${exportData.length} grading results`)
    } catch (error) {
      Message.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      isExporting.value = false
    }
  }

  const getExportStats = () => {
    const total = examDataStore.highlightDataList.length
    const students = new Set(examDataStore.highlightDataList.map((item) => item.student_id)).size
    const questions = new Set(examDataStore.highlightDataList.map((item) => item.question_id)).size

    return {
      totalResults: total,
      uniqueStudents: students,
      uniqueQuestions: questions,
    }
  }

  return {
    isExporting,
    exportResults,
    getExportStats,
    transformToStandardFormat,
  }
}
