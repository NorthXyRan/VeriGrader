<template>
  <div class="page-header">
    <div class="header-first-row">
      <div class="header-a1 has-legend">
        <div class="select-section">
          <h1>Select Question</h1>
          <div class="select-list">
            <button
              type="button"
              v-for="(question, index) in questions"
              :key="question.question_id"
              :class="['select-item', { active: currentQuestion === question.question_id }]"
              @click="handleQuestionChange(index + 1, question)"
              :title="`${question.question.substring(0, 50)}... (${question.score} points)`"
            >
              Question {{ index + 1 }}
            </button>
          </div>
        </div>

        <div class="select-section">
          <h1>Select Student</h1>
          <div class="select-list student-list">
            <button
              type="button"
              v-for="student in displayStudentList"
              :key="student.id"
              :class="[
                'select-item circle',
                {
                  active: currentStudentId === student.id,
                  graded: gradedPapers.includes(student.id),
                  golden: isStudentGolden(student.id),
                  confirmed: isStudentConfirmed(student.id),
                },
              ]"
              @click="handleStudentChange(student.id)"
              :title="`Student ID: ${student.id}${getStudentStatusText(student.id)}`"
            >
              {{ student.id }}

              <span v-if="dotMap[student.id]" :class="['quality-dot', dotMap[student.id]]" />
            </button>
          </div>
        </div>

        <div class="quality-legend">
          <div class="legend-item">
            <span class="legend-dot red-dot"></span>
            <span class="legend-text">High priority</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot orange-dot"></span>
            <span class="legend-text">Medium priority</span>
          </div>

          <div class="legend-item sort-toggle">
            <el-switch v-model="isSorted" size="small" :active-icon="Sort" :inactive-icon="Sort" />
            <span class="legend-text">{{ isSorted ? '✔️' : '✖️' }}</span>
          </div>
        </div>
      </div>

      <div class="header-a2">
        <ActionSection
          ref="actionSectionRef"
          :can-proceed="props.canProceed"
          :is-confirmed="props.isConfirmed"
          variant="inline"
          :current-student-id="props.currentStudentId"
          @start-grading="handleStartGrading"
          @batch-grading="handleBatchGrading"
          class="header-action-section"
        />
      </div>
    </div>

    <div class="statistics-overview">
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="stat-item">
            <span class="label">Marked/Total</span>
            <span class="value">{{ gradedCount }}/{{ totalStudents }}</span>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="stat-item clickable" @click="jumpToStudent(statistics.highestStudent)">
            <span class="label">Highest</span>
            <span class="value highlight-good">{{ statistics.highest }}</span>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="stat-item clickable" @click="jumpToStudent(statistics.lowestStudent)">
            <span class="label">Lowest</span>
            <span class="value highlight-poor">{{ statistics.lowest }}</span>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="stat-item">
            <span class="label">Average</span>
            <span class="value">{{ statistics.average }}</span>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@/components/Message'
import { useGradingStatistics } from '@/composables/useGradingStatistics'
import { useQualityFlag } from '@/composables/useQualityFlag'
import { useExamDataStore } from '@/stores/useExamDataStore'
import type { HighlightData, Question } from '@/types/exam'
import { calcHighlightMissingRate, calcHighlightOverlapRate } from '@/utils/highlightMetrics'
import { Sort } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import ActionSection from './ActionSection.vue'

interface Props {
  currentQuestion: number
  currentStudentId: number
  questions: Question[]
  studentList: Array<{ id: number }>
  highlightDataList: HighlightData[]

  canProceed?: boolean
  isConfirmed?: boolean
}

const props = defineProps<Props>()

const actionSectionRef = ref()

const isSorted = ref(false)

const stats = useGradingStatistics()

const displayStudentList = computed(() => {
  if (!isSorted.value) return [...props.studentList]

  const list = [...props.studentList]

  return list.sort((a, b) => {
    const goldA = isStudentGolden(a.id)
    const goldB = isStudentGolden(b.id)
    if (goldA && goldB) return a.id - b.id
    if (goldA) return -1
    if (goldB) return 1

    const colorRank = (color: 'red' | 'orange' | null) => {
      if (color === 'red') return 0
      if (color === 'orange') return 1
      return 2
    }

    const colorA = dotMap.value[a.id]
    const colorB = dotMap.value[b.id]

    const rankA = colorRank(colorA)
    const rankB = colorRank(colorB)

    if (rankA !== rankB) return rankA - rankB

    if (rankA === 0) {
      const hA = examStore.getHighlightData(a.id, props.currentQuestion)
      const hB = examStore.getHighlightData(b.id, props.currentQuestion)
      const cA = examStore.getStudentAnswer(a.id, props.currentQuestion)?.answer || ''
      const cB = examStore.getStudentAnswer(b.id, props.currentQuestion)?.answer || ''
      const overlapA = hA ? calcHighlightOverlapRate(cA, hA) : 0
      const overlapB = hB ? calcHighlightOverlapRate(cB, hB) : 0
      if (overlapA !== overlapB) return overlapB - overlapA

      const urA = stats.getUnclearRate(a.id, props.currentQuestion)
      const urB = stats.getUnclearRate(b.id, props.currentQuestion)
      const missA = hA ? calcHighlightMissingRate(cA, hA) : 1
      const missB = hB ? calcHighlightMissingRate(cB, hB) : 1
      const avgA = (urA + missA) / 2
      const avgB = (urB + missB) / 2
      if (avgA !== avgB) return avgB - avgA
    } else if (rankA === 1) {
      const urA = stats.getUnclearRate(a.id, props.currentQuestion)
      const urB = stats.getUnclearRate(b.id, props.currentQuestion)
      if (urA !== urB) return urB - urA
    } else {
      const hA = examStore.getHighlightData(a.id, props.currentQuestion)
      const hB = examStore.getHighlightData(b.id, props.currentQuestion)
      const cA = examStore.getStudentAnswer(a.id, props.currentQuestion)?.answer || ''
      const cB = examStore.getStudentAnswer(b.id, props.currentQuestion)?.answer || ''
      const missA = hA ? calcHighlightMissingRate(cA, hA) : 1
      const missB = hB ? calcHighlightMissingRate(cB, hB) : 1
      if (missA !== missB) return missB - missA
    }

    return a.id - b.id
  })
})

const totalStudents = computed(() => props.studentList.length)

const gradedPapers = computed(() => {
  return props.highlightDataList
    .filter((data) => data.question_id === props.currentQuestion)
    .map((data) => data.student_id)
})

const gradedCount = computed(() => gradedPapers.value.length)

const statistics = computed(() => {
  const currentQuestionScores = props.highlightDataList
    .filter((data) => data.question_id === props.currentQuestion)
    .map((data) => ({ studentId: data.student_id, score: data.total_score }))

  if (currentQuestionScores.length === 0) {
    return {
      highest: 0,
      lowest: 0,
      average: 0,
      highestStudent: { id: undefined },
      lowestStudent: { id: undefined },
    }
  }

  const scores = currentQuestionScores.map((item) => item.score)
  const highest = Math.max(...scores)
  const lowest = Math.min(...scores)
  const average =
    Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10

  const highestStudent = currentQuestionScores.find((item) => item.score === highest)
  const lowestStudent = currentQuestionScores.find((item) => item.score === lowest)

  return {
    highest,
    lowest,
    average,
    highestStudent: { id: highestStudent?.studentId },
    lowestStudent: { id: lowestStudent?.studentId },
  }
})

const emits = defineEmits<{
  (e: 'questionChange', question: { id: number; name: string; score: number }): void
  (e: 'studentChange', studentId: number): void
  (e: 'startGrading'): void
  (e: 'batchGrading', mode: 'overlap' | 'missing' | 'red' | 'orange' | 'color' | 'all'): void
}>()

const handleStudentChange = (studentId: number) => {
  if (!studentId) {
    Message.warning('Invalid student ID')
    return
  }
  emits('studentChange', studentId)
}

const handleQuestionChange = (questionIndex: number, question: Question) => {
  emits('questionChange', {
    id: question.question_id,
    name: `Question ${questionIndex}`,
    score: question.score,
  })
}

const jumpToStudent = (student: { id?: number } | undefined) => {
  if (!student?.id) {
    Message.warning('Student information not found')
    return
  }
  handleStudentChange(student.id)
}

const handleStartGrading = () => {
  emits('startGrading')
}

const handleBatchGrading = (mode: 'overlap' | 'missing' | 'red' | 'orange' | 'color' | 'all') => {
  emits('batchGrading', mode)
}

const resetGradingState = (studentId?: number) => {
  if (actionSectionRef.value) {
    actionSectionRef.value.resetGradingState(studentId)
  }
}

const resetBatchGradingState = () => {
  if (actionSectionRef.value) {
    actionSectionRef.value.resetBatchGradingState()
  }
}

const setBatchGradingState = (state: boolean) => {
  if (actionSectionRef.value) {
    actionSectionRef.value.setBatchGradingState(state)
  }
}

const isStudentGolden = (studentId: number): boolean => {
  const highlightData = props.highlightDataList.find(
    (data) => data.student_id === studentId && data.question_id === props.currentQuestion,
  )

  return highlightData?.isGold === true
}

const isStudentConfirmed = (studentId: number): boolean => {
  const highlightData = props.highlightDataList.find(
    (data) => data.student_id === studentId && data.question_id === props.currentQuestion,
  )
  return highlightData?.isConfirmed === true
}

const getStudentStatusText = (studentId: number): string => {
  if (isStudentGolden(studentId)) {
    return ' (gold standard)'
  } else if (isStudentConfirmed(studentId)) {
    return ' (confirmed)'
  } else if (gradedPapers.value.includes(studentId)) {
    return ' (graded)'
  } else {
    return ' (not graded)'
  }
}

const { qualityFlag } = useQualityFlag()
const examStore = useExamDataStore()

const dotMap = computed<Record<number, 'red' | 'orange' | null>>(() => {
  const map: Record<number, 'red' | 'orange' | null> = {}
  props.studentList.forEach((stu) => {
    map[stu.id] = qualityFlag(stu.id, props.currentQuestion).value
  })
  return map
})

defineExpose({
  resetGradingState,
  resetBatchGradingState,
  setBatchGradingState,
})
</script>

<style scoped>
.page-header {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: none;
  padding: 12px 20px;
  border-radius: 24px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-first-row {
  display: flex;
  gap: 16px;
  width: 100%;
  position: relative;
  overflow: visible;
}

.header-a1 {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(240, 240, 240, 0.8);
  border-radius: 20px;
  padding: 16px 20px;
  min-width: 0;
  position: relative;
  overflow: hidden;
}

.header-a1.has-legend {
  padding-right: 240px;
}

.header-a2 {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: rgba(240, 240, 240, 0.8);
  border-radius: 20px;
  padding: 16px;
  overflow: visible;
}

.select-section {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 40px;
  min-width: 0;
  overflow: hidden;
}

.select-section h1 {
  margin: 0;
  color: rgba(0, 0, 0, 0.87);
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  min-width: 120px;
}

.select-list {
  display: flex;
  gap: 12px;
  padding: 4px;
  padding-bottom: 8px;
  overflow-x: auto;
  flex: 1;
  min-width: 0;
  max-width: 100%;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.03);
  min-height: 60px;
}

.select-list::-webkit-scrollbar {
  height: 6px;
}

.select-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 3px;
  margin: 0 4px;
}

.select-list::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.select-item {
  padding: 10px 16px;
  background-color: #f5f5f5;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  flex-shrink: 0;
  border: 1px solid transparent;
  user-select: none;
  font: inherit;
}

.select-item:hover {
  background-color: #e5e5e5;
  transform: translateY(-1px);
}

.select-item.active {
  background-color: #007aff !important;
  color: #ffffff !important;
  border-color: #007aff !important;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3) !important;
}

.select-item.circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  padding: 0;
  position: relative;
}

.select-item.graded {
  background-color: #4cd964;
  color: #ffffff;
  border-color: #4cd964;
}

.select-item.graded:hover {
  background-color: #3ac85a;
}

.select-item.golden {
  background-color: #ffd700 !important;
  color: #000000 !important;
  border-color: #ffd700 !important;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3) !important;
}

.select-item.golden:hover {
  background-color: #ffcc00 !important;
  box-shadow: 0 3px 12px rgba(255, 215, 0, 0.4) !important;
}

.select-item.confirmed {
  background-color: #4cd964;
  color: #ffffff;
  border-color: #4cd964;
  box-shadow: 0 0 0 3px rgb(0, 115, 255);
}

.select-item.confirmed:hover {
  background-color: #3ac85a;
  box-shadow: 0 0 0 3px rgb(0, 115, 255);
}

.select-item.active.graded,
.select-item.active.golden,
.select-item.active.confirmed,
.select-item.active {
  background-color: #007aff !important;
  color: #ffffff !important;
  border-color: #007aff !important;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.4) !important;
}

.statistics-overview {
  width: 100%;

  margin-top: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(248, 249, 250, 0.9);
  border-radius: 24px;
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 4px 16px rgba(0, 0, 0, 0.03);
}

.stat-item.clickable {
  cursor: pointer;
}

.stat-item.clickable:hover {
  background: rgba(245, 246, 247, 0.95);
  transform: translateY(-2px) scale(1.02);
  border-color: rgba(0, 122, 255, 0.3);
  box-shadow:
    0 4px 12px rgba(0, 122, 255, 0.15),
    0 8px 32px rgba(0, 0, 0, 0.1);
}

.stat-item .label {
  display: flex;
  align-items: center;
  color: rgba(0, 0, 0, 0.65);
  font-size: 16px;
  font-weight: 600;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: -0.01em;
  margin: 0;
}

.stat-item .value {
  display: flex;
  align-items: center;
  color: #007aff;
  font-size: 20px;
  font-weight: 700;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: -0.02em;
}

.value.highlight-good {
  color: #4cd964;
}

.value.highlight-poor {
  color: #ff3b30;
}

.value.icon-value {
  font-size: 18px;
}

.quality-legend {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 10;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.6);
  min-width: 0;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot.red-dot {
  background: linear-gradient(135deg, #ff4757 0%, #ff3838 100%);
}

.legend-dot.orange-dot {
  background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%);
}

.legend-text {
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-item.sort-toggle {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background-color: #f0f0f0;
  border-radius: 24px;
  border: 1px solid #e0e0e0;
}

.legend-item.sort-toggle .el-switch {
  margin-right: 8px;
}

.header-action-section {
  height: 100%;
}

.header-action-section :deep(.buttons-container) {
  padding: 0 20px;
  gap: 12px;
  justify-content: center;
}

.header-action-section :deep(.inline-buttons) {
  justify-content: center;
  gap: 16px;
  width: 100%;
}

.header-action-section :deep(.dock-btn) {
  min-width: 80px;
  font-size: 13px;
  padding: 8px 16px;
  margin: 0;
}

.header-action-section :deep(.button-item:hover) {
  transform: scale(1.05);
}

.header-action-section :deep(.scroll-arrow) {
  display: none;
}

.quality-dot {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.quality-dot.red {
  background: linear-gradient(135deg, #ff4757 0%, #ff3838 100%);
}

.quality-dot.orange {
  background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%);
}

.select-item.active .quality-dot {
  border: 2px solid #ffffff !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3) !important;
}

.student-list {
  padding-right: 0;

  padding-bottom: 10px;
}

@media (min-width: 2560px) {
  .select-list {
    padding-bottom: 12px;
  }

  .select-list::-webkit-scrollbar {
    height: 8px;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 16px 24px;
    gap: 12px;
  }

  .header-first-row {
    flex-direction: column;
    gap: 16px;
  }

  .header-a1 {
    flex-direction: column;
  }

  .quality-legend {
    width: 100%;
    min-width: unset;
    flex-direction: row;
    justify-content: space-between;
    padding: 8px 12px;
  }

  .select-section {
    gap: 16px;
  }

  .select-section h1 {
    min-width: 80px;
    font-size: 16px;
  }

  .stat-item {
    padding: 12px 14px;
  }

  .stat-item .label {
    font-size: 13px;
  }

  .stat-item .value {
    font-size: 16px;
  }

  .statistics-overview :deep(.el-col) {
    margin-bottom: 8px;
  }

  .statistics-overview {
    margin-top: 16px;
  }

  .action-group {
    gap: 8px;
  }

  .action-btn {
    padding: 8px 16px;
    font-size: 12px;
    min-height: 36px;
    min-width: 80px;
  }

  .legend-item {
    font-size: 12px;
  }

  .legend-dot {
    width: 6px;
    height: 6px;
  }
}

@media (max-width: 1440px) {
  .legend-item.sort-toggle .legend-text {
    display: none;
  }
}

@media (max-width: 1200px) {
  .header-first-row {
    flex-direction: column;
  }

  .header-a1,
  .header-a2 {
    width: 100%;
  }
}

:global(.main-content--compact .header-first-row),
:global(.main-content--narrow .header-first-row) {
  flex-direction: column;
}

:global(.main-content--compact .header-a1),
:global(.main-content--compact .header-a2),
:global(.main-content--narrow .header-a1),
:global(.main-content--narrow .header-a2) {
  width: 100%;
}

:global(.main-content--narrow .header-a1.has-legend) {
  padding-right: 20px;
}

:global(.main-content--narrow .quality-legend) {
  position: static;
  width: 100%;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
}

:global(.main-content--narrow .select-section) {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

:global(.main-content--narrow .select-section h1) {
  min-width: 0;
}

:global(.main-content--narrow .statistics-overview .el-row) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

:global(.main-content--narrow .statistics-overview .el-col) {
  width: auto;
  max-width: none;
  padding: 0 !important;
  flex: none;
}
</style>
