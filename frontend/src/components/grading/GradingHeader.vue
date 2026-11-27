<template>
  <div class="page-header" :class="`page-header--${layout}`">
    <div class="header-blocks">
      <section class="header-block selector-block">
        <div class="selectors">
          <div class="select-section select-section--question">
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

          <div class="select-section select-section--student">
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
            <el-switch
              v-model="isSorted"
              size="small"
              :active-icon="Sort"
              :inactive-icon="Sort"
              aria-label="Sort students by priority"
            />
            <span class="legend-text">Sort by priority</span>
          </div>
        </div>
      </section>

      <section class="header-block action-block" aria-label="Grading actions">
        <h1 v-if="!isPagesDemo" class="block-label">Grade</h1>
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
      </section>
    </div>

    <div class="statistics-overview">
      <div class="stat-item">
        <span class="label">Marked/Total</span>
        <span class="value">{{ gradedCount }}/{{ totalStudents }}</span>
      </div>

      <button
        type="button"
        class="stat-item clickable"
        @click="jumpToStudent(statistics.highestStudent)"
      >
        <span class="label">Highest</span>
        <span class="value highlight-good">{{ statistics.highest }}</span>
      </button>

      <button
        type="button"
        class="stat-item clickable"
        @click="jumpToStudent(statistics.lowestStudent)"
      >
        <span class="label">Lowest</span>
        <span class="value highlight-poor">{{ statistics.lowest }}</span>
      </button>

      <div class="stat-item">
        <span class="label">Average</span>
        <span class="value">{{ statistics.average }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@/components/Message'
import { useContentLayout } from '@/composables/useContentLayout'
import { useGradingStatistics } from '@/composables/useGradingStatistics'
import { useQualityFlag } from '@/composables/useQualityFlag'
import { isPagesDemo } from '@/config/deployment'
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
const layout = useContentLayout()

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
/* Outer card holding two blocks (selectors, grading actions) above a row of stat tiles. */
.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
}

.header-blocks {
  display: flex;
  align-items: stretch;
  gap: 12px;
}

.header-block {
  min-width: 0;
  padding: 14px 16px;
  background: linear-gradient(180deg, #f5f6f8 0%, #f1f2f5 100%);
  border: 1px solid rgba(15, 23, 42, 0.05);
  border-radius: var(--radius-lg);
}

.selector-block {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  gap: 16px;
}

.selectors {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.action-block {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.block-label,
.select-section h1 {
  margin: 0;
  color: rgba(0, 0, 0, 0.78);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.select-section {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.select-section h1 {
  flex: 0 0 98px;
}

.select-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  min-width: 0;
  padding: 3px;
}

.select-item {
  flex-shrink: 0;
  min-height: 32px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  background-color: #f1f2f4;
  color: rgba(0, 0, 0, 0.62);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  user-select: none;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.select-item:hover {
  background-color: #e5e6e9;
  transform: translateY(-1px);
}

.select-item:focus-visible {
  outline: 2px solid #007aff;
  outline-offset: 2px;
}

.select-item.active {
  background-color: #007aff !important;
  color: #ffffff !important;
  border-color: #007aff !important;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.25) !important;
}

.select-item.circle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  min-height: 0;
  padding: 0;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
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
}

.select-item.confirmed {
  background-color: #4cd964;
  color: #ffffff;
  border-color: #4cd964;
  box-shadow: 0 0 0 3px rgb(0, 115, 255);
}

.select-item.confirmed:hover {
  background-color: #3ac85a;
}

.select-item.active.graded,
.select-item.active.golden,
.select-item.active.confirmed,
.select-item.active {
  background-color: #007aff !important;
  color: #ffffff !important;
  border-color: #007aff !important;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.3) !important;
}

.quality-dot {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1.5px solid #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.quality-dot.red {
  background: linear-gradient(135deg, #ff4757 0%, #ff3838 100%);
}

.quality-dot.orange {
  background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%);
}

/* Inside the grey blocks, idle chips are white so they read as buttons. */
.select-item:not(.active):not(.graded):not(.golden):not(.confirmed) {
  background-color: #ffffff;
  border-color: rgba(15, 23, 42, 0.08);
}

.select-item:not(.active):not(.graded):not(.golden):not(.confirmed):hover {
  background-color: #f7f8fa;
  border-color: rgba(15, 23, 42, 0.16);
}

/* Priority legend: a small white card inside the selector block. */
.quality-legend {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 7px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: var(--radius-md);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: rgba(0, 0, 0, 0.62);
  font-size: 12px;
}

.legend-dot {
  flex-shrink: 0;
  width: 9px;
  height: 9px;
  margin-inline: 2px;
  border-radius: 50%;
}

.legend-dot.red-dot {
  background: linear-gradient(135deg, #ff4757 0%, #ff3838 100%);
}

.legend-dot.orange-dot {
  background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%);
}

.legend-text {
  font-weight: 500;
  white-space: nowrap;
}

.legend-item.sort-toggle {
  gap: 8px;
  margin-top: 2px;
  padding-top: 8px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

/* Stat tiles */
.statistics-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  min-height: 46px;
  padding: 8px 18px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: var(--radius-md);
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  color: inherit;
  font: inherit;
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.stat-item.clickable {
  cursor: pointer;
}

.stat-item.clickable:hover {
  border-color: rgba(0, 122, 255, 0.3);
  box-shadow: 0 6px 16px rgba(0, 122, 255, 0.12);
  transform: translateY(-1px);
}

.stat-item.clickable:focus-visible {
  outline: 2px solid #007aff;
  outline-offset: 2px;
}

.stat-item .label {
  overflow: hidden;
  color: rgba(0, 0, 0, 0.58);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-item .value {
  flex-shrink: 0;
  color: #007aff;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.value.highlight-good {
  color: #2fb84f;
}

.value.highlight-poor {
  color: #ff3b30;
}

/* Compact: the action block becomes a full-width strip under the selectors. */
.page-header--compact .header-blocks,
.page-header--narrow .header-blocks {
  flex-direction: column;
}

.page-header--compact .action-block {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-block: 10px;
}

.page-header--compact .action-block .header-action-section {
  width: auto;
}

/* Narrow: one column, labels above their chips, legend as a row, touch-sized targets. */
.page-header--narrow {
  gap: 10px;
  padding: 10px;
}

.page-header--narrow .header-block {
  padding: 14px;
}

.page-header--narrow .selector-block {
  flex-direction: column;
  align-items: stretch;
  gap: 14px;
}

.page-header--narrow .selectors {
  gap: 14px;
}

.page-header--narrow .select-section {
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
}

.page-header--narrow .select-section h1,
.page-header--narrow .block-label {
  flex-basis: auto;
  color: rgba(0, 0, 0, 0.55);
  font-size: 12px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Every question stays visible: four across on tablets, a balanced 2 x 2 on phones. */
.page-header--narrow .select-section--question .select-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 8px;
}

.page-header--narrow .select-item {
  min-height: 40px;
  font-size: 14px;
}

.page-header--narrow .select-item.circle {
  width: 40px;
  height: 40px;
  font-size: 14px;
}

.page-header--narrow .student-list {
  gap: 8px;
}

.page-header--narrow .quality-legend {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
}

.page-header--narrow .legend-item.sort-toggle {
  margin: 0 0 0 auto;
  padding: 0;
  border: 0;
}

.page-header--narrow .action-block {
  gap: 8px;
}

.page-header--narrow .statistics-overview {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

/* Label above value so neither has to be truncated in a half-width tile. */
.page-header--narrow .stat-item {
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  padding: 10px 14px;
}

.page-header--narrow .stat-item .label {
  font-size: 12px;
}

.page-header--narrow .stat-item .value {
  font-size: 20px;
}
</style>
