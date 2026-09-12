<template>
  <transition name="message-slide" appear>
    <div
      v-if="visible"
      class="message-card"
      :class="[
        `message-${type}`,
        { 'with-icon': showIcon },
        type === 'grading' && status ? `grading-${status}` : '',
      ]"
      @mouseenter="pauseTimer"
      @mouseleave="resumeTimer"
    >
      <div v-if="showIcon" class="message-icon">
        <transition name="icon-fade" mode="out-in">
          <svg
            v-if="type === 'success'"
            :key="'success'"
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <svg
            v-else-if="type === 'error'"
            :key="'error'"
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <svg
            v-else-if="type === 'warning'"
            :key="'warning'"
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18A2 2 0 003.54 21H20.46A2 2 0 0022.18 18L13.71 3.86A2 2 0 0010.29 3.86Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <svg
            v-else-if="type === 'grading' && status === 'completed'"
            :key="'grading-completed'"
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <svg
            v-else-if="type === 'grading' && status === 'failed'"
            :key="'grading-failed'"
            class="icon"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

          <svg
            v-else-if="type === 'grading'"
            :key="'grading-in-progress'"
            class="icon spinning"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
            <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>

          <svg v-else :key="'info'" class="icon" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </transition>
      </div>

      <transition name="text-fade" mode="out-in">
        <div :key="message" class="message-text">{{ message }}</div>
      </transition>

      <div v-if="type === 'grading' && progress" class="progress-info">
        <span class="progress-text">{{ progress.current }}/{{ progress.total }}</span>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${(progress.current / progress.total) * 100}%` }"
          ></div>
        </div>
      </div>

      <div v-if="type === 'grading' && subMessages && subMessages.length > 0" class="sub-messages">
        <div v-for="(subMsg, index) in subMessages" :key="index" class="sub-message">
          <div v-if="latestStudent" class="student-info">
            <transition name="student-fade" mode="out-in">
              <span :key="`student-${latestStudent.studentId}`" class="student-badge">
                Student {{ latestStudent.studentId }}: {{ latestStudent.score }}pts
              </span>
            </transition>
          </div>

          <div class="sub-message-content" :class="`status-${subMsg.status}`">
            <div class="sub-icon">
              <svg
                v-if="subMsg.status === 'completed'"
                class="icon"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg
                v-else-if="subMsg.status === 'failed'"
                class="icon"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12 C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg v-else class="icon spinning" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                <path
                  d="M12 6v6l4 2"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <span class="sub-text">{{ subMsg.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import type {
  CompletedStudent,
  GradingProgress,
  GradingStatus,
  GradingSubMessage,
  MessageType,
} from './types'

interface Props {
  id: string
  message: string
  type: MessageType
  duration: number
  showIcon: boolean
  visible: boolean
  progress?: GradingProgress
  status?: GradingStatus
  subMessages?: GradingSubMessage[]
  completedStudents?: CompletedStudent[]
}

const props = defineProps<Props>()

const emits = defineEmits<{
  (e: 'close', id: string): void
}>()

const latestStudent = computed(() => {
  if (!props.completedStudents || props.completedStudents.length === 0) {
    return null
  }
  return props.completedStudents[props.completedStudents.length - 1]
})

let timer: number | null = null

const startTimer = () => {
  if (timer) clearTimeout(timer)
  if (props.duration <= 0) return
  timer = window.setTimeout(() => {
    emits('close', props.id)
  }, props.duration)
}

const pauseTimer = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

const resumeTimer = () => {
  startTimer()
}

onMounted(() => {
  startTimer()
})

watch(() => props.duration, startTimer)

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
  }
})
</script>

<style scoped>
.message-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  margin-bottom: 8px;
  border-radius: 50px;

  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);

  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: #1d1d1f;
  cursor: default;
  user-select: none;
  min-width: 200px;
  max-width: 600px;
  width: fit-content;

  transition:
    border-color 0.4s ease,
    box-shadow 0.4s ease;
}

.message-success {
  border-color: rgba(48, 209, 88, 0.2);
}
.message-error {
  border-color: rgba(255, 59, 48, 0.2);
}
.message-warning {
  border-color: rgba(255, 149, 0, 0.2);
}
.message-info {
  border-color: rgba(0, 122, 255, 0.2);
}
.message-grading {
  border-color: rgba(142, 108, 235, 0.3);
}

.grading-completed {
  border-color: rgba(48, 209, 88, 0.3);
  box-shadow:
    0 8px 32px rgba(48, 209, 88, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.grading-failed {
  border-color: rgba(255, 59, 48, 0.3);
  box-shadow:
    0 8px 32px rgba(255, 59, 48, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.message-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  width: 100%;
  height: 100%;
}

.message-success .icon {
  color: #30d158;
}
.message-error .icon {
  color: #ff3b30;
}
.message-warning .icon {
  color: #ff9500;
}
.message-info .icon {
  color: #007aff;
}
.message-grading .icon {
  color: #8e6ceb;
}

.grading-completed .icon {
  color: #30d158;
}
.grading-failed .icon {
  color: #ff3b30;
}

.spinning {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.message-text {
  flex: 1;
  line-height: 1.5;
  letter-spacing: -0.01em;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-left: 8px;
  min-width: 60px;
}

.progress-text {
  font-size: 13px;
  font-weight: 600;
  color: #8e6ceb;
  text-align: center;
  letter-spacing: 0.5px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(142, 108, 235, 0.15);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8e6ceb, #b794f6);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.sub-messages {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.sub-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.student-badge {
  display: inline-block;
  padding: 6px 12px;
  background: rgba(48, 209, 88, 0.12);
  border: 1px solid rgba(48, 209, 88, 0.25);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #30d158;
  white-space: nowrap;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(48, 209, 88, 0.1);
  margin-bottom: 8px;
}

.sub-message-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 600;
  min-width: 140px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.status-in-progress {
  background: rgba(142, 108, 235, 0.1);
  border-color: rgba(142, 108, 235, 0.2);
  color: #8e6ceb;
}

.status-completed {
  background: rgba(48, 209, 88, 0.1);
  border-color: rgba(48, 209, 88, 0.2);
  color: #30d158;
}

.status-failed {
  background: rgba(255, 59, 48, 0.1);
  border-color: rgba(255, 59, 48, 0.2);
  color: #ff3b30;
}

.sub-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.sub-text {
  font-weight: 600;
  line-height: 1.3;
  text-align: center;
}

.message-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.message-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.text-fade-enter-active,
.icon-fade-enter-active,
.student-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.text-fade-leave-active,
.icon-fade-leave-active,
.student-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.text-fade-enter-from,
.icon-fade-enter-from,
.student-fade-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.text-fade-leave-to,
.icon-fade-leave-to,
.student-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@media (max-width: 768px) {
  .message-card {
    max-width: calc(100vw - 32px);
    padding: 14px 20px;
    font-size: 14px;
  }

  .message-icon {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 480px) {
  .message-card {
    min-width: 180px;
    gap: 10px;
  }

  .message-text {
    max-width: none;
  }
}
</style>
