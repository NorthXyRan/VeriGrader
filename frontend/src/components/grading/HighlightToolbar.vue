<template>
  <div class="highlight-toolbar">
    <div class="tool-section">
      <div class="tool-group tool-group--mark">
        <el-button
          type="success"
          @click="() => handleMarkAnswer('correct')"
          :disabled="
            props.isGoldPaper ||
            !hasSelectedText ||
            !props.highlightData ||
            isCurrentHighlightExample
          "
        >
          <el-icon><Check /></el-icon>
          Correct
        </el-button>

        <el-button
          type="danger"
          @click="() => handleMarkAnswer('wrong')"
          :disabled="
            props.isGoldPaper ||
            !hasSelectedText ||
            !props.highlightData ||
            isCurrentHighlightExample
          "
        >
          <el-icon><Close /></el-icon>
          Wrong
        </el-button>

        <el-button
          type="warning"
          @click="() => handleMarkAnswer('unclear')"
          :disabled="
            props.isGoldPaper ||
            !hasSelectedText ||
            !props.highlightData ||
            isCurrentHighlightExample
          "
        >
          <el-icon><QuestionFilled /></el-icon>
          Unclear
        </el-button>
      </div>

      <el-divider direction="vertical" />
      <div class="tool-group tool-group--edit">
        <el-button
          @click="handleSplit"
          class="split-btn"
          :disabled="props.isGoldPaper || !isSplitEnabled"
        >
          <el-icon><Scissor /></el-icon>
          Split
        </el-button>

        <el-button
          @click="handleEraseMarks"
          class="eraser-btn"
          :disabled="props.isGoldPaper || !props.highlightData || isCurrentHighlightExample"
        >
          <el-icon><Delete /></el-icon>
          Erase
        </el-button>

        <el-button
          @click="handleClearAll"
          class="clear-btn"
          :disabled="props.isGoldPaper || !props.highlightData || hasExamples"
        >
          <el-icon><Refresh /></el-icon>
          Reset
        </el-button>
      </div>

      <div class="score-section">
        <div class="score-display-section">
          <div class="score-glass-container">
            <span
              class="score-value"
              contenteditable="true"
              @blur="handleScoreBlur"
              @keydown.enter.prevent
              >{{ llmScore }}</span
            >
          </div>
          <span class="score-unit">marks</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@/components/Message'
import type { HighlightData } from '@/stores/useExamDataStore'
import type { HighlightType } from '@/types/exam'
import { Check, Close, Delete, QuestionFilled, Refresh, Scissor } from '@element-plus/icons-vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface PaperPreviewApi {
  getHasSelectedText: () => boolean
  markAnswer: (type: HighlightType) => void
  eraseHighlightedText: () => void
  clearAllMarks: () => void
}

interface Props {
  paperPreviewRef?: PaperPreviewApi | null
  highlightData?: HighlightData | null
  isGoldPaper?: boolean
  reasonExamples?: Array<{
    questionId: number
    studentId: number
    studentAnswer: string
    highlightType: HighlightType
    reason: string
  }>
  currentQuestionId?: number
  currentHighlight?: {
    text: string
    type: HighlightType
    reason: string
    occurrence: number
  } | null
  llmScore?: number
}

const emit = defineEmits<{
  updateHighlightData: [highlightData: HighlightData]
  enterSplitMode: [data: { text: string; type: HighlightType; occurrence: number }]
  updateScore: [value: number]
}>()

const props = withDefaults(defineProps<Props>(), {
  isGoldPaper: false,
  reasonExamples: () => [],
  currentQuestionId: 1,
  currentHighlight: null,
  llmScore: 0,
})

const hasExamples = computed(() => {
  return (
    props.reasonExamples &&
    props.reasonExamples.length > 0 &&
    props.reasonExamples.some((example) => example.questionId === props.currentQuestionId)
  )
})

const isCurrentHighlightExample = computed(() => {
  const current = props.currentHighlight
  if (!current || props.reasonExamples.length === 0) return false

  return props.reasonExamples.some(
    (example) =>
      example.questionId === props.currentQuestionId &&
      example.studentAnswer === current.text &&
      example.highlightType === current.type &&
      example.reason === current.reason,
  )
})

const isSplitEnabled = computed(() => {
  const MIN_SPLIT_LENGTH = 10
  return (
    props.currentHighlight &&
    props.currentHighlight.text.length > MIN_SPLIT_LENGTH &&
    !isCurrentHighlightExample.value &&
    props.highlightData
  )
})

const hasSelectedText = ref(false)

const syncSelection = () => {
  hasSelectedText.value = props.paperPreviewRef
    ? props.paperPreviewRef.getHasSelectedText()
    : Boolean(window.getSelection()?.toString().trim())
}

onMounted(() => {
  syncSelection()
  document.addEventListener('selectionchange', syncSelection)
  document.addEventListener('mouseup', syncSelection)
  document.addEventListener('click', syncSelection)
})

onUnmounted(() => {
  document.removeEventListener('selectionchange', syncSelection)
  document.removeEventListener('mouseup', syncSelection)
  document.removeEventListener('click', syncSelection)
})

const handleMarkAnswer = (type: HighlightType) => {
  if (!hasSelectedText.value) {
    Message.warning('Please select text to mark first')
    return
  }

  if (props.paperPreviewRef) {
    props.paperPreviewRef.markAnswer(type)
  }
}

const handleEraseMarks = () => {
  if (props.paperPreviewRef) {
    props.paperPreviewRef.eraseHighlightedText()
  }
}

const handleClearAll = () => {
  if (props.paperPreviewRef) {
    props.paperPreviewRef.clearAllMarks()
  }
}

const handleSplit = () => {
  if (!isSplitEnabled.value) {
    if (!props.currentHighlight) {
      Message.warning('Please click on a highlight first to enable split')
    } else if (props.currentHighlight.text.length <= 10) {
      Message.warning('Selected text is too short for splitting (minimum 10 characters)')
    } else if (isCurrentHighlightExample.value) {
      Message.warning('Cannot split example highlights')
    }
    return
  }

  const current = props.currentHighlight
  if (!current) return

  emit('enterSplitMode', {
    text: current.text,
    type: current.type,
    occurrence: current.occurrence,
  })

  Message.info('Click inside the highlight where you want to split it')
}

const handleScoreBlur = (event: Event) => {
  if (!(event.target instanceof HTMLElement)) return
  const element = event.target
  const text = element.innerText.trim()
  const next = Number(text)
  if (!Number.isFinite(next)) {
    element.innerText = String(props.llmScore)
    return
  }
  emit('updateScore', next)
}

defineExpose({
  hasSelection: () => hasSelectedText.value,
})
</script>

<style scoped>
.highlight-toolbar {
  flex-shrink: 0;
  width: 100%;
  background: #f7f7f8;
  border-bottom: 1px solid #ececef;
}

.tool-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  width: 100%;
  min-height: 56px;
  padding: 10px 16px;
}

.tool-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.score-section {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.score-display-section {
  display: flex;
  align-items: center;
  gap: 6px;
}

.score-glass-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 34px;
  padding: 0 12px;
  background: #ffffff;
  border: 1px solid #e3e3e8;
  border-radius: var(--radius-pill);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.score-glass-container:hover,
.score-glass-container:focus-within {
  border-color: rgba(0, 122, 255, 0.45);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12);
}

.score-value {
  min-width: 16px;
  color: #007aff;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  font-variant-numeric: tabular-nums;
  outline: none;
}

.score-unit {
  color: rgba(0, 0, 0, 0.6);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.highlight-toolbar :deep(.el-button) {
  flex-shrink: 0;
  height: 32px;
  margin: 0;
  padding: 0 12px;
  border-radius: var(--radius-pill);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.highlight-toolbar :deep(.el-button .el-icon) {
  margin-right: 4px;
}

.highlight-toolbar :deep(.el-button--primary) {
  background: #007aff;
  border-color: #007aff;
}

.highlight-toolbar :deep(.el-button--primary:hover) {
  background: #0056b3;
  border-color: #0056b3;
  transform: translateY(-1px);
}

.highlight-toolbar :deep(.el-button--success) {
  background: rgb(52, 199, 89);
  border-color: rgb(52, 199, 89);
}

.highlight-toolbar :deep(.el-button--success:hover) {
  background: rgb(48, 209, 88);
  border-color: rgb(48, 209, 88);
  transform: translateY(-1px);
}

.highlight-toolbar :deep(.el-button--danger) {
  background: rgb(255, 59, 48);
  border-color: rgb(255, 59, 48);
}

.highlight-toolbar :deep(.el-button--danger:hover) {
  background: rgb(255, 69, 58);
  border-color: rgb(255, 69, 58);
  transform: translateY(-1px);
}

.highlight-toolbar :deep(.el-button--warning) {
  background: rgb(255, 204, 0);
  border-color: rgb(255, 204, 0);
  color: #212529;
}

.highlight-toolbar :deep(.el-button--warning:hover) {
  background: rgb(255, 214, 10);
  border-color: rgb(255, 214, 10);
  color: #212529;
  transform: translateY(-1px);
}

.highlight-toolbar :deep(.el-button--info) {
  background: rgb(0, 122, 255);
  border-color: rgb(0, 122, 255);
  color: #ffffff;
}

.highlight-toolbar :deep(.el-button--info:hover) {
  background: rgb(10, 132, 255);
  border-color: rgb(10, 132, 255);
  color: #ffffff;
  transform: translateY(-1px);
}

.highlight-toolbar :deep(.el-button--default) {
  background: #e5e5e5;
  border-color: #e5e5e5;
  color: rgba(0, 0, 0, 0.6);
}

.highlight-toolbar :deep(.el-button--default:hover) {
  background: #d1d1d1;
  border-color: #d1d1d1;
  transform: translateY(-1px);
}

.highlight-toolbar :deep(.el-divider--vertical) {
  flex-shrink: 0;
  align-self: center;
  height: 20px;
  margin: 0 2px;
  border-color: #dcdce0;
}

.eraser-btn {
  background: #f0f0f0 !important;
  border-color: #d0d0d0 !important;
  color: #666 !important;
}

.eraser-btn:hover {
  background: #e0e0e0 !important;
  border-color: #c0c0c0 !important;
  color: #333 !important;
}

.clear-btn {
  background: #fff3e0 !important;
  border-color: #ffb74d !important;
  color: #f57c00 !important;
}

.clear-btn:hover {
  background: #ffe0b2 !important;
  border-color: #ffa726 !important;
  color: #e65100 !important;
}

.split-btn {
  background: #e8f5e8 !important;
  border-color: #4caf50 !important;
  color: #2e7d32 !important;
}

.split-btn:hover:not(:disabled) {
  background: #c8e6c9 !important;
  border-color: #388e3c !important;
  color: #1b5e20 !important;
}

.split-btn:disabled {
  background: #f5f5f5 !important;
  border-color: #e0e0e0 !important;
  color: #bdbdbd !important;
  cursor: not-allowed;
}

.highlight-toolbar :deep(.el-button:disabled) {
  opacity: 0.4;
  transform: none !important;
}

/*
 * Narrower response panels: the marking buttons and the score share the first row and the
 * editing tools move to a second row, instead of overflowing behind a scrollbar.
 */
@container response-panel (max-width: 46rem) {
  .highlight-toolbar :deep(.el-divider--vertical) {
    display: none;
  }

  .tool-group--mark {
    order: 1;
  }

  .score-section {
    order: 2;
  }

  .tool-group--edit {
    order: 3;
    flex-basis: 100%;
  }
}

@container response-panel (max-width: 28rem) {
  .tool-section {
    padding: 10px 12px;
  }

  .tool-group--mark {
    flex-basis: 100%;
  }

  .tool-group--mark :deep(.el-button),
  .tool-group--edit :deep(.el-button) {
    flex: 1 1 0;
    min-width: 0;
    height: 38px;
    padding: 0 8px;
  }

  .tool-group--edit {
    flex: 1 1 0;
    flex-basis: auto;
    order: 2;
  }

  .score-section {
    order: 3;
  }
}
</style>
