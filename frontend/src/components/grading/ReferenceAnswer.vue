<template>
  <div class="reference-answer">
    <div
      ref="contentRef"
      class="reference-content"
      v-html="highlightedContent"
      @mouseup="handleTextSelection"
      @click="handleContentClick"
    ></div>

    <div v-if="showActionButton" class="action-button-container">
      <el-button
        v-if="currentButtonType === 'erase'"
        type="danger"
        size="small"
        @click="handleErase"
        class="action-button erase-button"
      >
        <el-icon><Delete /></el-icon>
        Erase
      </el-button>

      <el-button
        v-if="currentButtonType === 'set'"
        type="primary"
        size="small"
        @click="handleSet"
        class="action-button set-button"
      >
        <el-icon><Check /></el-icon>
        Set
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@/components/Message'
import { getHighlightItem } from '@/utils/highlightRanges'
import {
  generateReferenceHighlightedHTML,
  type HighlightData,
  type HighlightType,
} from '@/utils/highlightUtils'
import { Check, Delete } from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'

interface Props {
  referenceAnswer?: string
  highlightData?: HighlightData | null
  readOnly?: boolean
  showLabels?: boolean
  currentHighlight?: {
    text: string
    type: HighlightType
    reason: string
    occurrence: number
  } | null
}

const props = withDefaults(defineProps<Props>(), {
  referenceAnswer: '',
  highlightData: null,
  currentHighlight: null,
  showLabels: true,
})

const emits = defineEmits<{
  (
    e: 'eraseReferenceHighlight',
    data: {
      studentText: string
      type: HighlightType
      occurrence: number
    },
  ): void
  (
    e: 'setReferenceHighlight',
    data: {
      studentText: string
      type: HighlightType
      occurrence: number
      referenceText: string
    },
  ): void
}>()

const selectedText = ref('')
const contentRef = ref<HTMLElement | null>(null)

const highlightedContent = computed(() => {
  return generateReferenceHighlightedHTML(
    props.referenceAnswer,
    props.highlightData,
    props.currentHighlight,
    props.showLabels,
  )
})

const showActionButton = computed(() => {
  if (props.readOnly) return false
  const hasCurrentHighlight = !!props.currentHighlight
  const hasReference = hasExistingReferenceAnswer.value
  return hasCurrentHighlight && (hasReference || (!!selectedText.value && !hasReference))
})

const currentButtonType = computed(() => {
  if (!props.currentHighlight) return null
  if (hasExistingReferenceAnswer.value) return 'erase'
  return selectedText.value ? 'set' : null
})

const hasExistingReferenceAnswer = computed(() => {
  const current = props.currentHighlight
  if (!current || !props.highlightData) return false

  const item = getHighlightItem(props.highlightData, current.type, current.text, current.occurrence)
  return !!item?.['matched reference answer']
})

const handleContentClick = (event: Event) => {
  if (!(event.target instanceof HTMLElement)) return
  const target = event.target

  if (!target.classList.contains('reference-highlight')) {
    setTimeout(() => {
      const selection = window.getSelection()
      if (!selection || !selection.toString().trim()) {
        selectedText.value = ''
      }
    }, 0)
  }
}

const handleTextSelection = () => {
  if (props.readOnly) return
  const selection = window.getSelection()
  if (selection && selection.toString().trim()) {
    const selected = selection.toString().trim()
    selectedText.value = selected
  } else {
    selectedText.value = ''
  }
}

const handleErase = () => {
  if (props.currentHighlight) {
    emits('eraseReferenceHighlight', {
      studentText: props.currentHighlight.text,
      type: props.currentHighlight.type,
      occurrence: props.currentHighlight.occurrence,
    })

    Message.success('Reference answer association erased')
  }
}

const handleSet = () => {
  if (!selectedText.value || !props.currentHighlight) return

  emits('setReferenceHighlight', {
    studentText: props.currentHighlight.text,
    type: props.currentHighlight.type,
    occurrence: props.currentHighlight.occurrence,
    referenceText: selectedText.value,
  })
  clearTextSelection()
  Message.success('Reference answer association set')
}

const clearTextSelection = () => {
  window.getSelection()?.removeAllRanges()
  selectedText.value = ''
}

watch(
  () => props.currentHighlight,
  (newHighlight, oldHighlight) => {
    if (oldHighlight?.text !== newHighlight?.text) {
      selectedText.value = ''

      clearTextSelection()
    }

    if (!newHighlight && selectedText.value) {
      selectedText.value = ''
      clearTextSelection()
    }

    if (props.readOnly && contentRef.value) {
      const content = contentRef.value
      const highlight = content.querySelector('.reference-highlight')?.getBoundingClientRect()
      const viewport = content.getBoundingClientRect()
      if (highlight && (highlight.top < viewport.top || highlight.bottom > viewport.bottom)) {
        content.scrollTop += highlight.top - viewport.top - 12
      }
    }
  },
  { deep: true, flush: 'post' },
)
</script>

<style scoped>
.reference-answer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.reference-content {
  flex: 1;
  min-height: 0;
  padding: 18px 20px;
  white-space: pre-wrap;
  line-height: 1.7;
  color: rgba(0, 0, 0, 0.87);
  font-size: 16px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: -0.01em;
  word-break: break-word;
  background: #ffffff;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 200px;
}

.reference-content :deep(.reference-highlight) {
  display: inline;
  font-weight: 500;
}

.reference-content :deep(.reference-highlight.highlight-correct) {
  background-color: rgba(212, 237, 218, 1) !important;
  border-left-color: rgba(40, 167, 69, 1) !important;
}

.reference-content :deep(.reference-highlight.highlight-wrong) {
  background-color: rgba(248, 215, 218, 1) !important;
  border-left-color: rgba(220, 53, 69, 1) !important;
}

.reference-content :deep(.reference-highlight.highlight-unclear) {
  background-color: rgba(255, 243, 205, 1) !important;
  border-left-color: rgba(255, 193, 7, 1) !important;
}

.action-button-container {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.action-button {
  border-radius: 20px !important;
  font-weight: 500 !important;
  font-size: 14px !important;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif !important;
  padding: 8px 16px !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
}

.erase-button {
  background: rgba(255, 59, 48, 0.9) !important;
  color: white !important;
}

.erase-button:hover {
  background: rgba(255, 69, 58, 1) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 16px rgba(255, 59, 48, 0.3) !important;
}

.set-button {
  background: rgba(0, 122, 255, 0.9) !important;
  color: white !important;
}

.set-button:hover {
  background: rgba(10, 132, 255, 1) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 16px rgba(0, 122, 255, 0.3) !important;
}

.action-button .el-icon {
  margin-right: 4px !important;
  font-size: 14px !important;
}

@media (max-width: 760px) {
  .reference-content {
    padding: 16px;
    font-size: 16px;
  }

  .action-button-container {
    top: 12px;
    right: 12px;
  }

  .action-button {
    padding: 6px 12px !important;
    font-size: 13px !important;
  }
}

@media (max-width: 480px) {
  .reference-content {
    padding: 14px 16px;
    font-size: 16px;
  }

  .action-button-container {
    top: 8px;
    right: 8px;
  }

  .action-button {
    padding: 5px 10px !important;
    font-size: 12px !important;
  }
}
</style>
