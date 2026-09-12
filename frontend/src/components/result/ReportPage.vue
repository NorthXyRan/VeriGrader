<template>
  <div class="page-container">
    <div class="base-card base-card--rounded-large report-main-card">
      <div class="card-header report-header">
        <div class="header-content">
          <div class="header-left">
            <h3>Exam Report</h3>
          </div>

          <div class="header-actions">
            <button
              class="export-btn"
              :disabled="totalGradedResults === 0 || isExporting"
              @click="exportResults"
              aria-label="Export results to JSON"
            >
              {{ isExporting ? 'EXPORTING...' : 'EXPORT RESULTS' }}
            </button>
          </div>
        </div>
      </div>

      <div class="card-content report-content">
        <section class="report-section question-selector">
          <div class="section-header">
            <h4 class="section-title">Question Selection</h4>
          </div>
          <div class="question-tabs">
            <button
              v-for="question in questionList"
              :key="question.id"
              class="question-tab"
              :class="{ 'question-tab--active': currentQuestionId === question.id }"
              @click="selectQuestion(question.id)"
            >
              <span class="tab-title">{{ question.name }}</span>
              <span class="tab-meta"
                >{{ question.score }}pts • {{ getGradedCount(question.id) }}/{{
                  totalStudents
                }}</span
              >
            </button>
          </div>
        </section>

        <section class="report-section question-details" v-if="currentQuestion">
          <div class="section-header">
            <h4 class="section-title">
              {{ currentQuestion.name }} Details - {{ currentQuestion.score }}pts
            </h4>
          </div>
          <div class="question-simple-card">
            <p class="question-content">{{ currentQuestion.content }}</p>
          </div>
        </section>

        <section class="report-section statistics-overview">
          <div class="section-header">
            <h4 class="section-title">Statistics Overview</h4>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.average }}</div>
              <div class="stat-label">Average</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ statistics.highest }}</div>
              <div class="stat-label">Highest</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ statistics.lowest }}</div>
              <div class="stat-label">Lowest</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ statistics.median }}</div>
              <div class="stat-label">Median</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ statistics.passRate }}%</div>
              <div class="stat-label">Pass Rate</div>
            </div>
          </div>
        </section>

        <section class="report-section score-distribution">
          <div class="section-header">
            <h4 class="section-title">Score Distribution</h4>
            <div class="filter-indicator" v-if="selectedScoreRange">
              <span class="filter-text">Filtered: {{ selectedScoreRange }}</span>
              <button class="filter-clear-btn" @click="clearScoreFilter" aria-label="Clear filter">
                ×
              </button>
            </div>
          </div>
          <div class="distribution-chart">
            <div class="chart-container">
              <div
                v-for="segment in scoreSegments"
                :key="segment.range"
                class="chart-segment"
                :class="{ 'chart-segment--selected': selectedScoreRange === segment.range }"
                @click="selectScoreRange(segment.range)"
                :aria-label="`${segment.range}: ${segment.count} students`"
              >
                <div class="chart-bar-container">
                  <div
                    class="chart-bar"
                    :style="{ height: `${Math.min((segment.count / maxCount) * 100, 100)}px` }"
                  >
                    <div class="bar-count" v-if="segment.count > 0">{{ segment.count }}</div>
                  </div>
                </div>
                <div class="bar-label">
                  <div class="bar-range">{{ segment.range }}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="report-section questions-overview" v-if="currentQuestionId === 0">
          <div class="section-header">
            <h4 class="section-title">Questions Overview</h4>
          </div>
          <div class="questions-grid">
            <div
              v-for="question in questionStats"
              :key="question.id"
              class="question-overview-card"
              @click="selectQuestion(question.id)"
              role="button"
              :aria-label="`View details for ${question.name}`"
            >
              <div class="question-overview-header">
                <span class="question-name">{{ question.name }}</span>
                <span class="question-score"
                  >{{ question.averageScore }}/{{ question.maxScore }}</span
                >
              </div>
              <div class="progress-container">
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    :style="{ width: `${question.scoreRate}%` }"
                    :class="getProgressColorClass(question.scoreRate)"
                  ></div>
                </div>
                <span class="progress-percentage">{{ question.scoreRate }}%</span>
              </div>
              <div class="question-stats-footer">
                <span class="graded-count">{{ question.gradedCount }} students graded</span>
              </div>
            </div>
          </div>
        </section>

        <section class="report-section student-scores" v-if="currentQuestionId > 0">
          <div class="section-header">
            <h4 class="section-title">Student Performance</h4>
            <span class="student-count">{{ filteredStudentScores.length }} students</span>
          </div>
          <div class="scores-table-container">
            <div class="scores-table">
              <div class="table-header" role="row">
                <div class="header-cell" role="columnheader">Student</div>
                <div class="header-cell" role="columnheader">Score</div>
                <div class="header-cell" role="columnheader">Percentage</div>
                <div class="header-cell" role="columnheader">Status</div>
                <div class="header-cell" role="columnheader">Actions</div>
              </div>

              <div class="table-body">
                <div
                  v-for="score in filteredStudentScores"
                  :key="score.studentId"
                  class="table-row"
                  :class="getScoreRowClass(score.scoreRate)"
                  role="row"
                >
                  <div class="table-cell" role="cell">
                    <span class="student-id">Student {{ score.studentId }}</span>
                  </div>
                  <div class="table-cell" role="cell">
                    <div class="score-display">
                      <span class="score-value">{{ score.score }}</span>
                      <span class="score-separator">/</span>
                      <span class="score-total">{{ currentQuestion?.score || 0 }}</span>
                    </div>
                  </div>
                  <div class="table-cell" role="cell">
                    <span class="percentage">{{ score.scoreRate }}%</span>
                  </div>
                  <div class="table-cell" role="cell">
                    <span class="status-badge" :class="getStatusBadgeClass(score.scoreRate)">
                      {{ score.scoreRate >= 60 ? 'Pass' : 'Fail' }}
                    </span>
                  </div>
                  <div class="table-cell" role="cell">
                    <button
                      class="action-btn action-btn--primary"
                      @click="viewStudentPaper(score.studentId)"
                      :aria-label="`View paper for Student ${score.studentId}`"
                    >
                      View Paper
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div
      v-if="paperDialogVisible"
      class="custom-dialog-overlay"
      @click="paperDialogVisible = false"
    >
      <div class="custom-paper-dialog-content" @click.stop>
        <div class="paper-dialog-header">
          <h3>Student {{ selectedStudentId }}'s Paper</h3>
          <button @click="paperDialogVisible = false" class="paper-close-btn">✕</button>
        </div>

        <div class="paper-dialog-body">
          <PaperViewer
            v-if="paperDialogVisible && selectedStudentId"
            :student-id="selectedStudentId"
            :question-id="currentQuestionId > 0 ? currentQuestionId : undefined"
            :exam-title="currentQuestionId === 0 ? 'Complete Paper' : currentQuestion?.name"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useExportResults } from '@/composables/useExportResults'
import { useExamDataStore } from '@/stores/useExamDataStore'
import { getScoreBand, SCORE_BANDS } from '@/utils/scoreBands'
import PaperViewer from './PaperViewer.vue'

const examDataStore = useExamDataStore()

const { isExporting, exportResults } = useExportResults()

const currentQuestionId = ref(0)

const selectedScoreRange = ref<string>('')

const paperDialogVisible = ref(false)
const selectedStudentId = ref<number | null>(null)

const questionList = computed(() => {
  const questions = examDataStore.questions.map((q) => ({
    id: q.question_id,
    name: `Question ${q.question_id}`,
    score: q.score,
    content: q.question,
  }))

  return [
    {
      id: 0,
      name: 'All Questions',
      score: questions.reduce((sum, q) => sum + q.score, 0),
      content: 'View comprehensive statistics for all questions',
    },
    ...questions,
  ]
})

const currentQuestion = computed(() => {
  if (currentQuestionId.value === 0) return null
  return questionList.value.find((q) => q.id === currentQuestionId.value)
})

const totalStudents = computed(() => examDataStore.studentCount)

const totalGradedResults = computed(() => examDataStore.highlightDataList.length)

const getGradedCount = (questionId: number): number => {
  if (questionId === 0) {
    const gradedStudents = new Set()
    examDataStore.highlightDataList.forEach((data) => {
      gradedStudents.add(data.student_id)
    })
    return gradedStudents.size
  }
  return examDataStore.highlightDataList.filter((data) => data.question_id === questionId).length
}

const currentGradedCount = computed(() => getGradedCount(currentQuestionId.value))

const currentQuestionScores = computed(() => {
  if (currentQuestionId.value === 0) {
    const studentTotalScores = new Map<number, number>()
    const maxTotalScore = examDataStore.questions.reduce((sum, q) => sum + q.score, 0)

    examDataStore.highlightDataList.forEach((data) => {
      const current = studentTotalScores.get(data.student_id) || 0
      studentTotalScores.set(data.student_id, current + data.total_score)
    })

    return Array.from(studentTotalScores.entries()).map(([studentId, score]) => ({
      studentId,
      score,
      maxScore: maxTotalScore,
    }))
  } else {
    const question = examDataStore.getQuestionById(currentQuestionId.value)
    const maxScore = question?.score || 0

    return examDataStore.highlightDataList
      .filter((data) => data.question_id === currentQuestionId.value)
      .map((data) => ({
        studentId: data.student_id,
        score: data.total_score,
        maxScore,
      }))
  }
})

const statistics = computed(() => {
  const scores = currentQuestionScores.value
  if (scores.length === 0) {
    return { average: 0, highest: 0, lowest: 0, median: 0, passRate: 0 }
  }

  const scoreValues = scores.map((s) => s.score)
  const maxScore = scores[0]?.maxScore || 1

  const highest = Math.max(...scoreValues)
  const lowest = Math.min(...scoreValues)
  const average =
    Math.round((scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length) * 10) / 10

  const sortedScores = [...scoreValues].sort((a, b) => a - b)
  const median =
    sortedScores.length % 2 === 0
      ? Math.round(
          ((sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) /
            2) *
            10,
        ) / 10
      : sortedScores[Math.floor(sortedScores.length / 2)]

  const passCount = scoreValues.filter((score) => score / maxScore >= 0.6).length
  const passRate = Math.round((passCount / scoreValues.length) * 100)

  return { average, highest, lowest, median, passRate }
})

const scoreSegments = computed(() => {
  const scores = currentQuestionScores.value
  if (scores.length === 0) return []

  const maxScore = scores[0]?.maxScore || 1
  const counts = new Map(SCORE_BANDS.map((band) => [band.range, 0]))

  scores.forEach(({ score }) => {
    const range = getScoreBand(score / maxScore).range
    counts.set(range, (counts.get(range) ?? 0) + 1)
  })

  return SCORE_BANDS.map((band) => ({ ...band, count: counts.get(band.range) ?? 0 }))
})

const maxCount = computed(() => {
  if (scoreSegments.value.length === 0) return 1
  return Math.max(...scoreSegments.value.map((segment) => segment.count)) || 1
})

const questionStats = computed(() => {
  return examDataStore.questions.map((question) => {
    const questionScores = examDataStore.highlightDataList
      .filter((data) => data.question_id === question.question_id)
      .map((data) => data.total_score)

    if (questionScores.length === 0) {
      return {
        id: question.question_id,
        name: `Question ${question.question_id}`,
        averageScore: 0,
        maxScore: question.score,
        scoreRate: 0,
        gradedCount: 0,
      }
    }

    const averageScore =
      Math.round(
        (questionScores.reduce((sum, score) => sum + score, 0) / questionScores.length) * 10,
      ) / 10
    const scoreRate = Math.round((averageScore / question.score) * 100)

    return {
      id: question.question_id,
      name: `Question ${question.question_id}`,
      averageScore,
      maxScore: question.score,
      scoreRate,
      gradedCount: questionScores.length,
    }
  })
})

const studentScores = computed(() => {
  if (currentQuestionId.value === 0) return []

  return currentQuestionScores.value
    .map(({ studentId, score, maxScore }) => ({
      studentId,
      score,
      scoreRate: Math.round((score / maxScore) * 100),
    }))
    .sort((a, b) => b.score - a.score)
})

const filteredStudentScores = computed(() => {
  if (!selectedScoreRange.value) return studentScores.value

  return studentScores.value.filter(
    (student) => getScoreBand(student.scoreRate / 100).range === selectedScoreRange.value,
  )
})

const getProgressColorClass = (scoreRate: number): string => {
  if (scoreRate >= 90) return 'progress-fill--excellent'
  if (scoreRate >= 80) return 'progress-fill--good'
  if (scoreRate >= 60) return 'progress-fill--pass'
  return 'progress-fill--fail'
}

const getScoreRowClass = (scoreRate: number): string => {
  if (scoreRate === 100) return 'table-row--excellent'
  if (scoreRate < 60) return 'table-row--fail'
  return ''
}

const getStatusBadgeClass = (scoreRate: number): string => {
  return scoreRate >= 60 ? 'status-badge--pass' : 'status-badge--fail'
}

const selectQuestion = (questionId: number) => {
  currentQuestionId.value = questionId
  selectedScoreRange.value = ''
}

const selectScoreRange = (range: string) => {
  selectedScoreRange.value = selectedScoreRange.value === range ? '' : range
}

const handleHistogramClick = (event: Event) => {
  if (event.target === event.currentTarget) {
    selectedScoreRange.value = ''
  }
}

const clearScoreFilter = () => {
  selectedScoreRange.value = ''
}

const viewStudentPaper = (studentId: number) => {
  selectedStudentId.value = studentId
  paperDialogVisible.value = true
}

onMounted(() => {
  examDataStore.loadFromLocal()

  if (examDataStore.questions.length > 0) {
    currentQuestionId.value = examDataStore.questions[0].question_id
  }
})
</script>

<style scoped>
.report-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  height: auto;
  min-height: var(--card-header-height);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 16px;
}

.header-meta {
  display: flex;
  gap: 16px;
  font-size: 16px;
  color: #3c3c43;
}

.total-students {
  font-weight: 600;
}

.current-view {
  color: #007aff;
  font-weight: 500;
}

.export-btn {
  padding: 12px 20px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 8px rgba(0, 122, 255, 0.2),
    0 4px 16px rgba(0, 122, 255, 0.1);
  min-height: 48px;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.export-btn:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-2px);
  box-shadow:
    0 4px 16px rgba(0, 122, 255, 0.3),
    0 8px 32px rgba(0, 122, 255, 0.15);
}

.export-btn:active:not(:disabled) {
  transform: translateY(-1px);
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.report-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  color: #000000;
  margin: 0;
  letter-spacing: -0.022em;
}

.question-tabs {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.question-tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 12px 16px;
  background: #f2f2f7;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  min-width: 140px;
}

.question-tab--active {
  background: #007aff;
  color: white;
}

.tab-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.tab-meta {
  font-size: 16px;
  opacity: 0.8;
  font-weight: 500;
}

.question-simple-card {
  background: #f2f2f7;
  border-radius: 12px;
  padding: 20px;
  border: none;
}

.question-content {
  font-size: 24px;
  line-height: 1.5;
  color: #000000;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.stat-item {
  background: #f2f2f7;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: none;
}

.stat-item--highlight {
  background: #007aff;
  color: white;
}

.stat-item--highlight .stat-value,
.stat-item--highlight .stat-label {
  color: white;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #000000;
  margin-bottom: 4px;
  letter-spacing: -0.022em;
}

.stat-label {
  font-size: 16px;
  color: #3c3c43;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 122, 255, 0.08);
  padding: 8px 12px;
  border-radius: 20px;
}

.filter-text {
  font-size: 16px;
  color: #007aff;
  font-weight: 600;
}

.filter-clear-btn {
  background: #007aff;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.filter-clear-btn:hover {
  opacity: 0.8;
}

.distribution-chart {
  background: #f2f2f7;
  border-radius: 12px;
  padding: 24px;
  margin-top: 16px;
}

.chart-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.chart-segment {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chart-segment:hover {
  opacity: 0.8;
}

.chart-segment--selected {
  background: rgba(0, 122, 255, 0.1);
  border-radius: 8px;
  padding: 8px;
  margin: -8px;
}

.chart-bar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 120px;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.chart-bar {
  background: #007aff;
  border-radius: 4px;
  width: 32px;
  min-height: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
}

.chart-segment--selected .chart-bar {
  background: #ff9500;
}

.bar-count {
  color: white;
  font-size: 16px;
  font-weight: 600;
  position: absolute;
  top: -20px;
  white-space: nowrap;
  color: #000000;
}

.bar-label {
  text-align: center;
}

.bar-range {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 2px;
}

.bar-percentage {
  font-size: 10px;
  color: #3c3c43;
}

.questions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.question-overview-card {
  background: #f2f2f7;
  border-radius: 12px;
  padding: 20px;
  border: none;
  cursor: pointer;
}

.question-overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.question-name {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  letter-spacing: -0.022em;
}

.question-score {
  font-size: 14px;
  color: #8e8e93;
  font-weight: 500;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.progress-track {
  flex: 1;
  height: 6px;
  background: rgba(142, 142, 147, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-fill--excellent {
  background: linear-gradient(90deg, #34c759 0%, #30d158 100%);
}

.progress-fill--good {
  background: linear-gradient(90deg, #007aff 0%, #64d2ff 100%);
}

.progress-fill--pass {
  background: linear-gradient(90deg, #ff9500 0%, #ffcc02 100%);
}

.progress-fill--fail {
  background: linear-gradient(90deg, #ff3b30 0%, #ff6961 100%);
}

.progress-percentage {
  font-size: 20px;
  color: #000000;
  font-weight: 600;
  min-width: 45px;
  text-align: right;
}

.question-stats-footer {
  color: #8e8e93;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.scores-table-container {
  background: #f2f2f7;
  border-radius: 12px;
  overflow: hidden;
  border: none;
}

.scores-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1fr 1fr 1.2fr;
  background: #f2f2f7;
  border-bottom: 1px solid #e5e5ea;
}

.header-cell {
  padding: 16px 20px;
  font-weight: 600;
  color: #3c3c43;
  font-size: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-body {
  max-height: 400px;
  overflow-y: auto;
  background: #ffffff;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1fr 1fr 1.2fr;
  border-bottom: 1px solid #e5e5ea;
  transition: background-color 0.15s ease;
}

.table-row:hover {
  background-color: #f2f2f7;
}

.table-row--excellent {
  background-color: rgba(52, 199, 89, 0.08);
}

.table-row--fail {
  background-color: rgba(255, 59, 48, 0.08);
}

.table-cell {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  font-size: 20px;
  color: #000000;
}

.student-id {
  font-weight: 500;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.score-value {
  font-weight: 700;
  font-size: 20px;
}

.score-separator {
  color: #8e8e93;
  margin: 0 2px;
}

.score-total {
  font-size: 20px;
  color: #8e8e93;
}

.percentage {
  font-weight: 600;
}

.student-count {
  font-size: 20px;
  color: #8e8e93;
  font-weight: 500;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge--pass {
  background-color: rgba(52, 199, 89, 0.15);
  color: #34c759;
}

.status-badge--fail {
  background-color: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
}

.action-btn {
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
  font-family: inherit;
}

.action-btn--primary {
  background: #007aff;
  color: white;
}

.action-btn--primary:hover {
  opacity: 0.8;
}

@media (max-width: 1024px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .question-tabs {
    justify-content: flex-start;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .questions-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .export-btn {
    padding: 10px 16px;
    font-size: 14px;
    min-height: 44px;
  }

  .report-content {
    gap: 24px;
  }

  .question-tabs {
    flex-direction: column;
  }

  .question-tab {
    min-width: unset;
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .table-header,
  .table-row {
    grid-template-columns: 2fr 1fr 1fr;
  }

  .table-cell:nth-child(4),
  .table-cell:nth-child(5),
  .header-cell:nth-child(4),
  .header-cell:nth-child(5) {
    display: none;
  }

  .distribution-chart {
    height: 220px;
    padding: 20px 16px 40px 16px;
  }

  .chart-bar {
    width: 40px;
    margin-bottom: 30px;
    max-height: 150px;
  }
}

@media (max-width: 480px) {
  .export-btn {
    width: 100%;
    justify-content: center;
  }

  .section-title {
    font-size: 18px;
  }

  .question-simple-card,
  .stat-item,
  .question-overview-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 28px;
  }
}

:global(.main-content--compact .report-content),
:global(.main-content--narrow .report-content) {
  gap: 24px;
}

:global(.main-content--compact .stats-grid) {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

:global(.main-content--compact .section-title),
:global(.main-content--narrow .section-title) {
  font-size: 26px;
}

:global(.main-content--narrow .header-content) {
  flex-direction: column;
  align-items: stretch;
}

:global(.main-content--narrow .header-actions),
:global(.main-content--narrow .export-btn) {
  width: 100%;
}

:global(.main-content--narrow .header-actions) {
  justify-content: stretch;
}

:global(.main-content--narrow .question-tabs),
:global(.main-content--narrow .stats-grid) {
  grid-template-columns: 1fr;
}

:global(.main-content--narrow .question-tabs) {
  display: grid;
}

:global(.main-content--narrow .question-tab) {
  width: 100%;
  min-width: 0;
}

:global(.main-content--narrow .table-header),
:global(.main-content--narrow .table-row) {
  grid-template-columns: 2fr 1fr 1fr;
}

:global(.main-content--narrow .table-cell:nth-child(4)),
:global(.main-content--narrow .table-cell:nth-child(5)),
:global(.main-content--narrow .header-cell:nth-child(4)),
:global(.main-content--narrow .header-cell:nth-child(5)) {
  display: none;
}
</style>
