<template>
  <div class="action-section" :class="[`action-section--${variant}`]">
    <template v-if="isInline">
      <div class="inline-buttons">
        <template v-for="item in buttonConfigs" :key="item.key">
          <el-tooltip :content="item.tooltip" :disabled="!props.isConfirmed" placement="top">
            <el-button
              :type="item.type"
              size="default"
              :loading="item.loading"
              :disabled="item.disabled"
              class="action-btn dock-btn"
              @click="item.onClick"
            >
              <el-icon v-if="!item.loading || item.showIconWhenLoading">
                <component :is="item.icon" />
              </el-icon>
              <span class="btn-text">{{ item.label }}</span>
            </el-button>
          </el-tooltip>
        </template>
      </div>
    </template>
    <template v-else>
      <div class="action-group">
        <div
          class="scroll-arrow scroll-arrow-left"
          :class="{ 'arrow-visible': showLeftArrow }"
          @click="scrollToLeft"
        >
          <el-icon><ArrowLeft /></el-icon>
        </div>

        <div
          class="scroll-arrow scroll-arrow-right"
          :class="{ 'arrow-visible': showRightArrow }"
          @click="scrollToRight"
        >
          <el-icon><ArrowRight /></el-icon>
        </div>

        <div class="buttons-container" ref="scrollContainer" @scroll="updateArrowVisibility">
          <template v-for="item in buttonConfigs" :key="item.key">
            <div class="button-item">
              <el-tooltip :content="item.tooltip" :disabled="!props.isConfirmed" placement="top">
                <el-button
                  :type="item.type"
                  size="default"
                  :loading="item.loading"
                  :disabled="item.disabled"
                  class="action-btn dock-btn"
                  @click="item.onClick"
                >
                  <el-icon v-if="!item.loading || item.showIconWhenLoading">
                    <component :is="item.icon" />
                  </el-icon>
                  <span class="btn-text">{{ item.label }}</span>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, ArrowRight, Menu, QuestionFilled, VideoPlay } from '@element-plus/icons-vue'
import { computed, nextTick, onMounted, onUnmounted, ref, type Component } from 'vue'

type BatchMode = 'overlap' | 'missing' | 'red' | 'orange' | 'color' | 'all'

interface Props {
  canProceed?: boolean
  isConfirmed?: boolean
  variant?: 'default' | 'inline'
  currentStudentId?: number
}

const props = withDefaults(defineProps<Props>(), {
  canProceed: false,
  isConfirmed: false,
  variant: 'default',
  currentStudentId: undefined,
})

const scrollContainer = ref<HTMLElement>()

const isBatchGrading = ref(false)
const currentBatchMode = ref<BatchMode | ''>('')
const activeSingleStudents = ref<Set<number>>(new Set())
const isInline = computed(() => props.variant === 'inline')

const updateSingleStudents = (updater: (prev: Set<number>) => Set<number>) => {
  activeSingleStudents.value = updater(activeSingleStudents.value)
}

const showLeftArrow = ref(false)
const showRightArrow = ref(false)

interface ButtonConfig {
  key: string
  label: string
  tooltip: string
  type: 'primary' | 'success' | 'danger' | 'warning' | 'info'
  icon: Component
  loading: boolean
  showIconWhenLoading?: boolean
  onClick: () => void
  disabled: boolean
}

const batchModes: Array<{
  value: BatchMode
  label: string
  type: ButtonConfig['type']
  icon: Component
  tooltip: string
}> = [
  {
    value: 'color',
    label: 'Problem',
    type: 'info',
    icon: QuestionFilled,
    tooltip: 'Grade students with color-related issues',
  },
  {
    value: 'all',
    label: 'All',
    type: 'primary',
    icon: Menu,
    tooltip: 'Grade all students',
  },
]

const baseDisabled = computed(() => !props.canProceed || props.isConfirmed)
const isCurrentStudentGrading = computed(() => {
  if (props.currentStudentId === undefined || props.currentStudentId === null) return false
  return activeSingleStudents.value.has(props.currentStudentId)
})
const isAnySingleGrading = computed(() => activeSingleStudents.value.size > 0)
const oneDisabled = computed(
  () => baseDisabled.value || isBatchGrading.value || isCurrentStudentGrading.value,
)
const batchButtonsDisabled = computed(
  () => baseDisabled.value || isAnySingleGrading.value || isBatchGrading.value,
)
const oneLoading = computed(() => isCurrentStudentGrading.value)

const buttonConfigs = computed<ButtonConfig[]>(() => {
  const configs: ButtonConfig[] = [
    {
      key: 'one',
      label: oneLoading.value ? 'Grading...' : 'One',
      tooltip: props.isConfirmed ? 'Cannot grade confirmed papers' : 'Grade current student',
      type: 'primary',
      icon: VideoPlay,
      loading: oneLoading.value,
      showIconWhenLoading: false,
      onClick: handleStartGrading,
      disabled: oneDisabled.value,
    },
  ]

  batchModes.forEach((mode) => {
    const loading = isBatchGrading.value && currentBatchMode.value === mode.value
    configs.push({
      key: mode.value,
      label: loading ? 'Processing...' : mode.label,
      tooltip: props.isConfirmed ? 'Cannot grade confirmed papers' : mode.tooltip,
      type: mode.type,
      icon: mode.icon,
      loading,
      showIconWhenLoading: !loading,
      onClick: () => handleBatchGrading(mode.value),
      disabled: batchButtonsDisabled.value,
    })
  })

  return configs
})

const emits = defineEmits<{
  (e: 'startGrading'): void
  (e: 'batchGrading', mode: BatchMode): void
}>()

const handleStartGrading = () => {
  const studentId = props.currentStudentId
  if (studentId !== undefined) {
    updateSingleStudents((prev) => {
      const next = new Set(prev)
      next.add(studentId)
      return next
    })
  }
  emits('startGrading')
}

const handleBatchGrading = (mode: BatchMode) => {
  currentBatchMode.value = mode

  emits('batchGrading', mode)
}

const updateArrowVisibility = () => {
  if (!scrollContainer.value) return

  const container = scrollContainer.value
  const scrollLeft = container.scrollLeft
  const scrollWidth = container.scrollWidth
  const clientWidth = container.clientWidth

  const hasScrollableContent = scrollWidth > clientWidth

  if (!hasScrollableContent) {
    showLeftArrow.value = false
    showRightArrow.value = false
    return
  }

  showLeftArrow.value = scrollLeft > 5
  showRightArrow.value = scrollLeft < scrollWidth - clientWidth - 5
}

const scrollToLeft = () => {
  if (!scrollContainer.value) return
  const container = scrollContainer.value
  container.scrollBy({ left: -200, behavior: 'smooth' })
  setTimeout(updateArrowVisibility, 300)
}

const scrollToRight = () => {
  if (!scrollContainer.value) return
  const container = scrollContainer.value
  container.scrollBy({ left: 200, behavior: 'smooth' })
  setTimeout(updateArrowVisibility, 300)
}

const handleResize = () => {
  updateArrowVisibility()
}

onMounted(async () => {
  if (isInline.value) return
  await nextTick()
  updateArrowVisibility()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (isInline.value) return
  window.removeEventListener('resize', handleResize)
})

const resetGradingState = (studentId?: number) => {
  updateSingleStudents((prev) => {
    if (studentId === undefined || studentId === null) {
      return new Set()
    }
    if (!prev.has(studentId)) return prev
    const next = new Set(prev)
    next.delete(studentId)
    return next
  })
}

const resetBatchGradingState = () => {
  isBatchGrading.value = false
  currentBatchMode.value = ''
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
  border: none;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  overflow: visible;
}

.action-section--inline {
  justify-content: flex-end;
}

.inline-buttons {
  display: flex;
  gap: 20px;
  width: 100%;
  justify-content: flex-end;
  align-items: center;
  overflow: visible;
}

.action-group {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  padding: 16px 0;
  position: relative;
}

.buttons-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 20px;
  padding: 20px 60px;
  background: transparent;
  width: auto;
  max-width: 100%;
  margin: 0 auto;
  overflow-x: auto;
  overflow-y: visible;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
  box-sizing: border-box;
}

.buttons-container::-webkit-scrollbar {
  display: none;
}

.scroll-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 24px;
  background: rgba(240, 240, 240, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 20;
  color: #999;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.scroll-arrow.arrow-visible {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.scroll-arrow:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: #666;
  transform: translateY(-50%) scale(1.05);
}

.scroll-arrow:active {
  transform: translateY(-50%) scale(0.98);
  background: rgba(235, 235, 235, 0.95);
}

.scroll-arrow-left {
  left: 20px;
}

.scroll-arrow-right {
  right: 20px;
}

.scroll-arrow .el-icon {
  font-size: 18px;
}

.button-item {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform-origin: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.button-item:hover {
  transform: scale(1.2);
  z-index: 10;
}

.button-item:hover + .button-item,
.button-item:has(+ .button-item:hover) {
  transform: scale(0.95);
  z-index: 5;
}

.action-section :deep(.dock-btn) {
  border-radius: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  font-weight: 600;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  padding: 10px 16px;
  min-width: 110px;
  height: 40px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: -0.01em;
  position: relative;
  overflow: visible;
  cursor: pointer;
  margin: 16px 0;
}

.action-section :deep(.dock-btn .btn-text) {
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-section :deep(.dock-btn .el-icon) {
  margin-right: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.action-section :deep(.el-button) {
  background: #ffffff !important;
  color: #1d1d1f !important;
  border-width: 2px !important;
  border-style: solid !important;
}

.action-section :deep(.el-button--primary) {
  border-color: #007aff !important;
}
.action-section :deep(.el-button--success) {
  border-color: #4cd964 !important;
}
.action-section :deep(.el-button--warning) {
  border-color: #ff9500 !important;
}
.action-section :deep(.el-button--danger) {
  border-color: #ff3b30 !important;
}
.action-section :deep(.el-button--info) {
  border-color: #8e8e93 !important;
}
.action-section :deep(.missing-btn) {
  border-color: #ffcc02 !important;
}

.action-section :deep(.el-button:hover:not(.is-disabled)) {
  background: #ffffff !important;
  color: #1d1d1f !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
}

.action-section :deep(.el-button:disabled) {
  opacity: 0.4;
  transform: none !important;
  box-shadow: none !important;
}

@media (max-width: 1200px) {
  .buttons-container {
    padding: 16px 50px;
    gap: 16px;
  }

  .scroll-arrow {
    width: 28px;
    height: 28px;
    border-radius: 24px;
  }

  .scroll-arrow-left {
    left: 16px;
  }

  .scroll-arrow-right {
    right: 16px;
  }

  .scroll-arrow .el-icon {
    font-size: 14px;
  }

  .action-section :deep(.dock-btn) {
    min-width: 80px;
    padding: 10px 16px;
    font-size: 13px;
    margin: 10px 0;
  }

  .action-section :deep(.dock-btn .btn-text) {
    display: none;
  }

  .action-section :deep(.dock-btn .el-icon) {
    margin-right: 0;
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .buttons-container {
    padding: 12px 40px;
    gap: 12px;
  }

  .scroll-arrow {
    width: 24px;
    height: 24px;
    border-radius: 24px;
  }

  .scroll-arrow-left {
    left: 12px;
  }

  .scroll-arrow-right {
    right: 12px;
  }

  .scroll-arrow .el-icon {
    font-size: 12px;
  }

  .action-section :deep(.dock-btn) {
    min-width: 60px;
    padding: 8px 12px;
    margin: 8px 0;
  }

  .button-item:hover {
    transform: scale(1.05);
  }

  .button-item:hover + .button-item,
  .button-item:has(+ .button-item:hover) {
    transform: none;
  }
}

@media (max-width: 480px) {
  .scroll-arrow {
    display: none;
  }
}
</style>
