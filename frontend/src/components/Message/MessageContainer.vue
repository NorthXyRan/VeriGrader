<template>
  <teleport to="body">
    <div class="message-container">
      <transition-group name="message-stack" tag="div" class="message-stack">
        <MessageItem
          v-for="message in visibleMessages"
          :key="message.id"
          :id="message.id"
          :message="message.message"
          :type="message.type"
          :duration="message.duration"
          :show-icon="message.showIcon"
          :visible="message.visible"
          :progress="message.progress"
          :status="message.status"
          :sub-messages="message.subMessages"
          :completed-students="message.completedStudents"
          @close="handleClose"
        />
      </transition-group>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MessageItem from './MessageItem.vue'
import { messageStore } from './messageManager'

const visibleMessages = computed(() => {
  return messageStore.messages.filter((message) => message.visible)
})

const handleClose = (id: string) => {
  messageStore.close(id)
}
</script>

<style scoped>
.message-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;

  width: fit-content;
  max-width: calc(100vw - 40px);
}

.message-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.message-stack > * {
  pointer-events: auto;
}

.message-stack-move {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.message-stack-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.message-stack-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.message-stack-enter-from {
  transform: scale(0.3) translateY(-20px);
  opacity: 0;
}

.message-stack-leave-to {
  transform: scale(0.8) translateY(-10px);
  opacity: 0;
}

@media (max-width: 768px) {
  .message-container {
    top: 16px;
    max-width: calc(100vw - 24px);
  }
}

@media (max-width: 480px) {
  .message-container {
    top: 12px;
    max-width: calc(100vw - 16px);
  }
}

.message-stack > :nth-child(1) {
  z-index: 100;
}
</style>
