<template>
  <!-- 遮罩层 -->
  <div v-if="visible" class="dialog-overlay" @click="handleClose">
    <!-- 弹窗主体 -->
    <div class="dialog-content" @click.stop>
      <!-- 头部 -->
      <div class="dialog-header">
        <h3 class="dialog-title">{{ title }}</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      
      <!-- 内容区域 -->
      <div class="dialog-body">
        <div class="content-scroll">
          <pre class="content-display">{{ content }}</pre>
        </div>
      </div>
      
      <!-- 底部按钮 -->
      <div class="dialog-footer">
        <button class="btn btn-default" @click="handleClose">Close</button>
        <button class="btn btn-primary" @click="copyContent">Copy</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { computed } from 'vue'
import { logger } from '../../utils/logger'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '文件预览' },
  content: { type: String, default: '' },
})

const emit = defineEmits(['update:visible'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const handleClose = () => {
  dialogVisible.value = false
}

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(props.content)
    ElMessage.success('Content has been copied to the clipboard')
  } catch (error) {
    logger.error('复制失败', error)
    ElMessage.error('Copy failed, please manually select copy')
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