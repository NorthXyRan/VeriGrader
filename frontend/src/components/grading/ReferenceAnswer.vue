<template>
  <div class="reference-answer">
    <div
    class="reference-content"
    v-html="highlightedContent"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch} from 'vue'
import { highlightReferenceText, extractReferenceSegmentFromReason, type HighlightType } from '@/utils/highlightUtils'
interface Props {
  referenceAnswer?: string
  currentHighlight?: {
    text: string
    type: HighlightType
    reason: string
  } | null
}

const props = withDefaults(defineProps<Props>(), {
  referenceAnswer: '',
  currentHightlight: null
})

//计算高亮后的参考答案
const highlightedContent = computed(() => {
  if (!props.currentHighlight || !props.referenceAnswer) {
    // 没有高亮数据时，直接转义显示原文本
    const div = document.createElement('div')
    div.textContent = props.referenceAnswer || ''
    return div.innerHTML
  }

  // 从reason中提取参考答案对应文本
  const referenceText = extractReferenceSegmentFromReason(props.currentHighlight.reason)

  if (!referenceText) {
    // 无法提取对应文本时，显示原文本
    const div = document.createElement('div')
    div.textContent = props.referenceAnswer || ''
    return div.innerHTML
  }

  // 高亮对应文本
  return highlightReferenceText(
    props.referenceAnswer,
    referenceText,
    props.currentHighlight.type
  )
})

// 监听高亮变化，添加一些调试信息
watch(() => props.currentHighlight, (newHighlight) => {
  if (newHighlight) {
    console.log('Reference Answer 高亮更新:', {
      studentText: newHighlight.text.substring(0, 30) + '...',
      type: newHighlight.type,
      extractedRefText: extractReferenceSegmentFromReason(newHighlight.reason)
    })
  }
}, { deep: true })
</script>

<style scoped>
/* === 参考答案组件样式 === */
.reference-answer {
  flex: 1;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* 内容容器，提供实际的内边距 */
.reference-content {
  padding: 20px;
  flex: 1;
  min-height: 0;
  white-space: pre-wrap;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.87);
  font-size: 14px;
  word-break: break-word;
}

/* 参考答案高亮样式 */
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

.reference-content :deep(.reference-highlight.highlight-redundant) {
  background-color: rgba(209, 236, 241, 1) !important;
  border-left-color: rgba(23, 162, 184, 1) !important;
}

/* === 响应式调整 === */
@media (max-width: 768px) {
  .reference-content {
    padding: 15px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .reference-content {
    padding: 12px;
    font-size: 12px;
  }
}
</style>
