<template>
  <div class="paper-preview" @mouseup="handleTextSelection">
    <div 
      class="preview-content" 
      v-html="highlightedContent"
      @click="handleHighlightClick"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, ref, watch } from 'vue'
import {
  generateHighlightedHTML,
  parseHighlightElement,
  HIGHLIGHT_CONFIG,
  type HighlightData,
  type HighlightType
} from '@/utils/highlightUtils'
import { logger } from '@/utils/logger'

interface Props {
  studentAnswer?: string
  highlightData?: HighlightData | null
}

const props = withDefaults(defineProps<Props>(), {
  studentAnswer: '',
  highlightData: null
})

const emits = defineEmits<{
  (e: 'highlightClicked', data: {
    text: string
    type: HighlightType
    reason: string
    scoringPoint: number
  }): void
  (e: 'updateHighlightData', data: {
    operation: 'add' | 'remove' | 'reset'
    text?: string
    type?: HighlightType
    reason?: string
    scoringPoint?: number
  }): void
}>()

// === 内部状态管理 ===
const hasSelectedText = ref(false)
const selectedText = ref('')
// 当前点击的高亮数据
const clickedHighlight = ref<{ text: string; type: HighlightType } | null>(null)

// === 计算属性 ===
const highlightedContent = computed(() => {
  return generateHighlightedHTML(
    props.studentAnswer,
    props.highlightData
  )
})

// === 事件处理 ===
const handleHighlightClick = (event: Event) => {
  const target = event.target as HTMLElement
  const highlightData = parseHighlightElement(target, props.highlightData)
  
  if (highlightData) {
    event.stopPropagation()
    const config = HIGHLIGHT_CONFIG[highlightData.type]
    
    // 记录点击的高亮数据
    clickedHighlight.value = {
      text: highlightData.text,
      type: highlightData.type
    }
    
    logger.info('点击高亮', {
      text: highlightData.text,
      type: highlightData.type,
      reason: highlightData.reason.substring(0, 50) + '...',
      reasonLength: highlightData.reason.length
    })
    
    emits('highlightClicked', highlightData)
    // Highlight clicked, no message needed
  }
}

const handleTextSelection = () => {
  const selection = window.getSelection()
  if (selection && selection.toString().trim()) {
    selectedText.value = selection.toString().trim()
    hasSelectedText.value = true
  } else {
    hasSelectedText.value = false
    selectedText.value = ''
  }
}

// === 标记功能 ===
const markAnswer = (type: HighlightType) => {
  // 检查是否有HighlightData
  if (!props.highlightData) {
    ElMessage.warning('Please perform AI grading first before teacher annotation')
    return
  }
  
  if (!selectedText.value) {
    ElMessage.warning('Please select text to mark first')
    return
  }
  
  const config = HIGHLIGHT_CONFIG[type]
  const text = selectedText.value
  
  logger.info('教师标注', {
    text: text,
    type: type,
    operation: '添加到HighlightData'
  })
  
  // 发送更新事件给父组件，不传递reason让系统自动生成
  emits('updateHighlightData', {
    operation: 'add',
    text: text,
    type: type,
    // reason: 不传递reason，让LLM自动生成
    scoringPoint: 0 // 教师标注默认0分
  })
  
  // Message removed to avoid noise
  clearSelection()
}

// === 清除功能 ===
const eraseHighlightedText = () => {
  // 检查是否有HighlightData
  if (!props.highlightData) {
    ElMessage.warning('No grading data to clear')
    return
  }
  
  if (!clickedHighlight.value) {
    ElMessage.warning('Please click the highlighted text to clear first')
    return
  }
  
  logger.info('清除标注', {
    text: clickedHighlight.value.text,
    type: clickedHighlight.value.type,
    operation: '从HighlightData移除'
  })
  
  // 发送移除事件给父组件
  emits('updateHighlightData', {
    operation: 'remove',
    text: clickedHighlight.value.text,
    type: clickedHighlight.value.type
  })
  
  // Clear action completed silently
  
  // 清空状态
  clickedHighlight.value = null
  clearSelection()
}

const clearAllMarks = () => {
  // 检查是否有HighlightData
  if (!props.highlightData) {
    ElMessage.warning('No grading data to reset')
    return
  }
  
  logger.info('重置所有标注', { operation: '清除整个学生的HighlightData' })
  
  // 发送重置事件给父组件
  emits('updateHighlightData', {
    operation: 'reset'
  })
  
  ElMessage.success('All marks cleared')
  clickedHighlight.value = null
  clearSelection()
}

const clearSelection = () => {
  window.getSelection()?.removeAllRanges()
  hasSelectedText.value = false
  selectedText.value = ''
}

// === 监听器 ===
watch(() => props.studentAnswer, () => {
  clearSelection()
  clickedHighlight.value = null
})

watch(() => props.highlightData, () => {
  clickedHighlight.value = null
})

// === 暴露核心方法 ===
defineExpose({
  markAnswer,
  eraseHighlightedText,
  clearAllMarks,
  getHasSelectedText: () => hasSelectedText.value
})
</script>

<style scoped>
/* === 试卷预览容器 === */
.paper-preview {
  flex: 1;
  padding: 0;
  user-select: text;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* 内容容器 */
.preview-content {
  padding: 20px;
  flex: 1;
  min-height: 0;
  white-space: pre-wrap;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.87);
  font-size: 14px;
}

/* === 文本选择样式 === */
::selection {
  background-color: #409eff;
  color: white;
}

::-moz-selection {
  background-color: #409eff;
  color: white;
}

/* === 响应式设计 === */
@media (max-width: 768px) {
  .preview-content {
    padding: 15px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .preview-content {
    padding: 12px;
    font-size: 12px;
  }
}
</style>