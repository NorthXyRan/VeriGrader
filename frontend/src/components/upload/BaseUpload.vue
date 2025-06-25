<template>
  <el-card :class="[cardClass, { disabled: disabled }]">
    <template #header>
      <div class="card-header">
        <div class="header-left">
          <div class="icon-wrapper">
            <el-icon class="card-icon">
              <component :is="icon" />
            </el-icon>
          </div>
          <h3>{{ title }}</h3>
        </div>
        <!-- 状态标签直接基于 status -->
        <el-tag :type="statusTagType" effect="dark" class="status-tag">
          <el-icon class="status-icon-tag">
            <component :is="statusIcon" />
          </el-icon>
          {{ statusText }}
        </el-tag>
      </div>
    </template>

    <div class="upload-content">
      <!-- 禁用警告 -->
      <el-alert
        v-if="disabled"
        title="Please upload the paper first"
        type="warning"
        :closable="false"
        show-icon
        class="disabled-alert"
      />

      <template v-else>
        <!-- 上传区域 -->
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

        <!-- 当前状态显示 -->
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
  </el-card>
</template>

<script setup>
import {
  Check,
  Clock,
  Delete,
  Loading,
  Upload,
  UploadFilled,
  View,
  Warning,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  uploadTitle: { type: String, required: true },
  icon: { type: [String, Object], required: true },
  cardClass: { type: String, required: true },
  uploadClass: { type: String, required: true },
  accept: { type: String, required: true },
  uploadHint: { type: String, required: true },
  disabled: { type: Boolean, default: false },
  
  // 从 Store 直接传入的状态
  status: { type: String, default: 'idle' }, // 'idle' | 'uploading' | 'processing' | 'ready' | 'error'
  fileName: { type: String, default: '' },
  displayText: { type: String, default: '' },
  error: { type: String, default: '' },
})

const emit = defineEmits(['file-selected', 'remove', 'preview'])

// 文件列表和上传组件引用
const fileList = ref([])
const uploadRef = ref()

// 监听状态变化，当状态重置为 idle 时，清空文件列表
watch(() => props.status, (newStatus, oldStatus) => {
  if (newStatus === 'idle' && oldStatus !== 'idle') {
    // 状态重置为 idle，清空文件列表
    fileList.value = []
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }
    console.log('📝 文件列表已清空，可以重新上传')
  }
})

// 监听文件名变化，当文件名被清空时，也清空文件列表
watch(() => props.fileName, (newFileName) => {
  if (!newFileName && fileList.value.length > 0) {
    fileList.value = []
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }
    console.log('📝 文件名已清空，清理文件列表')
  }
})

// ===== 计算属性：基于状态的 UI =====
const isProcessing = computed(() => 
  props.status === 'uploading' || props.status === 'processing'
)

const statusTagType = computed(() => {
  switch (props.status) {
    case 'ready': return 'success'
    case 'error': return 'danger'
    case 'uploading':
    case 'processing': return 'warning'
    default: return 'info'
  }
})

const statusIcon = computed(() => {
  switch (props.status) {
    case 'ready': return Check
    case 'error': return Warning
    case 'uploading':
    case 'processing': return Loading
    default: return Clock
  }
})

const statusText = computed(() => {
  switch (props.status) {
    case 'ready': return 'Ready'
    case 'error': return 'Error'
    case 'uploading': return 'Uploading'
    case 'processing': return 'Processing'
    default: return props.disabled ? 'Waiting' : 'Ready to Upload'
  }
})

const currentStatusIcon = computed(() => {
  switch (props.status) {
    case 'ready': return CircleCheckFilled
    case 'error': return Warning
    default: return CircleCheckFilled
  }
})

const uploadMainText = computed(() => 
  isProcessing.value ? 'Processing...' : 'Click or drag file here'
)

const uploadHintText = computed(() => 
  isProcessing.value ? 'Please wait...' : props.uploadHint
)

// ===== 事件处理：只负责通知父组件 =====
const handleFileChange = (uploadFile) => {
  const file = uploadFile.raw || uploadFile
  if (file && file instanceof File) {
    console.log('文件已选择:', file.name)
    emit('file-selected', file)
  } else {
    ElMessage.error('Invalid file')
  }
}

const handleRemove = async () => {
  try {
    await ElMessageBox.confirm('Are you sure you want to remove the file?', 'Confirm removal', {
      confirmButtonText: 'Remove',
      cancelButtonText: 'Cancel',
      type: 'warning',
    })
    
    // 清空文件列表
    fileList.value = []
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }
    
    emit('remove')
    ElMessage.success('File has been removed')
  } catch {
    // 用户取消操作
  }
}
</script>

<style scoped>
/* 共享样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px 16px;
  margin: -20px -20px 0;
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
  border-radius: 12px;
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
  border-radius: 20px;
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
}

.disabled-alert {
  border-radius: 12px;
}

.upload-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f4f8;
  transition: all 0.3s ease;
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
  border-radius: 12px;
  padding: 16px 20px;
  border: 1px solid #bae6fd;
  box-shadow: 0 2px 12px rgba(14, 165, 233, 0.08);
  transition: all 0.3s ease;
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
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
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

/* 上传区域样式 */
:deep(.el-upload-dragger) {
  border: 2px dashed #c7d2fe;
  border-radius: 12px;
  background: #f8fafc;
  transition: all 0.3s ease;
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

/* 响应式设计 */
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