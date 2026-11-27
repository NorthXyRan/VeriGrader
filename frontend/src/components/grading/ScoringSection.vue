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

      <!-- A compact toggle: the full action stays in the accessible name and tooltip. -->
      <el-button
        class="gold-toggle"
        :class="{ 'gold-toggle--on': isGoldPaper }"
        size="default"
        :disabled="!canProceed || !hasGradingResult"
        :aria-label="goldLabel"
        :aria-pressed="isGoldPaper"
        :title="goldLabel"
        @click="toggleGoldenStandard"
      >
        <el-icon class="gold-toggle__icon">
          <StarFilled v-if="isGoldPaper" />
          <Star v-else />
        </el-icon>
        <span>Gold Standard</span>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useContentLayout } from '@/composables/useContentLayout'
import { Star, StarFilled } from '@element-plus/icons-vue'
import { computed } from 'vue'

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

const goldLabel = computed(() =>
  props.isGoldPaper ? 'Remove Gold Standard' : 'Save as Gold Standard',
)

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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
}

.action-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.scoring-section :deep(.el-button) {
  margin: 0;
  min-height: 38px;
  padding: 0 20px;
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

/* Secondary to Confirm Result: outlined in gold, filled once the response is a gold standard. */
.scoring-section :deep(.gold-toggle) {
  gap: 6px;
  padding: 0 16px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1.5px rgba(214, 158, 0, 0.55);
  color: #8a6100;
}

.scoring-section :deep(.gold-toggle .gold-toggle__icon) {
  margin-right: 6px;
  color: #e0a800;
  font-size: 16px;
}

.scoring-section :deep(.gold-toggle:hover:not(.is-disabled)) {
  background: #fff8e1;
  box-shadow: inset 0 0 0 1.5px #e0a800;
  color: #6b4b00;
  transform: translateY(-1px);
}

.scoring-section :deep(.gold-toggle--on),
.scoring-section :deep(.gold-toggle--on:hover:not(.is-disabled)) {
  background: linear-gradient(135deg, #ffd84d 0%, #ffc300 100%);
  box-shadow: 0 2px 8px rgba(255, 195, 0, 0.35);
  color: #3d2f00;
}

.scoring-section :deep(.gold-toggle--on .gold-toggle__icon) {
  color: #8a6100;
}

.scoring-section :deep(.el-button:disabled) {
  opacity: 0.4;
  transform: none;
  box-shadow: none;
}

/* Compact: stacked so the question beside it keeps most of the row. */
.scoring-section--compact .action-container {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

/* Narrow: center each row and wrap when both buttons no longer fit. */
.scoring-section--narrow .action-container {
  flex-wrap: wrap;
  width: 100%;
  gap: 8px;
}

.scoring-section--narrow :deep(.el-button) {
  max-width: 100%;
  height: auto;
  min-height: 46px;
  padding: 0 16px;
  font-size: 15px;
  white-space: normal;
}
</style>
