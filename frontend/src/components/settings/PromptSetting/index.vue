<template>
  <div class="page-container">
    <div class="page-row page-row--fixed">
      <div class="settings-card">
        <SystemSettingsCard :prompt-data="promptData" />
      </div>

      <div class="rules-card">
        <GradingRulesCard :prompt-data="promptData" />
      </div>
    </div>

    <div class="page-row page-row--fill">
      <div class="canvas-card">
        <CanvasCard />
      </div>

      <div class="examples-stack">
        <ReasonExamplesCard
          :reason-examples="reasonExamples"
          @view-example="viewReasonExample"
          @remove-example="cancelReasonExample"
        />

        <PaperExamplesCard
          :gold-paper-examples="goldPaperExamples"
          @view-example="viewPaperExample"
          @remove-example="cancelPaperExample"
        />
      </div>

      <div class="structure-card">
        <OutputFormatCard :prompt-data="promptData" />
      </div>
    </div>

    <div
      v-if="reasonDialogVisible"
      class="custom-dialog-overlay"
      @click="reasonDialogVisible = false"
    >
      <div v-if="selectedReasonExample" class="custom-dialog-content" @click.stop>
        <div class="apple-dialog-header">
          <h3>Reason Example Details</h3>
          <button @click="reasonDialogVisible = false" class="apple-close-btn">✕</button>
        </div>

        <div class="apple-dialog-body">
          <div class="apple-section">
            <div class="apple-section-title">Student Answer</div>
            <div class="apple-content-box">{{ selectedReasonExample.studentAnswer }}</div>
          </div>

          <div v-if="selectedReasonExample.matchedReferenceAnswer" class="apple-section">
            <div class="apple-section-title">Matched Reference Answer</div>
            <div
              class="apple-content-box apple-highlight-box"
              :class="`type-${selectedReasonExample.highlightType}`"
            >
              {{ selectedReasonExample.matchedReferenceAnswer }}
            </div>
          </div>

          <div class="apple-meta-row">
            <div class="apple-type-badge" :class="`type-${selectedReasonExample.highlightType}`">
              {{ selectedReasonExample.highlightType }}
            </div>
          </div>

          <div class="apple-section">
            <div class="apple-section-title">Scoring Reason</div>
            <div class="apple-content-box apple-reason-box">{{ selectedReasonExample.reason }}</div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="paperDialogVisible"
      class="custom-dialog-overlay"
      @click="paperDialogVisible = false"
    >
      <div v-if="selectedPaperExample" class="custom-paper-dialog-content" @click.stop>
        <div class="paper-dialog-header">
          <h3>Paper Example Details</h3>
          <button @click="paperDialogVisible = false" class="paper-close-btn">✕</button>
        </div>

        <div class="paper-dialog-body">
          <PaperViewer
            :student-id="selectedPaperExample.student_id"
            :question-id="selectedPaperExample.question_id"
            :exam-title="`Standard Paper Example`"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@/components/Message'
import { useFewShotManager } from '@/composables/useFewShotManager'
import { useExamDataStore } from '@/stores/useExamDataStore'
import type { GoldStandardExample, ReasonExample } from '@/types/exam'
import { ElMessageBox } from 'element-plus'
import 'element-plus/es/components/message-box/style/css'
import { computed, onMounted, ref } from 'vue'

import PaperViewer from '@/components/result/PaperViewer.vue'
import CanvasCard from './CanvasCard.vue'
import GradingRulesCard from './GradingRulesCard.vue'
import OutputFormatCard from './OutputFormatCard.vue'
import PaperExamplesCard from './PaperExamplesCard.vue'
import ReasonExamplesCard from './ReasonExamplesCard.vue'
import SystemSettingsCard from './SystemSettingsCard.vue'

import promptConfig from '@/config/prompt.json'
const promptData = promptConfig

const examDataStore = useExamDataStore()
const { removeReasonExample, removeGoldPaper } = useFewShotManager()

const reasonDialogVisible = ref(false)
const paperDialogVisible = ref(false)
const selectedReasonExample = ref<ReasonExample | null>(null)
const selectedPaperExample = ref<GoldStandardExample | null>(null)

const reasonExamples = computed(() => {
  return examDataStore.reasonExamples || []
})

const goldPaperExamples = computed(() => {
  return examDataStore.goldStandardExamples || []
})

const cancelReasonExample = async (example: ReasonExample) => {
  try {
    await ElMessageBox.confirm(
      'Remove this rationale from the few-shot prompt?',
      'Cancel Reason Example',
      {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning',
      },
    )

    const success = removeReasonExample({
      questionId: example.questionId,
      studentId: example.studentId,
      studentAnswer: example.studentAnswer,
      highlightType: example.highlightType,
      reason: example.reason,
      matchedReferenceAnswer: example.matchedReferenceAnswer,
    })

    if (success) {
      Message.success('Reason example cancelled successfully')
    } else {
      Message.error('Failed to cancel reason example')
    }
  } catch {}
}

const cancelPaperExample = async (example: GoldStandardExample) => {
  try {
    await ElMessageBox.confirm(
      `Remove student ${example.student_id}'s response from the gold-standard examples?`,
      'Cancel Gold Standard Paper',
      {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning',
      },
    )

    const success = removeGoldPaper(example.student_id, example.question_id)

    if (success) {
      Message.success('Gold standard paper cancelled successfully')
    } else {
      Message.error('Could not remove the gold-standard response')
    }
  } catch {}
}

const viewReasonExample = (example: ReasonExample) => {
  selectedReasonExample.value = example
  reasonDialogVisible.value = true
}

const viewPaperExample = (example: GoldStandardExample) => {
  selectedPaperExample.value = example
  paperDialogVisible.value = true
}

onMounted(() => {
  examDataStore.loadFromLocal()
})
</script>

<style scoped>
.page-row--fixed {
  min-height: 420px;
  align-items: stretch;
}

.settings-card {
  flex: 6;
  display: flex;
  overflow: visible;
}

.rules-card {
  flex: 4;
  display: flex;
  overflow: visible;
}

.canvas-card {
  flex: 3;
  display: flex;
  overflow: visible;
}

.examples-stack {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  overflow: visible;
}

.examples-stack > * {
  width: 100%;
  flex: 1;
}

.examples-stack .reason-examples-card > *,
.examples-stack .paper-examples-card > * {
  width: 100%;
  flex: 1;
}

.structure-card {
  flex: 4;
  display: flex;
  overflow: visible;
}

.apple-section {
  margin-bottom: var(--page-gap-large);
}

.apple-section:last-child {
  margin-bottom: 0;
}

.apple-section-title {
  font-size: 18px;
  font-weight: 600;
  color: #86868b;
  text-transform: none !important;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
}

.apple-content-box {
  background: #f5f5f7;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: var(--border-radius-small);
  padding: var(--page-gap-medium);
  line-height: 1.5;
  font-size: 20px;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
}

.apple-highlight-box {
  border-width: 1px;
  border-style: solid;
  position: relative;
  text-transform: none !important;
}

.apple-highlight-box::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 2px;
  background: currentColor;
}

.apple-reason-box {
  background: #f9f9f9;
  border: 1px solid rgba(0, 0, 0, 0.06);
  font-style: italic;
}

.apple-meta-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--page-gap-medium);
}

.apple-type-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px var(--page-gap-medium);
  border-radius: var(--border-radius-card);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  min-width: 80px;
  border: 1px solid;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

:global(.main-content--compact .page-row),
:global(.main-content--narrow .page-row) {
  flex: none;
  flex-direction: column;
}

:global(.main-content--compact .page-row--fixed),
:global(.main-content--narrow .page-row--fixed) {
  min-height: 0;
}

:global(.main-content--compact .settings-card),
:global(.main-content--compact .rules-card),
:global(.main-content--narrow .settings-card),
:global(.main-content--narrow .rules-card) {
  flex: none;
  width: 100%;
  min-height: 420px;
}

:global(.main-content--compact .canvas-card),
:global(.main-content--compact .examples-stack),
:global(.main-content--compact .structure-card),
:global(.main-content--narrow .canvas-card),
:global(.main-content--narrow .examples-stack),
:global(.main-content--narrow .structure-card) {
  flex: none;
  width: 100%;
  height: auto;
  min-height: 420px;
}

:global(.main-content--compact .examples-stack > *),
:global(.main-content--narrow .examples-stack > *) {
  min-height: 320px;
}

:global(.main-content--narrow .settings-card),
:global(.main-content--narrow .rules-card),
:global(.main-content--narrow .canvas-card),
:global(.main-content--narrow .structure-card) {
  min-height: 360px;
}
</style>
