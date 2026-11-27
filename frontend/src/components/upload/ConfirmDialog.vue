<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="visible" class="dialog-overlay" @click="handleCancel">
        <div class="dialog-container" @click.stop>
          <div class="dialog-content">
            <h3 class="dialog-title">{{ title }}</h3>
            <p class="dialog-message">{{ message }}</p>
          </div>
          <div class="dialog-actions">
            <button class="dialog-btn dialog-btn--cancel" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button class="dialog-btn dialog-btn--confirm" @click="handleConfirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  visible?: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: 'Confirm',
  message: 'Are you sure?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dialog-container {
  background: #ffffff;
  border-radius: 20px;
  width: 320px;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transform-origin: center;
}

.dialog-content {
  padding: 24px 24px 20px;
  text-align: center;
}

.dialog-title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 8px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
}

.dialog-message {
  font-size: 15px;
  color: #86868b;
  line-height: 1.4;
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
}

.dialog-actions {
  display: flex;
  border-top: 0.5px solid #d2d2d7;
}

.dialog-btn {
  flex: 1;
  padding: 16px;
  border: none;
  background: transparent;
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  transition: background-color 0.15s ease;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
}

.dialog-btn:active {
  background: rgba(0, 0, 0, 0.04);
}

.dialog-btn--cancel {
  color: #007aff;
  border-right: 0.5px solid #d2d2d7;
}

.dialog-btn--confirm {
  color: #ff3b30;
  font-weight: 500;
}

.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-container,
.dialog-leave-to .dialog-container {
  transform: scale(0.9);
  opacity: 0;
}

.dialog-enter-to .dialog-container,
.dialog-leave-from .dialog-container {
  transform: scale(1);
  opacity: 1;
}
</style>
