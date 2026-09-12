<template>
  <div class="scoring-section">
    <div class="action-container">
      <el-button
        v-if="!isGoldPaper"
        :type="isConfirmed ? 'success' : 'primary'"
        size="default"
        :disabled="!canProceed || !hasGradingResult"
        @click="toggleConfirm"
      >
        {{ isConfirmed ? 'Cancel Confirm' : 'Confirm Result' }}
      </el-button>

      <el-button
        :type="isGoldPaper ? 'warning' : 'primary'"
        size="default"
        :disabled="!canProceed || !hasGradingResult"
        @click="toggleGoldenStandard"
      >
        {{ isGoldPaper ? 'Remove Gold Standard' : 'Save as Gold Standard' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isGoldPaper?: boolean
  canProceed?: boolean
  isConfirmed?: boolean
  hasGradingResult?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isGoldPaper: false,
  canProceed: false,
  isConfirmed: false,
  hasGradingResult: false,
})

const emits = defineEmits<{
  (e: 'saveAsGoldenExample'): void
  (e: 'removeGoldenExample'): void
  (e: 'confirmResult'): void
  (e: 'cancelConfirm'): void
}>()

const toggleGoldenStandard = () => {
  if (props.isGoldPaper) {
    emits('removeGoldenExample')
  } else {
    emits('saveAsGoldenExample')
  }
}

const toggleConfirm = () => {
  if (props.isConfirmed) {
    emits('cancelConfirm')
  } else {
    emits('confirmResult')
  }
}
</script>

<style scoped>
.scoring-section {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.action-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0 32px;
  gap: 16px;
}

.scoring-section :deep(.el-button) {
  border-radius: 24px;
  font-weight: 600;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 12px 24px;
  font-size: 16px;
  min-height: 48px;
  min-width: 140px;
  letter-spacing: -0.01em;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.scoring-section :deep(.el-button--primary) {
  background: #007aff;
  color: #ffffff;
  border: none;
  box-shadow:
    0 2px 8px rgba(0, 122, 255, 0.2),
    0 4px 16px rgba(0, 122, 255, 0.1);
}

.scoring-section :deep(.el-button--primary:hover:not(.is-disabled)) {
  background: #0056b3;
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 4px 16px rgba(0, 122, 255, 0.3),
    0 8px 32px rgba(0, 122, 255, 0.15);
}

.scoring-section :deep(.el-button--warning) {
  background: #f56500;
  color: #ffffff;
  border: none;
  box-shadow:
    0 2px 8px rgba(245, 101, 0, 0.2),
    0 4px 16px rgba(245, 101, 0, 0.1);
}

.scoring-section :deep(.el-button--warning:hover:not(.is-disabled)) {
  background: #d14900;
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 4px 16px rgba(245, 101, 0, 0.3),
    0 8px 32px rgba(245, 101, 0, 0.15);
}

.scoring-section :deep(.el-button--success) {
  background: #34c759;
  color: #ffffff;
  border: none;
  box-shadow:
    0 2px 8px rgba(52, 199, 89, 0.2),
    0 4px 16px rgba(52, 199, 89, 0.1);
}

.scoring-section :deep(.el-button--success:hover:not(.is-disabled)) {
  background: #28a745;
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 4px 16px rgba(52, 199, 89, 0.3),
    0 8px 32px rgba(52, 199, 89, 0.15);
}

.scoring-section :deep(.el-button:active) {
  transform: translateY(-1px) scale(1.01);
}

.scoring-section :deep(.el-button:disabled) {
  opacity: 0.4;
  transform: none !important;
  box-shadow: none !important;
}

:global(.main-content--narrow .action-container) {
  flex-direction: column;
  gap: 12px;
  padding: 16px 24px;
}

:global(.main-content--narrow .scoring-section .el-button) {
  width: 100%;
  min-width: 0;
}

@media (max-width: 768px) {
  .action-container {
    flex-direction: column;
    gap: 12px;
    padding: 16px 24px;
  }

  .scoring-section :deep(.el-button) {
    min-width: 140px;
    padding: 14px 24px;
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .action-container {
    padding: 12px 20px;
    gap: 10px;
  }
}
</style>
