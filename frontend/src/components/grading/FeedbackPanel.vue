<template>
  <div class="feedback-panel"> 
    <!-- 内容区域 -->
    <div class="feedback-content">
      <!-- 给分理由区域 -->
      <div class="reason-area">
        <!-- 输入框模式 -->
        <el-input
          v-if="isEditing"
          v-model="editableReason"
          type="textarea"
          placeholder="请输入给分理由..."
          :rows="6"
          resize="none"
          class="reason-textarea"
        />
        <!-- 显示模式 -->
        <div v-else class="reason-display">
                    
          <div class="reason-content-text">
            {{ displayReason }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button @click="modifyReason">
        修改
      </el-button>
      <el-button
        type="success"
        @click="saveReason"
        :disabled="!editableReason.trim()"
      >
        保存
      </el-button>
      <el-button
        type="primary"
        @click="submitReason"
        :disabled="!editableReason.trim()"
      >
        提交
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, ref, watch } from 'vue'

// 接收高亮点击事件的数据结构
interface HighlightClickData {
  text: string
  type: 'correct' | 'wrong' | 'unclear' | 'redundant'
  reason?: string
  scoringPoint?: number
}

// 内部选中高亮的数据结构
interface SelectedHighlight {
  text: string
  type: 'correct' | 'wrong' | 'unclear' | 'redundant'
  reason?: string       // 给分理由
  scoringPoint?: number
}


// 事件定义 - 只保留必要的
const emits = defineEmits<{
  (e: 'modifyReason', data: any): void
  (e: 'saveReason', data: any): void
  (e: 'submitReason', data: any): void
}>()

// === 内部状态管理 ===
const selectedHighlight = ref<SelectedHighlight | null>(null)
const editableReason = ref('')
const isEditing = ref(false)


// 显示的理由内容
const displayReason = computed(() => {
  if (!selectedHighlight.value) {
    return 'Select the text on the left to view the scoring reason, or click the Modify button to manually input...'
  }
  
  if (isEditing.value) {
    return editableReason.value
  }
  
  // 显示理由
  const reason = selectedHighlight.value.reason || ''
  
  if (!reason) {
    return 'No reason information, click the Modify button to add a reason...'
  }
  
  return reason
})



// 处理高亮点击事件
const handleHighlightClicked = (data: HighlightClickData) => {
  selectedHighlight.value = {
    text: data.text,
    type: data.type,
    reason: data.reason,
    scoringPoint: data.scoringPoint
  }
  
  ElMessage.info(`查看高亮内容：${data.text.substring(0, 30)}...`)
}


// 监听选中的高亮变化
watch(() => selectedHighlight.value, (newHighlight) => {
  if (newHighlight) {
    editableReason.value = newHighlight.reason || ''
    isEditing.value = false
    
    console.log('选中高亮变化:', {
      text: newHighlight.text,
      type: newHighlight.type,
      reason: newHighlight.reason,
      scoringPoint: newHighlight.scoringPoint
    })
  } else {
    editableReason.value = ''
    isEditing.value = false
  }
}, { immediate: true })

// 修改理由
const modifyReason = () => {
  if (selectedHighlight.value) {
    emits('modifyReason', selectedHighlight.value)
  }
  isEditing.value = true
  ElMessage.info('现在可以编辑理由内容')
}

// 保存理由
const saveReason = () => {
  if (!editableReason.value.trim()) {
    ElMessage.warning('请输入理由内容')
    return
  }
  
  isEditing.value = false
  if (selectedHighlight.value) {
    emits('saveReason', {
      highlight: selectedHighlight.value,
      reason: editableReason.value.trim()
    })
  }
  ElMessage.success('理由已保存')
}

// 提交理由
const submitReason = () => {
  if (!editableReason.value.trim()) {
    ElMessage.warning('请输入理由内容')
    return
  }
  
  if (selectedHighlight.value) {
    emits('submitReason', {
      highlight: selectedHighlight.value,
      reason: editableReason.value.trim()
    })
    ElMessage.success('理由已提交')
  }
}

// 暴露方法给父组件
defineExpose({
  handleHighlightClicked,
})
</script>

<style scoped>
.feedback-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* === 内容区域 === */
.feedback-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #FFFFFF;
  overflow-y: auto;
  min-height: 0;
}

/* === 给分理由区域 === */
.reason-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 理由显示模式 */
.reason-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}

.reason-content-text {
  flex: 1;
  padding: 16px 0;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.6);
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 0;
}

/* 输入框模式 */
.reason-textarea {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.reason-textarea :deep(.el-textarea) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.reason-textarea :deep(.el-textarea__inner) {
  border-radius: 8px;
  border: 1px solid #E5E5E5;
  background: #FFFFFF;
  transition: all 0.2s ease;
  line-height: 1.6;
  flex: 1;
  resize: none;
  color: rgba(0, 0, 0, 0.87);
}

.reason-textarea :deep(.el-textarea__inner:focus) {
  border-color: #007AFF;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

.reason-textarea :deep(.el-textarea__inner:hover) {
  border-color: #007AFF;
}

/* === 操作按钮 === */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: #F5F5F5;
  border-radius: 0 0 12px 12px;
  border-top: 1px solid #E5E5E5;
}

.action-buttons .el-button {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  font-size: 13px;
}

.action-buttons .el-button--primary {
  background: #007AFF;
  border-color: #007AFF;
  color: #FFFFFF;
}

.action-buttons .el-button--primary:hover:not(.is-disabled) {
  background: #0056B3;
  border-color: #0056B3;
  transform: translateY(-1px);
}

.action-buttons .el-button--default {
  background: #E5E5E5;
  border-color: #E5E5E5;
  color: rgba(0, 0, 0, 0.6);
}

.action-buttons .el-button--default:hover:not(.is-disabled) {
  background: #D1D1D1;
  border-color: #D1D1D1;
  transform: translateY(-1px);
}

.action-buttons .el-button--success {
  background: #4CD964;
  border-color: #4CD964;
  color: #FFFFFF;
}

.action-buttons .el-button--success:hover:not(.is-disabled) {
  background: #3AC85A;
  border-color: #3AC85A;
  transform: translateY(-1px);
}

.action-buttons .el-button:disabled {
  opacity: 0.4;
  transform: none !important;
}

/* === 标签样式重写 === */
.feedback-panel :deep(.el-tag) {
  border-radius: 6px;
  font-weight: 500;
  font-size: 12px;
}

.feedback-panel :deep(.el-tag--success) {
  background: rgba(76, 217, 100, 0.1);
  border-color: #4CD964;
  color: #4CD964;
}

.feedback-panel :deep(.el-tag--danger) {
  background: rgba(255, 59, 48, 0.1);
  border-color: #FF3B30;
  color: #FF3B30;
}

.feedback-panel :deep(.el-tag--warning) {
  background: rgba(255, 149, 0, 0.1);
  border-color: #FF9500;
  color: #FF9500;
}

.feedback-panel :deep(.el-tag--info) {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.3);
  color: rgba(0, 0, 0, 0.6);
}

/* === 响应式调整 === */
@media (max-width: 768px) {
  .feedback-content {
    padding: 12px;
  }
  
  .action-buttons {
    flex-direction: column;
    padding: 12px;
    gap: 8px;
  }
  
  .action-buttons .el-button {
    width: 100%;
    justify-content: center;
  }
}
</style>