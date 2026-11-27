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
  background: #fafafb;
  border-bottom: 1px solid #eef0f3;
}

.tool-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  width: 100%;
  min-height: 50px;
  padding: 9px 16px;
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
  height: 30px;
  margin: 0;
  padding: 0 11px;
  border-radius: var(--radius-pill);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.highlight-toolbar :deep(.el-button .el-icon) {
  margin-right: 4px;
}

/* Marking buttons are tinted to match the highlight colours used in the response text. */
.highlight-toolbar :deep(.el-button--success) {
  background: rgba(52, 199, 89, 0.14);
  border-color: transparent;
  color: #1d8a3c;
}

.highlight-toolbar :deep(.el-button--danger) {
  background: rgba(255, 59, 48, 0.12);
  border-color: transparent;
  color: #d62f26;
}

.highlight-toolbar :deep(.el-button--warning) {
  background: rgba(255, 204, 0, 0.22);
  border-color: transparent;
  color: #8a6a00;
}

.highlight-toolbar :deep(.el-button--success:not(.is-disabled):hover) {
  background: #34c759;
  color: #ffffff;
}

.highlight-toolbar :deep(.el-button--danger:not(.is-disabled):hover) {
  background: #ff3b30;
  color: #ffffff;
}

.highlight-toolbar :deep(.el-button--warning:not(.is-disabled):hover) {
  background: #ffcc00;
  color: #3d2f00;
}

.highlight-toolbar :deep(.el-divider--vertical) {
  flex-shrink: 0;
  align-self: center;
  height: 20px;
  margin: 0 2px;
  border-color: #dcdce0;
}

/* Editing tools are neutral so the marking buttons stay the visual focus. */
.split-btn,
.eraser-btn,
.clear-btn {
  background: #ffffff !important;
  border-color: #e1e2e6 !important;
  color: #3c3c43 !important;
}

.split-btn:not(.is-disabled):hover,
.eraser-btn:not(.is-disabled):hover {
  background: #f2f2f5 !important;
  border-color: #cfd0d6 !important;
}

.clear-btn {
  color: #c25e00 !important;
}

.clear-btn:not(.is-disabled):hover {
  background: #fff4e5 !important;
  border-color: #ffc58a !important;
}

.highlight-toolbar :deep(.el-button.is-disabled) {
  opacity: 0.45;
  transform: none !important;
}

/*
 * Narrower response panels: the marking buttons and the score share the first row and the
 * editing tools move to a second row, instead of overflowing behind a scrollbar.
 */
@container response-panel (max-width: 42rem) {
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
