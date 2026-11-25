<template>
  <div class="question-display" :class="`question-display--${layout}`">
    <div class="question-container">
      <div class="question-row">
        <el-icon class="question-icon"><Document /></el-icon>
        <span class="question-label">Question {{ currentQuestion }}</span>
        <el-popover
          v-if="isPagesDemo"
          trigger="click"
          placement="bottom"
          width="min(420px, calc(100vw - 32px))"
          :content="questionText"
        >
          <template #reference>
            <button
              type="button"
              class="question-text question-text--expandable"
              :title="questionText"
            >
              {{ questionText }}
            </button>
          </template>
        </el-popover>
        <p v-else class="question-text">{{ questionText }}</p>
        <div class="question-score">
          <span class="score-value">{{ questionScore }}</span>
          <span class="score-unit">marks</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useContentLayout } from '@/composables/useContentLayout'
import { isPagesDemo } from '@/config/deployment'
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

.question-container {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 12px 20px;
}

.question-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.question-icon {
  flex-shrink: 0;
  font-size: 18px;
  color: #007aff;
}

.question-label {
  flex-shrink: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.question-text {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  color: rgba(0, 0, 0, 0.8);
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.45;
  letter-spacing: -0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.question-text--expandable {
  border: 0;
  background: none;
  text-align: left;
  cursor: pointer;
}

.question-text--expandable:hover {
  text-decoration: underline;
  text-decoration-color: rgba(0, 0, 0, 0.3);
  text-underline-offset: 3px;
}

.question-score {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 4px 12px;
  border: 1.5px solid #30d158;
  border-radius: var(--radius-pill);
  background: #ffffff;
  color: #000000;
  white-space: nowrap;
}

.score-value {
  font-size: 14px;
  font-weight: 700;
}

.score-unit {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.8;
}

/* Narrow: the prompt wraps onto a second row and shows up to three lines. */
.question-display--narrow .question-container {
  padding: 14px 16px;
}

.question-display--narrow .question-row {
  flex-wrap: wrap;
  row-gap: 8px;
}

.question-display--narrow .question-score {
  margin-left: auto;
}

.question-display--narrow .question-text {
  flex: 1 1 100%;
  order: 3;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  white-space: normal;
  font-size: 15px;
}
</style>
