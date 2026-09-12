<template>
  <div class="paper-viewer">
    <div class="paper-header">
      <div class="paper-info">
        <h2 class="paper-title">Student Answer Sheet Details</h2>
        <div class="paper-meta">
          <span class="student-info">Student{{ studentId }}</span>
          <span class="exam-info" v-if="examTitle">{{ examTitle }}</span>
        </div>
      </div>
      <div class="score-summary">
        <div class="total-score">
          <span class="label">Total Score</span>
          <span class="score">{{ totalScore }}</span>
          <span class="max-score">/ {{ maxTotalScore }}</span>
        </div>
        <div class="score-rate">
          Score Rate: {{ Math.round((totalScore / maxTotalScore) * 100) }}%
        </div>
      </div>
    </div>

    <div class="paper-content">
      <div
        v-for="(questionData, index) in questionDataList"
        :key="questionData.question_id"
        class="question-section"
        :class="{ 'no-answer': !questionData.hasAnswer }"
      >
        <div class="question-header">
          <h3 class="question-title">
            Question {{ questionData.question_id }}
            <span class="question-score" v-if="questionData.hasAnswer">
              ({{ questionData.score }}/{{ questionData.maxScore }} points)
            </span>
            <span class="question-score no-score" v-else>
              (Not answered/{{ questionData.maxScore }} points)
            </span>
          </h3>
        </div>

        <div class="question-content">
          <h4>Question Content</h4>
          <div class="content-text">{{ questionData.content }}</div>
        </div>

        <div class="answer-section">
          <h4>Student Answer</h4>
          <div class="answer-content" v-if="questionData.hasAnswer">
            {{ questionData.answer }}
          </div>
          <div class="no-answer-content" v-else>
            <em>Student did not answer this question</em>
          </div>
        </div>

        <div class="grading-details" v-if="questionData.hasGrading">
          <h4>Grading Details</h4>
          <div class="grading-content">
            <div class="grading-section" v-if="questionData.gradingData.correct.length > 0">
              <h5 class="section-title correct">Correct Answers</h5>
              <div
                v-for="(item, idx) in questionData.gradingData.correct"
                :key="idx"
                class="grading-item correct"
              >
                <div class="answer-text">{{ item['Student answer'] }}</div>
                <div class="reason">{{ item.reason }}</div>
              </div>
            </div>

            <div class="grading-section" v-if="questionData.gradingData.wrong.length > 0">
              <h5 class="section-title wrong">Wrong Answers</h5>
              <div
                v-for="(item, idx) in questionData.gradingData.wrong"
                :key="idx"
                class="grading-item wrong"
              >
                <div class="answer-text">{{ item['Student answer'] }}</div>
                <div class="reason">{{ item.reason }}</div>
              </div>
            </div>

            <div class="grading-section" v-if="questionData.gradingData.unclear.length > 0">
              <h5 class="section-title unclear">Unclear Answers</h5>
              <div
                v-for="(item, idx) in questionData.gradingData.unclear"
                :key="idx"
                class="grading-item unclear"
              >
                <div class="answer-text">{{ item['Student answer'] }}</div>
                <div class="reason">{{ item.reason }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useExamDataStore } from '@/stores/useExamDataStore'

interface Props {
  studentId: number
  questionId?: number
  examTitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  questionId: undefined,
  examTitle: 'Exam Paper',
})

const examDataStore = useExamDataStore()

const questionDataList = computed(() => {
  const questions = props.questionId
    ? examDataStore.questions.filter((q) => q.question_id === props.questionId)
    : examDataStore.questions

  return questions.map((question) => {
    const studentAnswer = examDataStore.getStudentAnswer(props.studentId, question.question_id)

    const gradingData = examDataStore.getHighlightData(props.studentId, question.question_id)

    return {
      question_id: question.question_id,
      content: question.question,
      maxScore: question.score,
      hasAnswer: !!studentAnswer,
      answer: studentAnswer?.answer || '',
      hasGrading: !!gradingData,
      score: gradingData?.total_score || 0,
      gradingData: gradingData?.answer || {
        correct: [],
        wrong: [],
        unclear: [],
      },
    }
  })
})

const totalScore = computed(() => {
  return questionDataList.value.reduce((sum, q) => sum + q.score, 0)
})

const maxTotalScore = computed(() => {
  return questionDataList.value.reduce((sum, q) => sum + q.maxScore, 0)
})
</script>

<style scoped>
.paper-viewer {
  background: transparent;
  padding: 20px;
  max-width: 100%;
  margin: 0 auto;
}

.paper-header {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 24px;
  transition: all 0.3s ease;
}

.paper-header:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.paper-info {
  flex: 1;
}

.paper-title {
  font-size: 24px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 8px;
}

.paper-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
}

.student-info {
  font-weight: 600;
  color: #007aff;
  font-size: 16px;
}

.exam-info {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
}

.score-summary {
  text-align: right;
}

.total-score {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
}

.score {
  font-size: 28px;
  font-weight: 600;
  color: #007aff;
}

.max-score {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.6);
}

.score-rate {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
}

.paper-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-section {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.question-section:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.question-section.no-answer {
  background: #f8f9fa;
  border-color: #dee2e6;
  opacity: 0.8;
}

.question-header {
  background: #f5f5f5;
  border-bottom: 1px solid #e5e5e5;
  padding: 16px 20px;
}

.question-title {
  font-size: 20px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
  margin: 0;
}

.question-score {
  color: #007aff;
  font-weight: 500;
  margin-left: 8px;
}

.question-score.no-score {
  color: #999;
}

.question-content {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.question-content h4,
.answer-section h4,
.grading-details h4 {
  font-size: 20px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
  margin: 0 0 12px 0;
  border-left: 4px solid #007aff;
  padding-left: 12px;
}

.content-text,
.answer-content {
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.87);
  border: 1px solid #e5e5e5;
  white-space: pre-wrap;
}

.answer-section {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.no-answer-content {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  color: #6c757d;
  text-align: center;
  font-style: italic;
}

.grading-details {
  padding: 20px;
  background: #fafafa;
}

.grading-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.grading-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e5e5;
  transition: all 0.3s ease;
}

.grading-section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px 0;
  padding: 6px 12px;
  border-radius: 6px;
  display: inline-block;
}

.grading-item {
  margin-bottom: 12px;
  padding: 14px;
  border-radius: 8px;
  border-left: 4px solid;
  background: #ffffff;
  transition: all 0.3s ease;
}

.grading-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.grading-item:last-child {
  margin-bottom: 0;
}

.answer-text {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 6px;
  line-height: 1.4;
}

.reason {
  font-size: 18px;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.4;
  background: rgba(255, 255, 255, 0.6);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .paper-viewer {
    padding: 12px;
  }

  .paper-header {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }

  .score-summary {
    text-align: left;
  }

  .total-score {
    justify-content: flex-start;
  }

  .question-content,
  .answer-section,
  .grading-details {
    padding: 16px;
  }

  .paper-content {
    gap: 16px;
  }
}
</style>
