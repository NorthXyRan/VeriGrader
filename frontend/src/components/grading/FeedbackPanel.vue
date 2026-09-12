<template>
  <div class="feedback-panel">
    <div class="feedback-content">
      <div class="reason-area">
        <el-input
          v-if="isEditing"
          v-model="editableReason"
          type="textarea"
          placeholder="Please enter the scoring reason..."
          :rows="6"
          resize="none"
          class="reason-textarea"
          @blur="autoSave"
        />

        <div v-else class="reason-display" @click="enterEditMode">
          <div v-if="isCurrentReasonInExamples" class="example-indicator">
            <el-icon><Star /></el-icon>
            <span>This rationale is currently used as a few-shot example</span>
          </div>

          <div class="reason-content-text">
            {{ displayReason }}
          </div>
        </div>
      </div>
    </div>

    <div class="action-buttons">
      <el-button
        :type="isCurrentReasonInExamples ? 'warning' : 'primary'"
        @click="toggleSubmitReason"
        :disabled="!editableReason.trim()"
      >
        {{ isCurrentReasonInExamples ? 'Remove Example' : 'Save as Example' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@/components/Message'
import type { HighlightType } from '@/utils/highlightUtils'
import { Star } from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'

interface HighlightClickData {
  text: string
  type: HighlightType
  reason?: string
  matchedReferenceAnswer?: string
}

interface SelectedHighlight {
  text: string
  type: HighlightType
  reason?: string
  matchedReferenceAnswer?: string
}

interface Props {
  currentQuestionId?: number
  reasonExamples?: Array<{
    questionId: number
    studentId: number
    studentAnswer: string
    highlightType: HighlightType
    reason: string
    matchedReferenceAnswer?: string
  }>
}

const props = withDefaults(defineProps<Props>(), {
  currentQuestionId: 1,
  reasonExamples: () => [],
})

interface ReasonExampleData {
  text: string
  type: HighlightType
  reason: string
  matchedReferenceAnswer?: string
}

const emits = defineEmits<{
  (e: 'modifyReason', data: SelectedHighlight): void
  (e: 'saveReason', data: { highlight: SelectedHighlight; reason: string }): void
  (e: 'submitReasonExample', data: ReasonExampleData): void
  (e: 'cancelReasonExample', data: ReasonExampleData): void
}>()

const selectedHighlight = ref<SelectedHighlight | null>(null)
const editableReason = ref('')
const isEditing = ref(false)

const displayReason = computed(() => {
  if (!selectedHighlight.value) {
    return 'Select text on the left to view its scoring rationale, or click here to enter one.'
  }

  if (isEditing.value) {
    return editableReason.value
  }

  const reason = selectedHighlight.value.reason || ''

  if (!reason) {
    return 'No reason information, click here to add a reason...'
  }

  return reason
})

const isCurrentReasonInExamples = computed(() => {
  const selected = selectedHighlight.value
  if (!selected || !editableReason.value.trim()) return false

  return props.reasonExamples.some(
    (example) =>
      example.questionId === props.currentQuestionId &&
      example.studentAnswer === selected.text &&
      example.highlightType === selected.type &&
      example.reason === editableReason.value.trim() &&
      (example.matchedReferenceAnswer || '') === (selected.matchedReferenceAnswer || ''),
  )
})

const handleHighlightClicked = (data: HighlightClickData) => {
  selectedHighlight.value = {
    text: data.text,
    type: data.type,
    reason: data.reason,
    matchedReferenceAnswer: data.matchedReferenceAnswer,
  }
}

watch(
  () => selectedHighlight.value,
  (newHighlight) => {
    if (newHighlight) {
      editableReason.value = newHighlight.reason || ''
      isEditing.value = false
    } else {
      editableReason.value = ''
      isEditing.value = false
    }
  },
  { immediate: true },
)

const enterEditMode = () => {
  if (!selectedHighlight.value || isCurrentReasonInExamples.value) {
    return
  }

  isEditing.value = true

  if (selectedHighlight.value) {
    emits('modifyReason', selectedHighlight.value)
  }
}

const autoSave = () => {
  if (!selectedHighlight.value) {
    isEditing.value = false
    return
  }

  const trimmedReason = editableReason.value.trim()
  isEditing.value = false

  selectedHighlight.value = {
    ...selectedHighlight.value,
    reason: trimmedReason,
  }

  emits('saveReason', {
    highlight: selectedHighlight.value,
    reason: trimmedReason,
  })
}

const toggleSubmitReason = () => {
  if (!editableReason.value.trim()) {
    Message.warning('Please enter reason content')
    return
  }

  if (selectedHighlight.value) {
    if (isCurrentReasonInExamples.value) {
      emits('cancelReasonExample', {
        text: selectedHighlight.value.text,
        type: selectedHighlight.value.type,
        reason: editableReason.value.trim(),
        matchedReferenceAnswer: selectedHighlight.value.matchedReferenceAnswer,
      })
    } else {
      emits('submitReasonExample', {
        text: selectedHighlight.value.text,
        type: selectedHighlight.value.type,
        reason: editableReason.value.trim(),
        matchedReferenceAnswer: selectedHighlight.value.matchedReferenceAnswer,
      })
    }
  }
}

const resetPanel = () => {
  selectedHighlight.value = null
  editableReason.value = ''
  isEditing.value = false
}

defineExpose({
  handleHighlightClicked,
  resetPanel,
})
</script>

<style scoped>
.feedback-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.feedback-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  background: #ffffff;
  overflow-y: auto;
  overflow-x: hidden;
}

.reason-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.reason-display {
  display: flex;
  flex-direction: column;
}

.example-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #ffd700 0%, #ffcc00 100%);
  color: #8b5a00;
  border-radius: 24px;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 500;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  border: 1px solid #e6c200;
}

.example-indicator .el-icon {
  font-size: 16px;
  color: #b8860b;
}

.reason-content-text {
  flex: 1;
  padding: 16px 0;
  line-height: 1.7;
  color: rgba(0, 0, 0, 0.6);
  font-size: 20px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: -0.01em;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 120px;
  cursor: pointer;
  overflow-y: auto;
}

.reason-content-text:hover {
  color: rgba(0, 0, 0, 0.8);
  background: rgba(0, 122, 255, 0.05);
  border-radius: 8px;
  padding: 16px 12px;
  margin: 0 -12px;
  transition: all 0.2s ease;
}

.reason-textarea {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 120px;
}

.reason-textarea :deep(.el-textarea) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.reason-textarea :deep(.el-textarea__inner) {
  border-radius: 24px;
  border: 1px solid #e5e5e5;
  background: #ffffff;
  transition: all 0.2s ease;
  line-height: 1.7;
  font-size: 17px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  flex: 1;
  resize: vertical;
  color: rgba(0, 0, 0, 0.87);
  min-height: 120px;
}

.reason-textarea :deep(.el-textarea__inner:focus) {
  border-color: #007aff;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

.reason-textarea :deep(.el-textarea__inner:hover) {
  border-color: #007aff;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px 24px;
  background: #ffffff;
  flex-shrink: 0;
  border-top: 1px solid #f0f0f0;
}

.action-buttons .el-button {
  padding: 12px 24px;
  border-radius: 24px;
  font-weight: 500;
  transition: all 0.2s ease;
  font-size: 16px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  min-height: 44px;
}

.action-buttons .el-button--primary {
  background: #007aff;
  border-color: #007aff;
  color: #ffffff;
}

.action-buttons .el-button--primary:hover:not(.is-disabled) {
  background: #0056b3;
  border-color: #0056b3;
  transform: translateY(-1px);
}

.action-buttons .el-button--default {
  background: #e5e5e5;
  border-color: #e5e5e5;
  color: rgba(0, 0, 0, 0.6);
}

.action-buttons .el-button--default:hover:not(.is-disabled) {
  background: #d1d1d1;
  border-color: #d1d1d1;
  transform: translateY(-1px);
}

.action-buttons .el-button--success {
  background: #4cd964;
  border-color: #4cd964;
  color: #ffffff;
}

.action-buttons .el-button--success:hover:not(.is-disabled) {
  background: #3ac85a;
  border-color: #3ac85a;
  transform: translateY(-1px);
}

.action-buttons .el-button--warning {
  background: #ff9500;
  border-color: #ff9500;
  color: #ffffff;
}

.action-buttons .el-button--warning:hover:not(.is-disabled) {
  background: #e6851a;
  border-color: #e6851a;
  transform: translateY(-1px);
}

.action-buttons .el-button:disabled {
  opacity: 0.4;
  transform: none !important;
}

.feedback-panel :deep(.el-tag) {
  border-radius: 24px;
  font-weight: 500;
  font-size: 12px;
}

.feedback-panel :deep(.el-tag--success) {
  background: rgba(76, 217, 100, 0.1);
  border-color: #4cd964;
  color: #4cd964;
}

.feedback-panel :deep(.el-tag--danger) {
  background: rgba(255, 59, 48, 0.1);
  border-color: #ff3b30;
  color: #ff3b30;
}

.feedback-panel :deep(.el-tag--warning) {
  background: rgba(255, 149, 0, 0.1);
  border-color: #ff9500;
  color: #ff9500;
}

.feedback-panel :deep(.el-tag--info) {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.3);
  color: rgba(0, 0, 0, 0.6);
}

@media (max-width: 768px) {
  .feedback-content {
    padding: 16px;
  }

  .action-buttons {
    flex-direction: column;
    padding: 16px 24px;
    gap: 12px;
  }

  .action-buttons .el-button {
    width: 100%;
    justify-content: center;
    padding: 12px 16px;
    min-height: 44px;
    font-size: 16px;
  }
}
</style>
