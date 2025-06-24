<template>
  <div class="highlight-toolbar">
    <div class="tool-section">
      <div class="tool-group">
        <!-- 正确 -->
        <el-button
          type="success"
          @click="() => handleMarkAnswer('correct')"
          :disabled="!hasSelectedText || !props.highlightData"
        >
          <el-icon><Check /></el-icon>
          correct
        </el-button>
        <!-- 错误 -->
        <el-button
          type="danger"
          @click="() => handleMarkAnswer('wrong')"
          :disabled="!hasSelectedText || !props.highlightData"
        >
          <el-icon><Close /></el-icon>
          wrong
        </el-button>
        <!-- 模糊 -->
        <el-button 
          type="warning" 
          @click="() => handleMarkAnswer('unclear')"
          :disabled="!hasSelectedText || !props.highlightData"
        >
          <el-icon><QuestionFilled /></el-icon>
          unclear
        </el-button>
        <!-- 冗余 -->
        <el-button
          type="info"
          @click="() => handleMarkAnswer('redundant')"
          :disabled="!hasSelectedText || !props.highlightData"
        >
          <el-icon><RemoveFilled /></el-icon>
          redundant
        </el-button>
      </div>
      
      <el-divider direction="vertical" />
      <div class="tool-group">
        <!-- 橡皮 -->
        <el-button
          @click="handleEraseMarks"
          class="eraser-btn"
          :disabled="!props.highlightData"
        >
          <el-icon><Delete /></el-icon>
          erase
        </el-button>
        <!-- 清屏 -->
        <el-button
          @click="handleClearAll"
          class="clear-btn"
          :disabled="!props.highlightData"
        >
          <el-icon><Refresh /></el-icon>
          reset
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check, Close, Delete, QuestionFilled, Refresh, RemoveFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { ref, watch, onMounted, onUnmounted } from 'vue';

// Props 接口
interface Props {
  paperPreviewRef?: any
  highlightData?: any
}

const props = defineProps<Props>()


// 内部状态管理
const hasSelectedText = ref(false)

// 定时器用于轮询选中状态
let pollTimer: number | null = null

// 启动轮询检查文本选择状态
const startPolling = () => {
  if (pollTimer) return
  
  pollTimer = setInterval(() => {
    if (props.paperPreviewRef) {
      const currentHasSelection = props.paperPreviewRef.getHasSelectedText()
      if (currentHasSelection !== hasSelectedText.value) {
        hasSelectedText.value = currentHasSelection
      }
    } else {
      const selection = window.getSelection()
      const hasSelection = !!(selection && selection.toString().trim())
      if (hasSelection !== hasSelectedText.value) {
        hasSelectedText.value = hasSelection
      }
    }
  }, 200)
}

// 停止轮询
const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// 组件挂载时开始轮询
onMounted(() => {
  startPolling()
})

// 组件卸载时停止轮询
onUnmounted(() => {
  stopPolling()
})


// 标记答案
const handleMarkAnswer = (type: 'correct' | 'wrong' | 'unclear' | 'redundant') => {
  if (!hasSelectedText.value) {
    ElMessage.warning('请先选中要标记的文本')
    return
  }
  
  if (props.paperPreviewRef) {
    props.paperPreviewRef.markAnswer(type)
  }
}

// 橡皮功能 - 清除高亮文本
const handleEraseMarks = () => {
  if (props.paperPreviewRef) {
    props.paperPreviewRef.eraseHighlightedText()
  }
}

// 清屏功能 - 清除所有手动标注
const handleClearAll = () => {
  if (props.paperPreviewRef) {
    props.paperPreviewRef.clearAllMarks()
  }
}



// 暴露必要方法给父组件
defineExpose({
  hasSelection: () => hasSelectedText.value
})
</script>

<style scoped>
.highlight-toolbar {
  width: 100%;
  height: 56px; /* 固定高度 */
  box-sizing: border-box;
  display: flex;
  align-items: center;
  background: #F5F5F5;
  border-bottom: 1px solid #E5E5E5;
  flex-shrink: 0;
  padding: 0;
}

.tool-section {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 100%;
  overflow-x: auto;
  padding: 8px 16px;
  box-sizing: border-box;
  
  /* 确保内容不换行 */
  white-space: nowrap;
  flex-wrap: nowrap;

}


/* === 按钮样式 === */
.highlight-toolbar :deep(.el-button) {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  padding: 8px 12px;
  white-space: nowrap;
  flex-shrink: 0; /* 防止按钮被压缩 */
  min-width: max-content; /* 确保按钮完整显示 */
  position: relative;
}

.highlight-toolbar :deep(.el-button--primary) {
  background: #007AFF;
  border-color: #007AFF;
}

.highlight-toolbar :deep(.el-button--primary:hover) {
  background: #0056B3;
  border-color: #0056B3;
  transform: translateY(-1px);
}

.highlight-toolbar :deep(.el-button--success) {
  background: #4CD964;
  border-color: #4CD964;
}

.highlight-toolbar :deep(.el-button--success:hover) {
  background: #3AC85A;
  border-color: #3AC85A;
  transform: translateY(-1px);
}

.highlight-toolbar :deep(.el-button--danger) {
  background: #FF3B30;
  border-color: #FF3B30;
}

.highlight-toolbar :deep(.el-button--danger:hover) {
  background: #E6342A;
  border-color: #E6342A;
  transform: translateY(-1px);
}

.highlight-toolbar :deep(.el-button--warning) {
  background: #FF9500;
  border-color: #FF9500;
}

.highlight-toolbar :deep(.el-button--warning:hover) {
  background: #E6850E;
  border-color: #E6850E;
  transform: translateY(-1px);
}

.highlight-toolbar :deep(.el-button--info) {
  background: rgb(12, 5, 214);
  border-color: rgb(12, 5, 214);
}

.highlight-toolbar :deep(.el-button--info:hover) {
  background: rgb(10, 4, 180);
  border-color: rgb(10, 4, 180);
  transform: translateY(-1px);
}

.highlight-toolbar :deep(.el-button--default) {
  background: #e5e5e5;
  border-color: #E5E5E5;
  color: rgba(0, 0, 0, 0.6);
}

.highlight-toolbar :deep(.el-button--default:hover) {
  background: #D1D1D1;
  border-color: #D1D1D1;
  transform: translateY(-1px);
}

/* === 分割线样式 === */
.highlight-toolbar :deep(.el-divider--vertical) {
  border-color: #E5E5E5;
  height: 24px;
  margin: 0 8px;
  flex-shrink: 0;
}


/* === 特殊按钮样式 === */
.eraser-btn {
  background: #F0F0F0 !important;
  border-color: #D0D0D0 !important;
  color: #666 !important;
}

.eraser-btn:hover {
  background: #E0E0E0 !important;
  border-color: #C0C0C0 !important;
  color: #333 !important;
}

.clear-btn {
  background: #FFF3E0 !important;
  border-color: #FFB74D !important;
  color: #F57C00 !important;
}

.clear-btn:hover {
  background: #FFE0B2 !important;
  border-color: #FFA726 !important;
  color: #E65100 !important;
}

.highlight-toolbar :deep(.el-button:disabled) {
  opacity: 0.4;
  transform: none !important;
}

/* === 响应式调整 === */
@media (max-width: 768px) {
  .highlight-toolbar {
    height: 48px;
  }
  
  .tool-section {
    gap: 8px;
    padding: 4px 12px;
  }
  
  .tool-group {
    gap: 6px;
  }
  
  .highlight-toolbar :deep(.el-button) {
    padding: 6px 8px;
    font-size: 12px;
  }
  
  .highlight-toolbar :deep(.el-divider--vertical) {
    height: 20px;
    margin: 0 6px;
  }
  
  /* 移动端滚动条更明显 */
  .tool-section::-webkit-scrollbar {
    height: 8px;
  }
  
  .tool-section::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.5);
  }
}

@media (max-width: 480px) {
  .tool-section {
    gap: 6px;
    padding: 4px 8px;
  }
  
  .tool-group {
    gap: 4px;
  }
  
  .highlight-toolbar :deep(.el-button) {
    padding: 4px 6px;
    font-size: 11px;
  }
  
  .highlight-toolbar :deep(.el-button .el-icon) {
    margin-right: 2px;
  }
  
  .highlight-toolbar :deep(.el-divider--vertical) {
    height: 18px;
    margin: 0 4px;
  }
}
</style>