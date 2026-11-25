<template>
  <div class="page-container report-page" :class="`report-page--${layout}`">
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
                    :style="{ height: `${Math.min((segment.count / maxCount) * 100, 100)}%` }"
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
import { useContentLayout } from '@/composables/useContentLayout'
import { useExportResults } from '@/composables/useExportResults'
import { useExamDataStore } from '@/stores/useExamDataStore'
import { getScoreBand, SCORE_BANDS } from '@/utils/scoreBands'
import PaperViewer from './PaperViewer.vue'

const examDataStore = useExamDataStore()
const layout = useContentLayout()

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
.report-main-card {
  height: auto;
  max-width: 1440px;
  margin: 0 auto;
}

.report-header {
  height: auto;
  min-height: 64px;
  padding: 12px 16px 12px 28px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.report-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-strong);
}

.header-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 16px;
}

.export-btn {
  min-height: 40px;
  padding: 0 20px;
  border: none;
  border-radius: var(--radius-pill);
  background: #007aff;
  color: white;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.export-btn:hover:not(:disabled) {
  background: #0062d6;
  box-shadow: 0 6px 16px rgba(0, 122, 255, 0.28);
  transform: translateY(-1px);
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.report-content {
  gap: 32px;
  padding: 28px;
}

.report-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 32px;
}

.section-title {
  margin: 0;
  color: #000000;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.question-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.question-tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 132px;
  padding: 10px 16px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: var(--radius-md);
  background: #f2f2f7;
  color: var(--text-strong);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.question-tab:hover:not(.question-tab--active) {
  background: #e8e8ee;
}

.question-tab--active {
  background: #007aff;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.22);
}

.tab-title {
  font-size: 15px;
  font-weight: 600;
}

.tab-meta {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.75;
}

.question-simple-card {
  padding: 18px 20px;
  border-radius: var(--radius-md);
  background: #f2f2f7;
}

.question-content {
  max-width: 72ch;
  margin: 0;
  color: #000000;
  font-size: 17px;
  line-height: 1.55;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.stat-item {
  padding: 18px 12px;
  border-radius: var(--radius-md);
  background: #f2f2f7;
  text-align: center;
}

.stat-value {
  margin-bottom: 4px;
  color: #000000;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  color: #3c3c43;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.filter-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px 4px 12px;
  border-radius: var(--radius-pill);
  background: rgba(0, 122, 255, 0.08);
}

.filter-text {
  color: #007aff;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.filter-clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: #007aff;
  color: white;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.filter-clear-btn:hover {
  opacity: 0.8;
}

.distribution-chart {
  padding: 20px 24px 16px;
  border-radius: var(--radius-md);
  background: #f2f2f7;
}

.chart-container {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.chart-segment {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.chart-segment:hover {
  background: rgba(0, 122, 255, 0.05);
}

.chart-segment--selected {
  background: rgba(0, 122, 255, 0.1);
}

.chart-bar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 128px;
  padding-top: 22px;
  margin-bottom: 10px;
}

.chart-bar {
  position: relative;
  width: 32px;
  min-height: 4px;
  border-radius: 6px 6px 3px 3px;
  background: #007aff;
  transition: height 0.3s ease;
}

.chart-segment--selected .chart-bar {
  background: #ff9500;
}

.bar-count {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  color: #000000;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.bar-label {
  text-align: center;
}

.bar-range {
  color: #000000;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.questions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.question-overview-card {
  padding: 18px 20px;
  border-radius: var(--radius-md);
  background: #f2f2f7;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.question-overview-card:hover {
  background: #e8e8ee;
}

.question-overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.question-name {
  color: #000000;
  font-size: 15px;
  font-weight: 600;
}

.question-score {
  color: #8e8e93;
  font-size: 13px;
  font-weight: 500;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.progress-track {
  flex: 1;
  height: 6px;
  overflow: hidden;
  border-radius: 3px;
  background: rgba(142, 142, 147, 0.2);
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
  min-width: 44px;
  color: #000000;
  font-size: 15px;
  font-weight: 600;
  text-align: right;
}

.question-stats-footer {
  color: #8e8e93;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.scores-table-container {
  overflow: hidden;
  border-radius: var(--radius-md);
  background: #f2f2f7;
}

.scores-table {
  width: 100%;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1fr 1fr 1.2fr;
  align-items: center;
}

.table-header {
  border-bottom: 1px solid #e5e5ea;
}

.header-cell {
  padding: 12px 20px;
  color: #3c3c43;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.table-body {
  max-height: 420px;
  overflow-y: auto;
  background: #ffffff;
}

.table-row {
  border-bottom: 1px solid #ededf0;
  transition: background-color 0.15s ease;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background-color: #f7f7fa;
}

.table-row--excellent {
  background-color: rgba(52, 199, 89, 0.07);
}

.table-row--fail {
  background-color: rgba(255, 59, 48, 0.06);
}

.table-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 12px 20px;
  color: #000000;
  font-size: 15px;
}

.student-id {
  font-weight: 500;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-variant-numeric: tabular-nums;
}

.score-value {
  font-size: 15px;
  font-weight: 700;
}

.score-separator {
  margin: 0 2px;
  color: #8e8e93;
}

.score-total {
  color: #8e8e93;
  font-size: 15px;
}

.percentage {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.student-count {
  color: #8e8e93;
  font-size: 14px;
  font-weight: 500;
}

.status-badge {
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.status-badge--pass {
  background-color: rgba(52, 199, 89, 0.15);
  color: #1f9d45;
}

.status-badge--fail {
  background-color: rgba(255, 59, 48, 0.13);
  color: #e0352b;
}

.action-btn {
  min-height: 32px;
  padding: 0 14px;
  border: none;
  border-radius: var(--radius-pill);
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: background-color 0.15s ease;
}

.action-btn--primary {
  background: #007aff;
  color: white;
}

.action-btn--primary:hover {
  background: #0062d6;
}

/* Compact */
.report-page--compact .report-content {
  gap: 28px;
  padding: 24px;
}

.report-page--compact .header-cell,
.report-page--compact .table-cell {
  padding-inline: 14px;
}

/* Narrow: two-up tabs and stats, and student rows as compact cards. */
.report-page--narrow .report-header {
  padding: 10px 10px 10px 18px;
}

.report-page--narrow .export-btn {
  min-height: 42px;
  padding: 0 16px;
}

.report-page--narrow .report-content {
  gap: 24px;
  padding: 18px 16px 20px;
}

.report-page--narrow .section-title {
  font-size: 18px;
}

.report-page--narrow .question-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.report-page--narrow .question-tab {
  min-width: 0;
  min-height: 52px;
}

.report-page--narrow .question-tab:first-child:nth-last-child(odd) {
  grid-column: 1 / -1;
}

.report-page--narrow .question-simple-card {
  padding: 14px 16px;
}

.report-page--narrow .question-content {
  font-size: 16px;
}

.report-page--narrow .stats-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.report-page--narrow .stat-item {
  padding: 14px 10px;
}

.report-page--narrow .stat-item:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}

.report-page--narrow .stat-value {
  font-size: 24px;
}

.report-page--narrow .distribution-chart {
  padding: 16px 8px 12px;
}

.report-page--narrow .chart-container {
  gap: 2px;
}

.report-page--narrow .chart-bar {
  width: 24px;
}

.report-page--narrow .bar-range {
  font-size: 11px;
}

.report-page--narrow .questions-grid {
  grid-template-columns: minmax(0, 1fr);
}

.report-page--narrow .table-header {
  display: none;
}

.report-page--narrow .table-body {
  max-height: none;
}

.report-page--narrow .table-row {
  grid-template-columns: minmax(0, 1fr) auto auto;
  grid-template-areas:
    'student score action'
    'status score action';
  column-gap: 12px;
  padding: 10px 14px;
}

.report-page--narrow .table-cell {
  padding: 0;
}

.report-page--narrow .table-cell:nth-child(1) {
  grid-area: student;
}

.report-page--narrow .table-cell:nth-child(2) {
  grid-area: score;
  font-size: 17px;
}

.report-page--narrow .table-cell:nth-child(3) {
  display: none;
}

.report-page--narrow .table-cell:nth-child(4) {
  grid-area: status;
  margin-top: 4px;
}

.report-page--narrow .table-cell:nth-child(5) {
  grid-area: action;
}

.report-page--narrow .status-badge {
  padding: 2px 8px;
  font-size: 11px;
}

.report-page--narrow .action-btn {
  min-height: 40px;
}
</style>
