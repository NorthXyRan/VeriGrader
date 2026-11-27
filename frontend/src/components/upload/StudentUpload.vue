<template>
  <BaseUpload
    title="Student Papers"
    upload-title="Upload Student Answers"
    :icon="User"
    card-class="base-card base-card--rounded base-card--hover-scale student-upload-card"
    upload-class="student-upload"
    accept=".json"
    upload-hint="Supports JSON with all student responses"
    :status="status"
    :file-name="fileName"
    :display-text="displayText"
    :disabled="disabled"
    disabled-message="Please upload the reference answer first"
    @file-selected="$emit('file-selected', $event)"
    @remove="$emit('remove')"
    @preview="$emit('preview')"
  />
</template>

<script setup lang="ts">
import type { UploadStatus } from '@/stores/useUploadStatusStore'
import { User } from '@element-plus/icons-vue'
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
.student-upload-card :deep(.card-header) {
  background: #abd7fb;
}

.student-upload-card :deep(.el-upload-dragger:hover) {
  background: #e0e8f8;
}
</style>
