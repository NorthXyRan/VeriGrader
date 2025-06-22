<template>
  <div class="action-section">
    <div class="action-group">
      <div class="action-item">
        <div class="action-buttons">
          <el-button-group>
            <el-button
              type="primary"
              size="default"
              @click="handleStartGrading"
              :loading="isGrading"
              :disabled="isGrading"
            >
              <el-icon v-if="!isGrading"><VideoPlay /></el-icon>
              {{ isGrading ? 'Grading...' : 'One' }}
            </el-button>
            
            <el-button
              type="success"
              size="default"
              @click="showBatchDialog"
              :loading="isBatchGrading"
              :disabled="isBatchGrading"
            >
              <el-icon v-if="!isBatchGrading"><Operation /></el-icon>
              {{ isBatchGrading ? 'Batch Grading...' : 'Batch' }}
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>

    <!-- 批量批改弹窗 -->
    <el-dialog
      v-model="batchDialogVisible"
      title="Batch Grading"
      width="400px"
      :modal="true"
      :append-to-body="true"
      :destroy-on-close="false"
    >
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 10px; font-weight: 500;">
            Batch Percentage: {{ batchPercent }}%
          </label>
          <el-slider
            v-model="batchPercent"
            :min="0"
            :max="100"
            :step="1"
          />
          <div style="margin-top: 8px; text-align: center; color: #666; font-size: 14px;">
            {{ currentPaperCount }} of {{ examStore.studentCount }} papers will be graded
          </div>
        </div>
      </div>

      <template #footer>
        <el-button
          type="success"
          size="default"
          @click="handleBatchGrading"
        >
          Start Batch
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { VideoPlay, Operation } from '@element-plus/icons-vue'
import { ref, computed } from 'vue'
import { useExamDataStore } from '@/stores/useExamDataStore'

const examStore = useExamDataStore()

// 状态
const isGrading = ref(false)
const isBatchGrading = ref(false)
const batchDialogVisible = ref(false)
const batchPercent = ref(20)

// 计算当前百分比对应的试卷数量
const currentPaperCount = computed(() => {
  const totalCount = examStore.studentCount
  return Math.ceil((totalCount * batchPercent.value) / 100)
})

const emits = defineEmits<{
  (e: 'startGrading'): void
  (e: 'batchGrading', batchCount: number): void
}>()


const handleStartGrading = () => {
  isGrading.value = true
  emits('startGrading')
}

// Batch按钮 - 显示弹窗
const showBatchDialog = () => {
  batchDialogVisible.value = true
}

// 批量批改 - 关闭弹窗并触发事件
const handleBatchGrading = () => {
  batchDialogVisible.value = false
  emits('batchGrading', currentPaperCount.value)
}

// 重置状态
const resetGradingState = () => {
  isGrading.value = false
}

const resetBatchGradingState = () => {
  isBatchGrading.value = false
}

const setBatchGradingState = (state: boolean) => {
  isBatchGrading.value = state
}

defineExpose({
  resetGradingState,
  resetBatchGradingState,
  setBatchGradingState,
})
</script>

<style scoped>
.action-section {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9) !important;
  border: none;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.action-group {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.action-buttons {
  display: flex;
  flex-direction: row;
  gap: 6px;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 40px;
}

/* 按钮组样式 */
.action-section :deep(.el-button-group) {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-section :deep(.el-button-group .el-button) {
  border-radius: 0;
  margin: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.action-section :deep(.el-button-group .el-button:first-child) {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.action-section :deep(.el-button-group .el-button:last-child) {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  border-right: none;
}

/* 按钮样式 */
.action-section :deep(.el-button) {
  font-weight: 500;
  padding: 10px 16px;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: 120px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-section :deep(.el-button--primary) {
  background: #007aff;
  border-color: #007aff;
  color: #ffffff;
}

.action-section :deep(.el-button--primary:hover:not(.is-disabled)) {
  background: #0056b3;
  border-color: #0056b3;
}

.action-section :deep(.el-button--success) {
  background: #4cd964;
  border-color: #4cd964;
  color: #ffffff;
}

.action-section :deep(.el-button--success:hover:not(.is-disabled)) {
  background: #3ac85a;
  border-color: #3ac85a;
}

.action-section :deep(.el-button:disabled) {
  opacity: 0.4;
  transform: none !important;
  box-shadow: none !important;
}

.action-section :deep(.el-button .el-icon) {
  margin-right: 6px;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .action-group {
    padding: 12px 16px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 12px;
    width: 100%;
    align-items: stretch;
  }

  .action-section :deep(.el-button-group) {
    flex-direction: column;
    width: 100%;
    max-width: 260px;
    margin: 0 auto;
  }

  .action-section :deep(.el-button-group .el-button) {
    width: 100%;
    border-radius: 0;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .action-section :deep(.el-button-group .el-button:first-child) {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    border-bottom-left-radius: 0;
  }

  .action-section :deep(.el-button-group .el-button:last-child) {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
    border-top-right-radius: 0;
    border-bottom: none;
  }

  .action-section :deep(.el-button) {
    min-width: unset;
    justify-content: center;
  }
}
</style>