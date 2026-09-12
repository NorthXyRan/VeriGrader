<template>
  <div class="paper-preview" @mouseup="handleTextSelection">
    <div
      ref="contentRef"
      :class="['preview-content', { 'has-focused-highlight': clickedHighlight }]"
      v-html="highlightedContent"
      @click="handleHighlightClick"
      @mouseover="handleHighlightMouseover"
      @mouseout="handleHighlightMouseout"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@/components/Message'
import type { HighlightSelection, HighlightUpdate } from '@/types/exam'
import {
  generateHighlightedHTML,
  parseHighlightElement,
  type HighlightData,
  type HighlightType,
} from '@/utils/highlightUtils'
import { getHighlightItem } from '@/utils/highlightRanges'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  studentAnswer?: string
  highlightData?: HighlightData | null
}

const props = withDefaults(defineProps<Props>(), {
  studentAnswer: '',
  highlightData: null,
})

const emits = defineEmits<{
  (e: 'highlightClicked', data: HighlightSelection): void
  (e: 'highlightCleared'): void
  (e: 'highlightHovered', data: HighlightSelection): void
  (e: 'highlightHoverCleared'): void
  (e: 'updateHighlightData', data: HighlightUpdate): void
}>()

const contentRef = ref<HTMLElement | null>(null)
const hasSelectedText = ref(false)
const selectedText = ref('')

const clickedHighlight = ref<{ text: string; type: HighlightType; occurrence: number } | null>(null)

const selectionJustSet = ref(false)

const splitMode = ref({
  active: false,
  targetHighlight: null as { text: string; type: HighlightType; occurrence: number } | null,
})

const highlightedContent = computed(() => {
  return generateHighlightedHTML(props.studentAnswer, props.highlightData)
})

const handleHighlightClick = (event: MouseEvent) => {
  if (!(event.target instanceof HTMLElement)) return
  const target = event.target
  const highlightData = parseHighlightElement(target, props.highlightData)

  if (highlightData) {
    event.stopPropagation()

    if (splitMode.value.active && splitMode.value.targetHighlight) {
      handleSplitClick(event, target, highlightData)
      return
    }

    clearFocusedHighlight()
    clearHoverHighlight()

    const container = contentRef.value
    if (container) {
      container.classList.add('has-focused-highlight')
    }

    target.classList.add('focused-highlight')

    clickedHighlight.value = {
      text: highlightData.text,
      type: highlightData.type,
      occurrence: highlightData.occurrenceIndex ?? 0,
    }

    hasSelectedText.value = true
    selectedText.value = highlightData.text

    emits('highlightClicked', {
      text: highlightData.text,
      type: highlightData.type,
      reason: highlightData.reason,
      matchedReferenceAnswer: highlightData.matchedReferenceAnswer,
      occurrence: highlightData.occurrenceIndex ?? 0,
    })
  } else {
    if (selectionJustSet.value) {
      selectionJustSet.value = false
      return
    }

    if (clickedHighlight.value || hasSelectedText.value) {
      clearSelection()
      clearFocusedHighlight()
      clearHoverHighlight()
      emits('highlightCleared')
    }
  }
}

const handleHighlightMouseover = (event: MouseEvent) => {
  if (!(event.target instanceof HTMLElement)) return
  const target = event.target
  const highlightData = parseHighlightElement(target, props.highlightData)

  if (highlightData) {
    if (!clickedHighlight.value) {
      clearHoverHighlight()

      const container = contentRef.value
      if (container) {
        container.classList.add('has-hover-highlight')
      }

      target.classList.add('hover-highlight')
    }

    emits('highlightHovered', {
      text: highlightData.text,
      type: highlightData.type,
      reason: highlightData.reason,
      matchedReferenceAnswer: highlightData.matchedReferenceAnswer,
      occurrence: highlightData.occurrenceIndex ?? 0,
    })
  }
}

const handleHighlightMouseout = (event: MouseEvent) => {
  if (!(event.target instanceof HTMLElement)) return
  const target = event.target
  if (!target.classList.contains('text-highlight')) return

  if (!clickedHighlight.value) {
    clearHoverHighlight()
  }

  emits('highlightHoverCleared')
}

const handleTextSelection = () => {
  const selection = window.getSelection()
  if (selection && selection.toString().trim()) {
    selectedText.value = selection.toString().trim()
    hasSelectedText.value = true
    selectionJustSet.value = true

    clickedHighlight.value = null
    clearFocusedHighlight()
  } else {
    hasSelectedText.value = false
    selectedText.value = ''
    selectionJustSet.value = false

    if (!clickedHighlight.value) {
      clickedHighlight.value = null
    }
  }
}

const markAnswer = (type: HighlightType) => {
  if (!props.highlightData) {
    Message.warning('Please perform AI grading first before teacher annotation')
    return
  }

  if (!selectedText.value && !clickedHighlight.value) {
    Message.warning('Please select text to mark first')
    return
  }

  const text = selectedText.value || clickedHighlight.value?.text || ''

  emits('updateHighlightData', {
    operation: 'add',
    text,
    type,
  })

  clearSelection()
  clearFocusedHighlight()
}

const eraseHighlightedText = () => {
  if (!props.highlightData) {
    Message.warning('No grading data to clear')
    return
  }

  if (!clickedHighlight.value) {
    Message.warning('Please click the highlighted text to clear first')
    return
  }

  emits('updateHighlightData', {
    operation: 'remove',
    text: clickedHighlight.value.text,
    type: clickedHighlight.value.type,
    occurrence: clickedHighlight.value.occurrence,
  })

  clickedHighlight.value = null
  clearSelection()
  clearFocusedHighlight()
}

const clearAllMarks = () => {
  if (!props.highlightData) {
    Message.warning('No grading data to reset')
    return
  }

  emits('updateHighlightData', {
    operation: 'reset',
  })
  clickedHighlight.value = null
  clearSelection()
  clearFocusedHighlight()
}

const clearSelection = () => {
  window.getSelection()?.removeAllRanges()
  hasSelectedText.value = false
  selectedText.value = ''
  clickedHighlight.value = null
}

const enterSplitMode = (data: { text: string; type: HighlightType; occurrence: number }) => {
  splitMode.value.active = true
  splitMode.value.targetHighlight = {
    text: data.text,
    type: data.type,
    occurrence: data.occurrence,
  }

  const container = contentRef.value
  if (container) {
    container.classList.add('split-mode')
  }
}

const exitSplitMode = () => {
  splitMode.value.active = false
  splitMode.value.targetHighlight = null

  const container = contentRef.value
  if (container) {
    container.classList.remove('split-mode')
  }
}

const handleSplitClick = (
  event: MouseEvent,
  target: HTMLElement,
  highlightData: NonNullable<ReturnType<typeof parseHighlightElement>>,
) => {
  const targetHighlight = splitMode.value.targetHighlight
  if (!targetHighlight || !props.highlightData) {
    return
  }

  if (
    highlightData.text !== targetHighlight.text ||
    highlightData.type !== targetHighlight.type ||
    (highlightData.occurrenceIndex ?? 0) !== targetHighlight.occurrence
  ) {
    Message.warning('Please click on the selected highlight to split it')
    return
  }

  try {
    const clickPosition = getClickPositionInHighlight(event, target)
    if (clickPosition <= 0 || clickPosition >= highlightData.text.length) {
      Message.warning('Please click inside the highlight text')
      return
    }

    const { beforeText, afterText } = splitTextAtPosition(highlightData.text, clickPosition)

    if (beforeText.length < 3 || afterText.length < 3) {
      Message.warning('Split segments are too short (minimum 3 characters)')
      return
    }

    executeSplit(highlightData, beforeText, afterText)
  } catch (error) {
    Message.error('Split operation failed. Please try again.')
    exitSplitMode()
  }
}

const getClickPositionInHighlight = (event: MouseEvent, highlightElement: HTMLElement): number => {
  const range = document.caretRangeFromPoint(event.clientX, event.clientY)

  if (!range || !range.startContainer) {
    return 0
  }

  const highlightText = highlightElement.textContent || ''

  let offset = range.startOffset

  let currentNode: Node | null = range.startContainer
  while (currentNode && currentNode !== highlightElement) {
    if (currentNode.previousSibling) {
      const prevText = currentNode.previousSibling.textContent || ''
      offset += prevText.length
    }
    currentNode = currentNode.parentNode
  }

  return Math.max(0, Math.min(offset, highlightText.length))
}

const splitTextAtPosition = (
  text: string,
  position: number,
): { beforeText: string; afterText: string } => {
  const adjustedPosition = findNearestWordBoundary(text, position)

  return {
    beforeText: text.substring(0, adjustedPosition).trim(),
    afterText: text.substring(adjustedPosition).trim(),
  }
}

const findNearestWordBoundary = (text: string, position: number): number => {
  if (position === 0 || position === text.length || /\s/.test(text[position])) {
    return position
  }

  let leftBoundary = position
  while (leftBoundary > 0 && !/\s/.test(text[leftBoundary - 1])) {
    leftBoundary--
  }

  let rightBoundary = position
  while (rightBoundary < text.length && !/\s/.test(text[rightBoundary])) {
    rightBoundary++
  }

  const leftDistance = position - leftBoundary
  const rightDistance = rightBoundary - position

  return leftDistance <= rightDistance ? leftBoundary : rightBoundary
}

const executeSplit = (
  originalHighlight: NonNullable<ReturnType<typeof parseHighlightElement>>,
  beforeText: string,
  afterText: string,
) => {
  if (!props.highlightData) return

  const originalItem = getHighlightItem(
    props.highlightData,
    originalHighlight.type,
    originalHighlight.text,
    originalHighlight.occurrenceIndex,
  )

  if (!originalItem) {
    Message.error('Original highlight not found')
    return
  }

  const newItems = [
    {
      'Student answer': beforeText,
      'matched reference answer': '',
      reason: '',
    },
    {
      'Student answer': afterText,
      'matched reference answer': '',
      reason: '',
    },
  ]

  emits('updateHighlightData', {
    operation: 'split',
    type: originalHighlight.type,
    text: originalHighlight.text,
    occurrence: originalHighlight.occurrenceIndex,
    newItems,
  })

  exitSplitMode()

  clearSelection()
  clearFocusedHighlight()
  emits('highlightCleared')

  Message.success(`Highlight split into 2 parts`)
}

const clearFocusedHighlight = () => {
  const container = contentRef.value
  if (container) {
    container.classList.remove('has-focused-highlight')
  }

  const focusedElements = container?.querySelectorAll('.text-highlight.focused-highlight') ?? []
  focusedElements.forEach((el) => {
    el.classList.remove('focused-highlight')
  })
}

const clearHoverHighlight = () => {
  const container = contentRef.value
  if (container) {
    container.classList.remove('has-hover-highlight')
  }

  const hoverElements = container?.querySelectorAll('.text-highlight.hover-highlight') ?? []
  hoverElements.forEach((el) => {
    el.classList.remove('hover-highlight')
  })
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && splitMode.value.active) {
    exitSplitMode()
    Message.info('Split mode cancelled')
    event.preventDefault()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

watch(
  () => props.studentAnswer,
  () => {
    clearSelection()
    clearFocusedHighlight()
    clearHoverHighlight()
    clickedHighlight.value = null

    if (splitMode.value.active) {
      exitSplitMode()
    }
  },
)

watch(
  () => props.highlightData,
  () => {
    clickedHighlight.value = null
    clearFocusedHighlight()
    clearHoverHighlight()

    if (splitMode.value.active) {
      exitSplitMode()
    }
  },
)

defineExpose({
  markAnswer,
  eraseHighlightedText,
  clearAllMarks,
  getHasSelectedText: () => hasSelectedText.value || !!clickedHighlight.value,
  enterSplitMode,
  exitSplitMode,
})
</script>

<style scoped>
.paper-preview {
  width: 100%;
  height: 100%;
  padding: 0;
  user-select: text;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-content {
  flex: 1;
  min-height: 0;
  padding: 20px 24px;
  white-space: pre-wrap;
  line-height: 1.7;
  color: rgba(0, 0, 0, 0.87);
  font-size: 20px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: -0.01em;
  background: #ffffff;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 200px;

  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

::selection {
  background-color: rgba(64, 158, 255, 0.2);
  color: #2c3e50;
}

::-moz-selection {
  background-color: rgba(64, 158, 255, 0.2);
  color: #2c3e50;
}

@media (max-width: 768px) {
  .preview-content {
    padding: 24px;
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .preview-content {
    padding: 16px;
    font-size: 15px;
  }
}

.preview-content.has-focused-highlight :deep(.text-highlight:not(.focused-highlight)) {
  opacity: 0.3;
  transform: scale(0.98);
  transition: all 0.3s ease;
}

.preview-content.has-hover-highlight:not(.has-focused-highlight)
  :deep(.text-highlight:not(.hover-highlight)) {
  opacity: 0.3;
  transform: scale(0.98);
  transition: all 0.3s ease;
}

.preview-content.has-focused-highlight :deep(.text-highlight.focused-highlight) {
  opacity: 1;
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 999;
  position: relative;
}

.preview-content.has-hover-highlight:not(.has-focused-highlight)
  :deep(.text-highlight.hover-highlight) {
  opacity: 1;
  transform: scale(1.01);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 998;
  position: relative;
}

.preview-content.split-mode {
  cursor: crosshair;
}

.preview-content.split-mode :deep(.text-highlight) {
  cursor: crosshair;
  transition: all 0.2s ease;
}

.preview-content.split-mode :deep(.text-highlight:hover) {
  transform: scale(1.01);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style>
