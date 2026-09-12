<template>
  <BaseUpload
    title="Reference Answer"
    upload-title="Upload Answer File"
    :icon="DocumentChecked"
    card-class="base-card base-card--rounded base-card--hover-scale answer-upload-card"
    upload-class="answer-upload"
    accept=".txt,.docx,.json"
    upload-hint="Supports TXT, DOCX, and JSON"
    :status="status"
    :file-name="fileName"
    :display-text="displayText"
    :disabled="disabled"
    disabled-message="Please upload the paper first"
    @file-selected="$emit('file-selected', $event)"
    @remove="$emit('remove')"
    @preview="$emit('preview')"
  />
</template>

<script setup lang="ts">
import type { UploadStatus } from '@/stores/useUploadStatusStore'
import { DocumentChecked } from '@element-plus/icons-vue'
import BaseUpload from './BaseUpload.vue'

withDefaults(
  defineProps<{
    status: UploadStatus
    fileName: string
    displayText: string
    disabled?: boolean
  }>(),
  { disabled: false },
)

defineEmits<{
  'file-selected': [file: File]
  remove: []
  preview: []
}>()
</script>

<style scoped>
.answer-upload-card :deep(.card-header) {
  background: #d2e0aa;
}

.answer-upload-card :deep(.el-upload-dragger:hover) {
  background: #e4fbf0;
}
</style>
