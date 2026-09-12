<template>
  <div v-if="visible" class="dialog-overlay" @click="handleClose">
    <div class="dialog-content" @click.stop>
      <div class="dialog-header">
        <h3 class="dialog-title">{{ title }}</h3>
        <button type="button" class="close-btn" aria-label="Close preview" @click="handleClose">
          ×
        </button>
      </div>

      <div class="dialog-body">
        <div class="content-scroll">
          <pre class="content-display">{{ content }}</pre>
        </div>
      </div>

      <div class="dialog-footer">
        <button type="button" class="btn btn-default" @click="handleClose">Close</button>
        <button type="button" class="btn btn-primary" @click="copyContent">Copy</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@/components/Message'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    visible?: boolean
    title?: string
    content?: string
  }>(),
  { visible: false, title: 'File preview', content: '' },
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
})

const handleClose = () => {
  dialogVisible.value = false
}

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(props.content)
    Message.success('Content has been copied to the clipboard')
  } catch {
    Message.error('Copy failed; select the text and copy it manually')
  }
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.dialog-content {
  background: white;
  border-radius: 16px;
  width: 80%;
  max-width: 1000px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  background: #f5f5f5;
  border-radius: 16px 16px 0 0;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
}

.dialog-body {
  flex: 1;
  overflow: hidden;
}

.content-scroll {
  height: 60vh;
  overflow-y: auto;
}

.content-display {
  font-family: monospace;
  font-size: 14px;
  line-height: 1.6;
  background: #f8fafc;
  padding: 20px;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 10px 20px;
  border: 1px solid #ddd;
  border-radius: 10px;
  cursor: pointer;
  background: white;
}

.btn-primary {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

@media (max-width: 768px) {
  .dialog-content {
    width: 95%;
  }
}
</style>
