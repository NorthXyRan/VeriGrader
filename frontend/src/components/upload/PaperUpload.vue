<template>
  <BaseUpload
    title="Paper Management"
    upload-title="Upload Paper File"
    :icon="Document"
    card-class="base-card base-card--rounded base-card--hover-scale paper-upload-card"
    upload-class="paper-upload"
    accept=".txt,.docx,.json"
    upload-hint="Supports TXT, DOCX, and JSON"
    :status="status"
    :file-name="fileName"
    :display-text="displayText"
    @file-selected="$emit('file-selected', $event)"
    @remove="$emit('remove')"
    @preview="$emit('preview')"
  />
</template>

<script setup lang="ts">
import type { UploadStatus } from '@/stores/useUploadStatusStore'
import { Document } from '@element-plus/icons-vue'
import BaseUpload from './BaseUpload.vue'

defineProps<{
  status: UploadStatus
  fileName: string
  displayText: string
}>()

defineEmits<{
  'file-selected': [file: File]
  remove: []
  preview: []
}>()
</script>

<style scoped>
.paper-upload-card :deep(.card-header) {
  background: #f98c53;
}

.paper-upload-card :deep(.el-upload-dragger:hover) {
  background: #faebe3;
}
</style>
