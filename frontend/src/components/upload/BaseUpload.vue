<template>
  <div :class="[cardClass, { disabled: disabled }]">
    <div class="card-header upload-card-header">
      <div class="header-left">
        <div class="icon-wrapper">
          <el-icon class="card-icon">
            <component :is="icon" />
          </el-icon>
        </div>
        <h3>{{ title }}</h3>
      </div>

      <el-tag :type="statusTagType" effect="dark" class="status-tag">
        <el-icon class="status-icon-tag">
          <component :is="statusIcon" />
        </el-icon>
        {{ statusText }}
      </el-tag>
    </div>

    <div class="card-content upload-content">
      <el-alert
        v-if="disabled"
        :title="disabledMessage"
        type="warning"
        :closable="false"
        show-icon
        class="disabled-alert"
      />

      <template v-else>
        <div class="upload-section">
          <div class="section-header">
            <el-icon class="section-icon"><Upload /></el-icon>
            <h4>{{ uploadTitle }}</h4>
          </div>
          <el-upload
            ref="uploadRef"
            v-model:file-list="fileList"
            :class="uploadClass"
            :auto-upload="false"
            :on-change="handleFileChange"
            :show-file-list="false"
            :accept="accept"
            :limit="1"
            :disabled="isProcessing"
            drag
          >
            <div class="upload-content-inner">
              <el-icon v-if="!isProcessing" class="upload-icon">
                <UploadFilled />
              </el-icon>
              <el-icon v-else class="upload-icon loading">
                <Loading />
              </el-icon>
              <div class="upload-text">
                <p class="upload-main">{{ uploadMainText }}</p>
                <p class="upload-hint">{{ uploadHintText }}</p>
              </div>
            </div>
          </el-upload>
        </div>

        <div v-if="fileName" class="current-status">
          <div class="status-card" :class="{ 'error-card': status === 'error' }">
            <div class="status-content">
              <div class="status-info">
                <el-icon class="status-icon" :class="{ 'error-icon': status === 'error' }">
                  <component :is="currentStatusIcon" />
                </el-icon>
                <span class="status-text" :class="{ 'error-text': status === 'error' }">
                  {{ displayText || `File: ${fileName}` }}
                </span>
              </div>
              <div class="action-buttons">
                <el-button type="primary" link @click="$emit('preview')" class="action-btn">
                  <el-icon><View /></el-icon>
                  PREVIEW
                </el-button>
                <el-button type="danger" link @click="handleRemove" class="action-btn">
                  <el-icon><Delete /></el-icon>
                  REMOVE
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploadStatus } from '@/stores/useUploadStatusStore'
import {
  Check,
  CircleCheckFilled,
  Clock,
  Delete,
  Loading,
  Upload,
  UploadFilled,
  View,
  Warning,
} from '@element-plus/icons-vue'
import type { UploadFile, UploadInstance, UploadUserFile } from 'element-plus'
import { computed, ref, watch, type Component } from 'vue'
import { confirm } from './confirmDialog'

interface Props {
  title: string
  uploadTitle: string
  icon: Component
  cardClass: string
  uploadClass: string
  accept: string
  uploadHint: string
  disabledMessage?: string
  disabled?: boolean
  status?: UploadStatus
  fileName?: string
  displayText?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabledMessage: 'Complete the previous upload first',
  disabled: false,
  status: 'idle',
  fileName: '',
  displayText: '',
})

const emit = defineEmits<{
  'file-selected': [file: File]
  remove: []
  preview: []
}>()

const fileList = ref<UploadUserFile[]>([])
const uploadRef = ref<UploadInstance>()

watch(
  () => props.status,
  (newStatus, oldStatus) => {
    if (newStatus === 'idle' && oldStatus !== 'idle') {
      fileList.value = []
      uploadRef.value?.clearFiles()
    }
  },
)

watch(
  () => props.fileName,
  (newFileName) => {
    if (!newFileName && fileList.value.length > 0) {
      fileList.value = []
      uploadRef.value?.clearFiles()
    }
  },
)

const isProcessing = computed(() => props.status === 'processing')

const statusTagType = computed(() => {
  switch (props.status) {
    case 'ready':
      return 'success'
    case 'error':
      return 'danger'
    case 'processing':
      return 'warning'
    default:
      return 'info'
  }
})

const statusIcon = computed(() => {
  switch (props.status) {
    case 'ready':
      return Check
    case 'error':
      return Warning
    case 'processing':
      return Loading
    default:
      return Clock
  }
})

const statusText = computed(() => {
  switch (props.status) {
    case 'ready':
      return 'Ready'
    case 'error':
      return 'Error'
    case 'processing':
      return 'Processing'
    default:
      return props.disabled ? 'Waiting' : 'Ready to Upload'
  }
})

const currentStatusIcon = computed(() => (props.status === 'error' ? Warning : CircleCheckFilled))

const uploadMainText = computed(() =>
  isProcessing.value ? 'Processing...' : 'Click or drag file here',
)

const uploadHintText = computed(() => (isProcessing.value ? 'Please wait...' : props.uploadHint))

const handleFileChange = (uploadFile: UploadFile) => {
  if (uploadFile.raw) emit('file-selected', uploadFile.raw)
}

const handleRemove = async () => {
  const confirmed = await confirm({
    title: 'Confirm removal',
    message: 'Are you sure you want to remove the file?',
    confirmText: 'Remove',
    cancelText: 'Cancel',
  })

  if (confirmed) {
    fileList.value = []
    uploadRef.value?.clearFiles()
    emit('remove')
  }
}
</script>

<style scoped>
.upload-card-header {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-wrapper {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--border-radius-small);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.card-icon {
  font-size: 20px;
  color: rgb(0, 0, 0);
}

.card-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: rgb(0, 0, 0);
}

.status-tag {
  padding: 8px 16px;
  border-radius: var(--border-radius-card);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-icon-tag {
  font-size: 14px;
}

.upload-content {
  display: flex;
  flex-direction: column;

  overflow-y: visible;
  height: auto;
  flex: initial;
}

.disabled-alert {
  border-radius: var(--border-radius-small);
}

.upload-section {
  background: white;
  border-radius: var(--border-radius-small);
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f4f8;
  transition: var(--transition-base);
}

.upload-section:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-icon {
  font-size: 18px;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.upload-content-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.upload-icon {
  font-size: 36px;
  opacity: 0.8;
}

.upload-icon.loading {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.upload-text {
  text-align: center;
}

.upload-main {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 4px 0;
}

.upload-hint {
  font-size: 14px;
  color: #8590a6;
  margin: 0;
}

.current-status {
  margin-top: 20px;
}

.status-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: var(--border-radius-small);
  padding: 16px 20px;
  border: 1px solid #bae6fd;
  box-shadow: 0 2px 12px rgba(14, 165, 233, 0.08);
  transition: var(--transition-base);
}

.status-card.error-card {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fca5a5;
  box-shadow: 0 2px 12px rgba(239, 68, 68, 0.08);
}

.status-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.status-icon {
  font-size: 20px;
  color: #0ea5e9;
}

.error-icon {
  color: #ef4444;
}

.status-text {
  font-size: 14px;
  font-weight: 600;
  color: #0c4a6e;
  margin: 0;
}

.status-text.error-text {
  color: #dc2626;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.action-btn {
  padding: 6px 12px;
  border-radius: var(--border-radius-tiny);
  font-weight: 500;
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn[type='primary']:hover {
  background: #3b82f6;
  color: white;
}

.disabled {
  opacity: 0.7;
  pointer-events: none;
}

.paper-upload-card,
.answer-upload-card,
.student-upload-card {
  height: auto;
}

:deep(.el-upload-dragger) {
  border: 2px dashed #c7d2fe;
  border-radius: var(--border-radius-small);
  background: #f8fafc;
  transition: var(--transition-base);
  padding: 4px;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-upload-dragger:hover) {
  border-color: #4f46e5;
  background: #f3f4f6;
}

:deep(.upload-icon) {
  color: #4f46e5;
}

@media (max-width: 768px) {
  .status-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .action-buttons {
    align-self: flex-start;
  }
}
</style>
