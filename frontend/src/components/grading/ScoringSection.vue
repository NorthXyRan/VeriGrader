<template>
  <div class="scoring-section" :class="`scoring-section--${layout}`">
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
import { useContentLayout } from '@/composables/useContentLayout'

const layout = useContentLayout()

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
  display: flex;
  align-items: center;
  height: 100%;
  padding: 12px 16px;
}

.action-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scoring-section :deep(.el-button) {
  margin: 0;
  min-height: 40px;
  padding: 0 22px;
  border: none;
  border-radius: var(--radius-pill);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.scoring-section :deep(.el-button--primary) {
  background: #007aff;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
}

.scoring-section :deep(.el-button--primary:hover:not(.is-disabled)) {
  background: #0062d6;
  box-shadow: 0 6px 16px rgba(0, 122, 255, 0.28);
  transform: translateY(-1px);
}

.scoring-section :deep(.el-button--warning) {
  background: #f56500;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(245, 101, 0, 0.2);
}

.scoring-section :deep(.el-button--warning:hover:not(.is-disabled)) {
  background: #d14900;
  box-shadow: 0 6px 16px rgba(245, 101, 0, 0.28);
  transform: translateY(-1px);
}

.scoring-section :deep(.el-button--success) {
  background: #34c759;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(52, 199, 89, 0.2);
}

.scoring-section :deep(.el-button--success:hover:not(.is-disabled)) {
  background: #28a745;
  box-shadow: 0 6px 16px rgba(52, 199, 89, 0.28);
  transform: translateY(-1px);
}

.scoring-section :deep(.el-button:disabled) {
  opacity: 0.4;
  transform: none;
  box-shadow: none;
}

/* Narrow: two full-width, touch-sized buttons side by side or stacked as space allows. */
.scoring-section--narrow .action-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  width: 100%;
  gap: 8px;
}

.scoring-section--narrow :deep(.el-button) {
  width: 100%;
  min-height: 46px;
  padding: 0 16px;
  font-size: 15px;
}
</style>
