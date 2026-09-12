<template>
  <div class="highlight-toolbar">
    <div class="tool-section">
      <div class="tool-group">
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
      <div class="tool-group">
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
  width: 100%;
  height: 64px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
  padding: 0;
}

.tool-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 12px 20px;
  box-sizing: border-box;

  white-space: nowrap;
  flex-wrap: nowrap;
}

.tool-section::-webkit-scrollbar {
  height: 8px;
}

.tool-section::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.tool-section::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.tool-section::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
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
  gap: 8px;
}

.score-glass-container {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 40px;
  padding: 10px 16px;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 24px;
  transition: all 0.2s ease;
  font-size: 14px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
}

.score-glass-container:hover {
  background: rgba(245, 246, 247, 0.95);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.score-value {
  font-size: 20px;
  font-weight: 700;
  color: #007aff;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
  line-height: 1;
  min-width: 20px;
  text-align: center;
}

.score-unit {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 500;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
  white-space: nowrap;
}

.highlight-toolbar :deep(.el-button) {
  border-radius: 24px;
  font-weight: 500;
  transition: all 0.2s ease;
  padding: 10px 16px;
  font-size: 14px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  min-height: 40px;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: max-content;
  position: relative;
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
  border-color: #e5e5e5;
  height: 20px;
  margin: 0 1px;
  flex-shrink: 0;
  align-self: center;
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

@media (max-width: 768px) {
  .highlight-toolbar {
    height: 56px;
  }

  .tool-section {
    gap: 12px;
    padding: 8px 16px;
  }

  .tool-group {
    gap: 8px;
    height: 100%;
  }

  .highlight-toolbar :deep(.el-button) {
    padding: 8px 12px;
    font-size: 13px;
    min-height: 36px;
  }

  .highlight-toolbar :deep(.el-divider--vertical) {
    height: 24px;
    margin: 0 8px;
  }
}

@media (max-width: 480px) {
  .tool-section {
    gap: 10px;
    padding: 6px 12px;
  }

  .tool-group {
    gap: 6px;
    height: 100%;
  }

  .highlight-toolbar :deep(.el-button) {
    padding: 6px 10px;
    font-size: 12px;
    min-height: 32px;
  }

  .highlight-toolbar :deep(.el-button .el-icon) {
    margin-right: 4px;
  }

  .highlight-toolbar :deep(.el-divider--vertical) {
    height: 20px;
    margin: 0 4px;
  }
}

:global(.main-content--compact .highlight-toolbar),
:global(.main-content--narrow .highlight-toolbar) {
  height: auto;
}

:global(.main-content--compact .tool-section),
:global(.main-content--narrow .tool-section) {
  height: auto;
  min-height: 64px;
  justify-content: center;
  flex-wrap: wrap;
  overflow: visible;
  white-space: normal;
  padding: 10px 14px;
}

:global(.main-content--compact .score-section),
:global(.main-content--narrow .score-section) {
  margin-left: 0;
}

:global(.main-content--compact .highlight-toolbar .el-button),
:global(.main-content--narrow .highlight-toolbar .el-button) {
  padding: 8px 12px;
  font-size: 13px;
  min-height: 36px;
}

:global(.main-content--narrow .highlight-toolbar .el-divider--vertical) {
  display: none;
}
</style>
