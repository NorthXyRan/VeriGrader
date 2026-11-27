<template>
  <div class="question-display" :class="`question-display--${layout}`">
    <div class="question-container">
      <div class="question-heading">
        <el-icon class="question-icon"><Document /></el-icon>
        <span class="question-label">Question {{ currentQuestion }}</span>
        <div class="question-score">
          <span class="score-value">{{ questionScore }}</span>
          <span class="score-unit">marks</span>
        </div>
      </div>
      <p class="question-text">{{ questionText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useContentLayout } from '@/composables/useContentLayout'
import { Document } from '@element-plus/icons-vue'
import { computed } from 'vue'

interface Props {
  currentQuestion: number
  questions: Array<{
    question_id: number
    question: string
    score: number
  }>
}

const layout = useContentLayout()

const props = withDefaults(defineProps<Props>(), {
  currentQuestion: 1,
  questions: () => [],
})

const currentQuestionData = computed(() => {
  return props.questions.find((q) => q.question_id === props.currentQuestion)
})

const questionText = computed(() => {
  const question = currentQuestionData.value
  if (!question) return 'Please upload the paper file first'
  return question.question || 'No question content available'
})

const questionScore = computed(() => {
  const question = currentQuestionData.value
  return question?.score || 0
})
</script>

<style scoped>
.question-display {
  background: #ffffff;
  border: 1px solid #e9e9ec;
}

/* The full prompt is always shown: it sits beside its label on wide screens and below it on
   narrow ones, wrapping as needed rather than being cut off. */
.question-container {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  height: 100%;
  padding: 14px 20px;
}

.question-heading {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
  min-height: 24px;
}

.question-icon {
  flex-shrink: 0;
  font-size: 18px;
  color: #007aff;
}

.question-label {
  color: #1d1d1f;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.question-score {
  display: flex;
  align-items: baseline;
  flex-shrink: 0;
  gap: 3px;
  margin-left: 4px;
  padding: 1px 10px;
  border: 1.5px solid #30d158;
  border-radius: var(--radius-pill);
  background: #ffffff;
  color: #000000;
  white-space: nowrap;
}

.score-value {
  font-size: 13px;
  font-weight: 700;
}

.score-unit {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.75;
}

.question-text {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: rgba(0, 0, 0, 0.82);
  font-size: 15px;
  line-height: 1.6;
  letter-spacing: -0.005em;
  overflow-wrap: anywhere;
}

/* Compact and narrow: label row on top, prompt underneath at full width. */
.question-display--compact .question-container,
.question-display--narrow .question-container {
  flex-direction: column;
  gap: 8px;
}

.question-display--compact .question-heading,
.question-display--narrow .question-heading {
  width: 100%;
}

.question-display--compact .question-score,
.question-display--narrow .question-score {
  margin-left: auto;
}

.question-display--narrow .question-container {
  padding: 14px 16px;
}
</style>
