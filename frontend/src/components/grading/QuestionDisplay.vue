<template>
  <div class="question-display">
    <div class="question-container">
      <div class="question-row">
        <el-icon class="question-icon"><Document /></el-icon>
        <span class="question-label">Question {{ currentQuestion }}</span>
        <p class="question-text">{{ questionText }}</p>
        <div class="question-score">
          <span class="score-value">{{ questionScore }}</span>
          <span class="score-unit">marks</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  border: 1px solid #e5e5e5;
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.question-display:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.question-container {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  height: 100%;
}

.question-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-height: 0;
}

.question-icon {
  width: 24px;
  height: 24px;
  color: #007aff;
  font-size: 20px;
  flex-shrink: 0;
}

.question-label {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: -0.01em;
  white-space: nowrap;
  flex-shrink: 0;
}

.question-score {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 8px 16px;
  background: #ffffff;
  border: 2px solid #30d158;
  border-radius: 16px;
  color: #000000;
  flex-shrink: 0;
}

.score-value {
  font-size: 14px;
  font-weight: 700;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
}

.score-unit {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.9;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
}

.question-text {
  font-size: 18px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.87);
  margin: 0;
  letter-spacing: -0.01em;
  font-weight: 500;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

:global(.main-content--narrow .question-container) {
  padding: 12px 16px;
}

:global(.main-content--narrow .question-row) {
  gap: 12px;
}

:global(.main-content--narrow .question-label) {
  font-size: 16px;
}

:global(.main-content--narrow .question-text) {
  font-size: 13px;
}

:global(.main-content--narrow .score-value) {
  font-size: 12px;
}

:global(.main-content--narrow .question-icon) {
  width: 20px;
  height: 20px;
  font-size: 16px;
}

@media (max-width: 768px) {
  .question-container {
    padding: 12px 16px;
  }

  .question-row {
    gap: 12px;
  }

  .question-label {
    font-size: 16px;
  }

  .question-text {
    font-size: 13px;
  }

  .score-value {
    font-size: 12px;
  }

  .question-icon {
    width: 20px;
    height: 20px;
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .question-row {
    gap: 8px;
  }

  .question-label {
    font-size: 14px;
  }

  .question-text {
    font-size: 12px;
  }

  .question-icon {
    width: 18px;
    height: 18px;
    font-size: 14px;
  }

  .question-score {
    padding: 6px 12px;
  }
}
</style>
