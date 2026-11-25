<template>
  <div class="page-container grading-layout" :class="`grading-layout--${layout}`">
    <grading-header
      ref="gradingHeaderRef"
      class="hover"
      :current-question="currentQuestionId"
      :current-student-id="currentStudentId"
      :questions="examDataStore.questions"
      :student-list="examDataStore.studentList"
      :highlight-data-list="examDataStore.highlightDataList"
      :can-proceed="uploadStatusStore.canProceedToGrading"
      :is-confirmed="isCurrentPaperConfirmed"
      @question-change="handleQuestionChange"
      @student-change="handleStudentChange"
      @start-grading="startGrading"
      @batch-grading="startBatchGrading"
    />

    <div class="page-row question-row">
      <question-display
        class="grading-card question-card hover"
        :current-question="currentQuestionId"
        :questions="examDataStore.questions"
      />
      <scoring-section
        class="grading-card scoring-card hover"
        :is-gold-paper="isCurrentPaperGolden"
        :can-proceed="uploadStatusStore.canProceedToGrading"
        :is-confirmed="isCurrentPaperConfirmed"
        :has-grading-result="!!currentHighlightData"
        @save-as-golden-example="handleSaveAsGoldenExample"
        @remove-golden-example="handleRemoveGoldenExample"
        @confirm-result="handleConfirmResult"
        @cancel-confirm="handleCancelConfirm"
      />
    </div>

    <div class="page-row workspace-row">
      <div class="grading-card preview-card hover">
        <div class="panel-header">
          <el-icon class="panel-icon panel-icon--response"><EditPen /></el-icon>
          <h3>Student Response</h3>
        </div>
        <highlight-toolbar
          ref="highlightToolbarRef"
          :paper-preview-ref="paperPreviewRef"
          :highlight-data="currentHighlightData"
          :is-gold-paper="isCurrentPaperGolden"
          :reason-examples="currentQuestionReasonExamples"
          :current-question-id="currentQuestionId"
          :current-highlight="currentClickedHighlight"
          :llm-score="currentLLMScore"
          @update-highlight-data="handleHighlightDataUpdate"
          @enter-split-mode="handleEnterSplitMode"
          @update-score="handleUpdateScore"
        />
        <paper-preview
          ref="paperPreviewRef"
          :student-answer="currentStudentAnswer"
          :highlight-data="cleanedHighlightDataForPreview"
          @update-highlight-data="handleUpdateHighlightData"
          @highlight-clicked="handleHighlightClicked"
          @highlight-hovered="handleHighlightHovered"
          @highlight-hover-cleared="handleHighlightHoverCleared"
          @highlight-cleared="handleHighlightCleared"
        />
      </div>

      <div class="grading-card reference-card hover">
        <div class="panel-header">
          <el-icon class="panel-icon panel-icon--reference"><Notebook /></el-icon>
          <h3>Reference Answer</h3>
        </div>
        <reference-answer
          :reference-answer="currentReferenceAnswer"
          :highlight-data="currentHighlightData"
          :current-highlight="currentReferenceHighlight"
          @erase-reference-highlight="handleEraseReferenceHighlight"
          @set-reference-highlight="handleSetReferenceHighlight"
        />
      </div>

      <div class="grading-card feedback-card hover">
        <div class="panel-header">
          <el-icon class="panel-icon panel-icon--rationale"><ChatDotSquare /></el-icon>
          <h3>Scoring Rationale</h3>
        </div>
        <feedback-panel
          ref="feedbackPanelRef"
          :current-question-id="currentQuestionId"
          :reason-examples="currentQuestionReasonExamples"
          @modify-reason="handleModifyReason"
          @save-reason="handleSaveReason"
          @submit-reason-example="handleSubmitReasonExample"
          @cancel-reason-example="handleCancelReasonExample"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@/components/Message'
import { useContentLayout } from '@/composables/useContentLayout'
import { useCurrentGradingContext } from '@/composables/useCurrentGradingContext'
import { useExamDataStore, type HighlightData } from '@/stores/useExamDataStore'
import type { HighlightSelection, HighlightType, HighlightUpdate } from '@/types/exam'
import { getHighlightItem, getHighlightItemIndex } from '@/utils/highlightRanges'
import { ChatDotSquare, EditPen, Notebook } from '@element-plus/icons-vue'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import FeedbackPanel from './FeedbackPanel.vue'
import GradingHeader from './GradingHeader.vue'
import HighlightToolbar from './HighlightToolbar.vue'
import PaperPreview from './PaperPreview.vue'
import QuestionDisplay from './QuestionDisplay.vue'
import ReferenceAnswer from './ReferenceAnswer.vue'
import ScoringSection from './ScoringSection.vue'

import { useFewShotManager } from '@/composables/useFewShotManager'
import { type BatchMode, useGradingBusiness } from '@/composables/useGradingBusiness'
import { useHighlightDataOperations } from '@/composables/useHighlightDataOperations'
import { useUploadStatusStore } from '@/stores/useUploadStatusStore'
import { computeScoreFromReferences, sanitizeHighlightData } from '@/utils/highlightMetrics'

const examDataStore = useExamDataStore()
const layout = useContentLayout()
const uploadStatusStore = useUploadStatusStore()

const {
  executeSingleGrading,
  executeBatchGrading,
  generateReasonWithFeedback,
  saveReasonDirectly,
} = useGradingBusiness()

const { removeAnnotation, resetAllAnnotations } = useHighlightDataOperations()

const { addReasonExample, removeReasonExample, setGoldPaper, removeGoldPaper, isGoldPaper } =
  useFewShotManager()

const currentStudentId = ref<number>(1)
const currentQuestionId = ref<number>(1)
const isInModifyMode = ref<boolean>(false)

const {
  currentQuestion,
  currentReferenceAnswer,
  currentStudentAnswer,
  currentHighlightData,
  initializeIds,
} = useCurrentGradingContext(currentStudentId, currentQuestionId)

const currentReferenceHighlight = ref<HighlightSelection | null>(null)
const currentClickedHighlight = ref<HighlightSelection | null>(null)

const cleanedHighlightDataForPreview = computed(() => {
  const highlight = currentHighlightData.value
  if (!highlight) return null
  return sanitizeHighlightData(currentStudentAnswer.value, highlight, {
    referenceContent: currentReferenceAnswer.value,
  })
})

const recomputeScoreFromReferences = (data: HighlightData) => {
  return computeScoreFromReferences(data, {
    eachPoint: currentEachScoringPoint.value,
    maxScore: currentQuestion.value?.score ?? Infinity,
  })
}

const persistSanitizedHighlightData = () => {
  const hd = currentHighlightData.value
  const content = currentStudentAnswer.value
  if (!hd || !content) return
  const cleaned = sanitizeHighlightData(content, hd, {
    referenceContent: currentReferenceAnswer.value,
  })
  const originalCount = hd.answer.correct.length + hd.answer.wrong.length + hd.answer.unclear.length
  const cleanedCount =
    cleaned.answer.correct.length + cleaned.answer.wrong.length + cleaned.answer.unclear.length

  cleaned.total_score = recomputeScoreFromReferences(cleaned)

  if (cleanedCount !== originalCount || cleaned.total_score !== hd.total_score) {
    examDataStore.addHighlightData(cleaned)
    examDataStore.saveToLocal()
  }
}

watch(
  [
    () => currentHighlightData.value,
    () => currentStudentAnswer.value,
    () => currentReferenceAnswer.value,
  ],
  async ([hd, content]) => {
    if (!hd || !content) return
    await nextTick()
    persistSanitizedHighlightData()
  },
)

const currentLLMScore = computed(() => {
  return currentHighlightData.value?.total_score || 0
})

const handleUpdateScore = (value: number) => {
  const highlightData = currentHighlightData.value
  if (!highlightData) return
  const maxScore = currentQuestion.value?.score ?? Infinity
  const next = Math.max(0, Math.min(Number(value) || 0, maxScore))
  highlightData.total_score = next
  examDataStore.addHighlightData(highlightData)
  examDataStore.saveToLocal()
}

const currentEachScoringPoint = computed(() => {
  const referenceAnswer = examDataStore.getReferenceAnswer(currentQuestionId.value)
  return referenceAnswer?.eachScoringPoint || 1
})

const isCurrentPaperGolden = computed(() => {
  return isGoldPaper(currentStudentId.value, currentQuestionId.value)
})

const isCurrentPaperConfirmed = computed(() => {
  return examDataStore.isConfirmedPaper(currentStudentId.value, currentQuestionId.value)
})

const currentQuestionReasonExamples = computed(() => {
  return examDataStore.getReasonExamplesByQuestion(currentQuestionId.value)
})

const feedbackPanelRef = ref()
const paperPreviewRef = ref()
const highlightToolbarRef = ref()
const gradingHeaderRef = ref()

const isSelectionLocked = ref(false)
const handleStudentChange = (studentId: number) => {
  if (studentId === currentStudentId.value) return

  const studentExists = examDataStore.studentList.some((student) => student.id === studentId)

  if (!studentExists) {
    Message.warning(`Student ${studentId} not found`)
    return
  }

  currentReferenceHighlight.value = null

  nextTick(() => {
    currentStudentId.value = studentId

    feedbackPanelRef.value?.resetPanel()

    nextTick(() => {
      persistSanitizedHighlightData()
    })
  })
}

const handleQuestionChange = (question: { id: number; name: string; score: number }) => {
  if (question.id === currentQuestionId.value) return

  const questionExists = examDataStore.getQuestionById(question.id)

  if (!questionExists) {
    Message.warning(`Question ${question.id} not found`)
    return
  }

  currentReferenceHighlight.value = null

  nextTick(() => {
    currentQuestionId.value = question.id

    feedbackPanelRef.value?.resetPanel()
  })
}

const handleHighlightClicked = (data: HighlightSelection) => {
  currentReferenceHighlight.value = {
    text: data.text,
    type: data.type,
    reason: data.reason,
    occurrence: data.occurrence,
  }

  currentClickedHighlight.value = {
    text: data.text,
    type: data.type,
    reason: data.reason,
    occurrence: data.occurrence,
  }

  feedbackPanelRef.value?.handleHighlightClicked(data)

  isSelectionLocked.value = true
}

const handleHighlightHovered = (data: HighlightSelection) => {
  if (!data || isSelectionLocked.value) return
  currentReferenceHighlight.value = {
    text: data.text,
    type: data.type,
    reason: data.reason,
    occurrence: data.occurrence,
  }

  feedbackPanelRef.value?.handleHighlightClicked({
    text: data.text,
    type: data.type,
    reason: data.reason,
  })
}

const handleHighlightHoverCleared = () => {
  if (isSelectionLocked.value) return
  currentReferenceHighlight.value = null
  feedbackPanelRef.value?.resetPanel()
}

const handleHighlightCleared = () => {
  currentReferenceHighlight.value = null

  currentClickedHighlight.value = null

  feedbackPanelRef.value?.resetPanel()

  isSelectionLocked.value = false
}

const handleEraseReferenceHighlight = (data: {
  studentText: string
  type: 'correct' | 'wrong' | 'unclear'
  occurrence: number
}) => {
  if (!currentHighlightData.value) return

  const targetItem = getHighlightItem(
    currentHighlightData.value,
    data.type,
    data.studentText,
    data.occurrence,
  )

  if (targetItem) {
    targetItem['matched reference answer'] = ''
    currentHighlightData.value.total_score = recomputeScoreFromReferences(
      currentHighlightData.value,
    )
    examDataStore.addHighlightData(currentHighlightData.value)
    examDataStore.saveToLocal()
  }
}

const handleSetReferenceHighlight = (data: {
  studentText: string
  type: 'correct' | 'wrong' | 'unclear'
  occurrence: number
  referenceText: string
}) => {
  if (!currentHighlightData.value) return

  const targetItem = getHighlightItem(
    currentHighlightData.value,
    data.type,
    data.studentText,
    data.occurrence,
  )

  if (targetItem) {
    targetItem['matched reference answer'] = data.referenceText
    currentHighlightData.value.total_score = recomputeScoreFromReferences(
      currentHighlightData.value,
    )
    examDataStore.addHighlightData(currentHighlightData.value)
    examDataStore.saveToLocal()
  }
}

const handleUpdateHighlightData = (data: HighlightUpdate) => {
  if (data.operation === 'remove') {
    removeAnnotation(
      data.text,
      data.type,
      currentStudentId.value,
      currentQuestionId.value,
      data.occurrence,
    )

    if (
      currentReferenceHighlight.value &&
      currentReferenceHighlight.value.text === data.text &&
      currentReferenceHighlight.value.type === data.type
    ) {
      currentReferenceHighlight.value = null
    }

    feedbackPanelRef.value?.resetPanel()
    return
  }

  if (data.operation === 'add') {
    const targetType = data.type

    currentReferenceHighlight.value = {
      text: data.text,
      type: targetType,
      reason: data.reason || '',
      occurrence: 0,
    }

    if (isInModifyMode.value && data.reason) {
      saveReasonDirectly(
        data.text,
        targetType,
        data.reason,
        currentStudentId.value,
        currentQuestionId.value,
        feedbackPanelRef,
      )
      isInModifyMode.value = false
    } else {
      feedbackPanelRef.value?.handleHighlightClicked({
        text: data.text,
        type: targetType,
        reason: 'LLM is generating reason now...Please wait...',
      })

      generateReasonWithFeedback(
        data.text,
        targetType,
        currentStudentId.value,
        currentQuestionId.value,
        feedbackPanelRef,
      )
    }
    return
  }

  if (data.operation === 'reset') {
    resetAllAnnotations(currentStudentId.value, currentQuestionId.value)

    currentReferenceHighlight.value = null

    feedbackPanelRef.value?.resetPanel()
  }

  if (data.operation === 'split') {
    const highlightData = currentHighlightData.value
    if (!highlightData) return

    const typeArray = highlightData.answer[data.type]

    const originalIndex = getHighlightItemIndex(
      highlightData,
      data.type,
      data.text,
      data.occurrence,
    )
    if (originalIndex !== -1) {
      typeArray.splice(originalIndex, 1)
      typeArray.push(...data.newItems)
      highlightData.total_score = recomputeScoreFromReferences(highlightData)
      if (examDataStore.addHighlightData(highlightData)) examDataStore.saveToLocal()

      currentReferenceHighlight.value = null

      feedbackPanelRef.value?.resetPanel()
    }
  }
}

const startGrading = async () => {
  await executeSingleGrading(currentStudentId.value, currentQuestionId.value, gradingHeaderRef)
}

const startBatchGrading = async (batchMode: Exclude<BatchMode, number>) => {
  await executeBatchGrading(batchMode, currentQuestionId.value, gradingHeaderRef)
}

const handleModifyReason = () => {
  isInModifyMode.value = true
}

const handleSaveReason = (data: {
  highlight: { text: string; type: HighlightType }
  reason: string
}) => {
  saveReasonDirectly(
    data.highlight.text,
    data.highlight.type,
    data.reason,
    currentStudentId.value,
    currentQuestionId.value,
    feedbackPanelRef,
  )

  isInModifyMode.value = false

  Message.success('Reason saved')
}

const handleSubmitReasonExample = (data: {
  text: string
  type: HighlightType
  reason: string
  matchedReferenceAnswer?: string
}) => {
  addReasonExample({
    questionId: currentQuestionId.value,
    studentId: currentStudentId.value,
    studentAnswer: data.text,
    highlightType: data.type,
    reason: data.reason,
    matchedReferenceAnswer: data.matchedReferenceAnswer,
  })
  Message.success('Reason example added to library')
}

const handleCancelReasonExample = (data: {
  text: string
  type: HighlightType
  reason: string
  matchedReferenceAnswer?: string
}) => {
  const success = removeReasonExample({
    questionId: currentQuestionId.value,
    studentId: currentStudentId.value,
    studentAnswer: data.text,
    highlightType: data.type,
    reason: data.reason,
    matchedReferenceAnswer: data.matchedReferenceAnswer,
  })

  if (success) {
    Message.success('Reason example removed from library')
  } else {
    Message.error('Failed to remove reason example, please check data')
  }
}

const handleHighlightDataUpdate = (newHighlightData: HighlightData) => {
  newHighlightData.total_score = computeScoreFromReferences(newHighlightData, {
    eachPoint: currentEachScoringPoint.value,
    maxScore: currentQuestion.value?.score ?? Infinity,
  })

  examDataStore.addHighlightData(newHighlightData)

  currentReferenceHighlight.value = null

  feedbackPanelRef.value?.resetPanel()

  examDataStore.saveToLocal()
}

const handleEnterSplitMode = (data: Pick<HighlightSelection, 'text' | 'type' | 'occurrence'>) => {
  if (paperPreviewRef.value) {
    paperPreviewRef.value.enterSplitMode(data)
  }
}

const handleSaveAsGoldenExample = () => {
  const success = setGoldPaper(currentStudentId.value, currentQuestionId.value)

  if (success) {
    Message.success('Response saved as a gold standard and added to the example library')
  } else {
    Message.error('Could not save the gold standard; check the grading result')
  }
}

const handleRemoveGoldenExample = () => {
  const success = removeGoldPaper(currentStudentId.value, currentQuestionId.value)

  if (success) {
    Message.success('Gold standard removed from the example library')
  } else {
    Message.error('Could not remove the gold standard; check the grading result')
  }
}

const handleConfirmResult = () => {
  const success = examDataStore.confirmHighlightData(
    currentStudentId.value,
    currentQuestionId.value,
  )

  if (success) {
    examDataStore.saveToLocal()

    const currentIndex = examDataStore.studentList.findIndex(
      (student) => student.id === currentStudentId.value,
    )
    if (currentIndex !== -1 && currentIndex < examDataStore.studentList.length - 1) {
      const nextStudentId = examDataStore.studentList[currentIndex + 1].id
      handleStudentChange(nextStudentId)
    }
  } else {
    Message.error('Could not confirm the result; grade the response first')
  }
}

const handleCancelConfirm = () => {
  const success = examDataStore.unconfirmHighlightData(
    currentStudentId.value,
    currentQuestionId.value,
  )

  if (success) {
    examDataStore.saveToLocal()
    Message.success('Confirmation cancelled. Paper can now be re-graded.')
  } else {
    Message.error('Could not remove confirmation; check the grading result')
  }
}

onMounted(async () => {
  try {
    examDataStore.loadFromLocal()
    uploadStatusStore.loadFromLocal()
    initializeIds()
  } catch (error) {
    Message.error(
      'Initialization failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
    )
  }
})
</script>

<style scoped>
.grading-layout {
  gap: var(--space-4);
}

.grading-layout :deep(.page-row) {
  gap: var(--space-4);
}

/* Question prompt and the confirm / gold-standard actions. */
.question-row {
  align-items: stretch;
}

.question-card {
  flex: 1 1 0;
  width: auto;
  min-width: 0;
}

.scoring-card {
  flex: 0 0 auto;
  width: auto;
}

/* The three coordinated panels: student response, reference answer, scoring rationale. */
.workspace-row {
  display: flex;
  align-items: stretch;
}

.preview-card,
.reference-card,
.feedback-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.preview-card {
  flex: 9 1 0;
  container-type: inline-size;
  container-name: response-panel;
}

.reference-card,
.feedback-card {
  flex: 6 1 0;
}

.preview-card.hover:hover,
.reference-card.hover:hover,
.feedback-card.hover:hover {
  z-index: 10;
}

.preview-card :deep(.highlight-toolbar) {
  flex-shrink: 0;
}

.preview-card :deep(.paper-preview) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
  height: 46px;
  padding: 0 18px;
  background: #ffffff;
  border-bottom: 1px solid #eef0f3;
}

.panel-header h3 {
  margin: 0;
  color: #1d1d1f;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.panel-icon {
  font-size: 16px;
}

.panel-icon--response {
  color: #007aff;
}

.panel-icon--reference {
  color: #2fb84f;
}

.panel-icon--rationale {
  color: #8e5cf7;
}

.reference-card :deep(.reference-answer),
.feedback-card :deep(.feedback-panel) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Wide: a fixed-height workspace that fits the window; each panel scrolls on its own. */
.grading-layout--wide {
  height: calc(100vh - var(--app-header-height));
  min-height: 640px;
}

.grading-layout--wide .workspace-row {
  flex: 1;
  min-height: 0;
}

/* Compact: the response spans the full width; reference and rationale sit side by side. */
.grading-layout--compact .workspace-row,
.grading-layout--narrow .workspace-row {
  flex-wrap: wrap;
}

.grading-layout--compact .preview-card,
.grading-layout--narrow .preview-card {
  flex: 1 1 100%;
  min-height: 320px;
}

.grading-layout--compact .reference-card,
.grading-layout--compact .feedback-card {
  flex: 1 1 0;
  min-height: 320px;
}

/* Narrow: everything stacks in reading order. */
.grading-layout--narrow .question-row {
  flex-direction: column;
}

.grading-layout--narrow .question-card,
.grading-layout--narrow .scoring-card {
  flex: 0 0 auto;
  width: 100%;
}

.grading-layout--narrow .reference-card,
.grading-layout--narrow .feedback-card {
  flex: 1 1 100%;
}

.grading-layout--narrow .reference-card {
  order: 3;
  min-height: 200px;
}

/* Directly under the response, so tapping a highlight shows its rationale right below it. */
.grading-layout--narrow .feedback-card {
  order: 2;
  min-height: 220px;
}

.grading-layout--narrow .reference-card :deep(.reference-answer),
.grading-layout--narrow .feedback-card :deep(.feedback-panel) {
  overflow: visible;
}
</style>
