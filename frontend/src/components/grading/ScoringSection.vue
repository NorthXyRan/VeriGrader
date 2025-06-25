<template>
  <div class="scoring-section">
    <div class="score-group">
      <div class="score-item">
        <span class="score-label">Score by LLM</span>
        <div class="score-display">
          <span class="score-value">{{ llmScore }}</span>
          <span class="score-unit">points</span>
        </div>
      </div>
      
      <el-divider direction="vertical" />
      
      <div class="score-item">
        <span class="score-label">Final Score</span>
        <div class="score-input-group">
          <el-input
            v-model="teacherScore"
            type="number"
            size="default"
            class="score-input"
            @input="handleTeacherScoreInput"
          />
          <span class="score-unit">points</span>
        </div>
      </div>
      
      <el-divider direction="vertical" />
      
      <div class="score-item">
        <span class="score-label">Operation</span>
        <div class="score-actions-inline">
          <el-button 
            type="primary" 
            size="default"
            @click="saveScore"
            :disabled="!teacherScore"
          >
            Save and Submit
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { ref } from 'vue';

interface Props {
  llmScore?: number
}

const props = withDefaults(defineProps<Props>(), {
  llmScore: 0,
})

const emits = defineEmits<{
  (e: 'scoreChange', data: { teacherScore: number, llmScore: number }): void
  (e: 'saveAsGoldenExample'): void
}>()

// 评分相关数据
const teacherScore = ref<number | string>()

// 处理教师评分变化
const handleTeacherScoreInput = (value: string) => {
  const numericValue = parseFloat(value)
  if (!isNaN(numericValue)) {
    teacherScore.value = numericValue
    emits('scoreChange', {
      teacherScore: numericValue,
      llmScore: props.llmScore || 0
    })
  } else {
    teacherScore.value = value
  }
}

// 保存评分
const saveScore = () => {
  const score = typeof teacherScore.value === 'string' ? parseFloat(teacherScore.value) : teacherScore.value
  if (score !== undefined && !isNaN(score)) {
    // 发送评分变化事件
    emits('scoreChange', {
      teacherScore: score,
      llmScore: props.llmScore || 0
    })
    
    // 发送设置金标试卷事件
    emits('saveAsGoldenExample')
    
    ElMessage.success(`Score saved and set as golden standard: ${score} points`)
  }
}
</script>

<style scoped>
/* === 评分区域：适配父组件的卡片容器 === */
.scoring-section {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(255, 255, 255, 0.9) !important;

  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.score-group {
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  margin-bottom: 0;
  padding: 0 16px; /* 内部留点边距 */
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.score-label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 500;
  white-space: nowrap;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.score-value {
  font-size: 24px;
  font-weight: 600;
  color: #007AFF;
}

.score-unit {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.3);
  font-weight: 500;
}

.score-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-input {
  width: 100px;
}

.score-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  border-color: #E5E5E5;
  background: #FFFFFF;
}

.score-input :deep(.el-input__wrapper:hover) {
  border-color: #007AFF;
}

.score-input :deep(.el-input__wrapper.is-focus) {
  border-color: #007AFF;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

.score-input :deep(.el-input__inner) {
  text-align: center;
  font-weight: 600;
  font-size: 18px;
  color: rgba(0, 0, 0, 0.87);
}

.score-actions-inline {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

/* === 按钮样式适配 === */
.scoring-section :deep(.el-button) {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  padding: 8px 16px;
}

.scoring-section :deep(.el-button--primary) {
  background: #007AFF;
  border-color: #007AFF;
  color: #FFFFFF;
}

.scoring-section :deep(.el-button--primary:hover:not(.is-disabled)) {
  background: #0056B3;
  border-color: #0056B3;
  transform: translateY(-1px);
}

.scoring-section :deep(.el-button:disabled) {
  opacity: 0.4;
  transform: none !important;
}

/* === 分割线样式 === */
.scoring-section :deep(.el-divider--vertical) {
  border-color: #E5E5E5;
  height: 40px;
  margin: 0 16px;
}

/* === 响应式设计 === */
@media (max-width: 768px) {
  .score-group {
    flex-direction: column;
    gap: 12px;
    padding: 8px 12px;
  }
  
  .scoring-section :deep(.el-divider--vertical) {
    display: none;
  }
  
  .score-item {
    width: 100%;
    padding: 8px;
    background: #FFFFFF;
    border-radius: 8px;
    border: 1px solid #E5E5E5;
  }
  
  .score-value {
    font-size: 20px;
  }
  
  .score-input {
    width: 120px;
  }
}
</style>