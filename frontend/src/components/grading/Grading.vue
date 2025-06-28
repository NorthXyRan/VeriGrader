<template>
  <div class="grading-page">
    <!-- 头部 -->
    <grading-header
      class="hover"
      :current-question="currentQuestionId"
      :current-student-id="currentStudentId"
      :questions="examDataStore.questions"
      :student-list="examDataStore.studentList"
      :highlight-data-list="examDataStore.highlightDataList"
      @question-change="handleQuestionChange"
      @student-change="handleStudentChange"
    />

    <!-- 第一行：评分 + 操作 (7:3) -->
    <div class="grading-row grading-row-top">
      <scoring-section
        class="grading-card scoring-card hover"
        :llm-score="currentLLMScore"
        :max-score="currentMaxScore"
        @score-change="handleScoreChange"
        @save-as-golden-example="handleSaveAsGoldenExample"
      />
      <action-section
        ref="actionSectionRef"
        class="grading-card action-card hover"
        :disabled="!examDataStore.isDataComplete"
        @start-grading="startGrading"
        @batch-grading="startBatchGrading"
      />
    </div>
    <!-- 第二行：预览 + 参考答案 + 反馈 (4:3:3) -->
    <div class="grading-row grading-row-main">
      <!-- 预览区域 -->
      <div class="grading-card preview-card hover">
        <highlight-toolbar
          ref="highlightToolbarRef"
          :paper-preview-ref="paperPreviewRef"
          :highlight-data="currentHighlightData"
        />
        <paper-preview
          ref="paperPreviewRef"
          :student-answer="currentStudentAnswer"
          :highlight-data="currentHighlightData"
          @update-highlight-data="handleUpdateHighlightData"
          @highlight-clicked="handleHighlightClicked"
        />
      </div>

      <!-- 参考答案区域 -->
      <div class="grading-card reference-card hover">
        <div class="card-header">
          <h3>Reference Answer</h3>
        </div>
        <reference-answer class="card-content" :reference-answer="currentReferenceAnswer" />
      </div>

      <!-- 反馈区域 -->
      <div class="grading-card feedback-card hover">
        <div class="card-header">
          <h3>Score Reason</h3>
        </div>
        <feedback-panel
          class="card-content"
          ref="feedbackPanelRef"
          @modify-reason="handleModifyReason"
          @save-reason="handleSaveReason"
          @submit-reason-example="handleSubmitReasonExample"
        />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import ActionSection from './ActionSection.vue'
import FeedbackPanel from './FeedbackPanel.vue'
import GradingHeader from './GradingHeader.vue'
import HighlightToolbar from './HighlightToolbar.vue'
import PaperPreview from './PaperPreview.vue'
import ReferenceAnswer from './ReferenceAnswer.vue'
import ScoringSection from './ScoringSection.vue'

// Store
import { useExamDataStore } from '../../stores/useExamDataStore'
import { useUploadStatusStore } from '../../stores/useUploadStatusStore'

// Composables
import { useGradingBusiness } from '../../composables/useGradingBusiness'
import { useHighlightDataOperations } from '../../composables/useHighlightDataOperations'
import { useFewShotManager } from '../../composables/useFewShotManager'
import { logger } from '../../utils/logger'

// 数据存储
const examDataStore = useExamDataStore()
const uploadStatusStore = useUploadStatusStore()

// 批改业务逻辑
const { 
  executeSingleGrading,
  executeBatchGrading,
  generateReasonWithFeedback,
  saveReasonDirectly
} = useGradingBusiness()

// 标注数据操作
const { saveAnnotation, removeAnnotation, resetAllAnnotations } = useHighlightDataOperations()

// Few-Shot学习管理
const { addReasonExample, setGoldPaper, isGoldPaper } = useFewShotManager()

// UI状态
const currentStudentId = ref<number>(1)
const currentQuestionId = ref<number>(1)
const isInModifyMode = ref<boolean>(false)

// 当前题目
const currentQuestion = computed(() => {
  return examDataStore.getQuestionById(currentQuestionId.value)
})

// 参考答案
const currentReferenceAnswer = computed(() => {
  const referenceAnswer = examDataStore.getReferenceAnswer(currentQuestionId.value)

  if (!referenceAnswer) {
    return 'There is no answer available. Please check if you have uploaded the reference answer.'
  }
  
  return referenceAnswer.answer
})

// 学生答案
const currentStudentAnswer = computed(() => {
  const answer = examDataStore.getStudentAnswer(currentStudentId.value, currentQuestionId.value)
  if (!answer) {
    return 'There is no student answer available. Please check if you have uploaded or answered this question.'
  }
  return answer.answer
})

// 当前标注数据
const currentHighlightData = computed(() => {
  if (!currentStudentId.value || !currentQuestionId.value) return null
  return examDataStore.getHighlightData(currentStudentId.value, currentQuestionId.value)
})

// AI评分
const currentLLMScore = computed(() => {
  return currentHighlightData.value?.total_score || 0
})

// 题目满分
const currentMaxScore = computed(() => {
  return currentQuestion.value?.score || 0
})

// 是否为金标试卷
const isCurrentPaperGolden = computed(() => {
  return isGoldPaper(currentStudentId.value, currentQuestionId.value)
})

// 组件引用
const feedbackPanelRef = ref()
const paperPreviewRef = ref()
const highlightToolbarRef = ref()
const actionSectionRef = ref()

// 事件处理
const handleStudentChange = (studentId: number) => {
  if (studentId === currentStudentId.value) return

  const studentExists = examDataStore.studentList.some((student) => student.id === studentId)

  if (!studentExists) {
    ElMessage.warning(`Student ${studentId} not found`)
    return
  }

  currentStudentId.value = studentId
  logger.info('切换学生', { studentId })
}

const handleQuestionChange = (question: { id: number; name: string; score: number }) => {
  if (question.id === currentQuestionId.value) return

  const questionExists = examDataStore.getQuestionById(question.id)

  if (!questionExists) {
    ElMessage.warning(`Question ${question.id} not found`)
    return
  }

  currentQuestionId.value = question.id
  logger.info('切换题目', { questionId: question.id })
}

// 高亮点击处理
const handleHighlightClicked = (data: { text: string; type: string; reason: string; scoringPoint: number }) => {
  logger.info('高亮点击事件', {
    text: data.text.substring(0, 30) + '...',
    type: data.type,
    hasReason: !!data.reason
  })
  feedbackPanelRef.value?.handleHighlightClicked(data)
}

// 更新标注数据
const handleUpdateHighlightData = async (data: {
  operation: 'add' | 'remove' | 'reset'
  text?: string
  type?: 'correct' | 'wrong' | 'unclear' | 'redundant'
  reason?: string
  scoringPoint?: number
}) => {
  logger.info('更新HighlightData', {
    operation: data.operation,
    text: data.text ? data.text.substring(0, 30) + '...' : undefined,
    type: data.type
  })
  
  // 处理添加操作的特殊逻辑
  if (data.operation === 'add' && data.text && data.type) {
    const targetType = data.type
    
    if (isInModifyMode.value && data.reason) {
      // 修改模式：直接保存理由
      saveReasonDirectly(
        data.text, 
        targetType, 
        data.reason, 
        data.scoringPoint || 0,
        currentStudentId.value,
        currentQuestionId.value,
        feedbackPanelRef
      )
      isInModifyMode.value = false
    } else {
      // 标注模式：显示加载状态，调用LLM生成理由
      feedbackPanelRef.value?.handleHighlightClicked({
        text: data.text,
        type: targetType,
        reason: '当前LLM正在生成理由...',
        scoringPoint: data.scoringPoint || 0
      })
      
      generateReasonWithFeedback(
        data.text,
        targetType,
        data.scoringPoint || 0,
        currentStudentId.value,
        currentQuestionId.value,
        feedbackPanelRef
      )
    }
    return
  }
  
  // 处理其他操作（删除和重置）
  if (data.operation === 'remove' && data.text && data.type) {
    removeAnnotation(data.text, data.type, currentStudentId.value, currentQuestionId.value)
  } else if (data.operation === 'reset') {
    resetAllAnnotations(currentStudentId.value, currentQuestionId.value)
  }
}

// 单个批改
const startGrading = async () => {
  await executeSingleGrading(currentStudentId.value, currentQuestionId.value, actionSectionRef)
}

// 批量批改
const startBatchGrading = async (batchCount: number) => {
  await executeBatchGrading(batchCount, currentQuestionId.value, actionSectionRef)
}

const handleScoreChange = (data: { teacherScore: number; llmScore: number }) => {
  // Score change handled silently, no need for message
}

const handleModifyReason = () => {
  isInModifyMode.value = true
}

const handleSaveReason = (data: { highlight: any, reason: string }) => {
  logger.info('保存理由', {
    text: data.highlight.text.substring(0, 30) + '...',
    type: data.highlight.type,
    newReason: data.reason
  })
  
  // 更新HighlightData中的理由
  handleUpdateHighlightData({
    operation: 'add',
    text: data.highlight.text,
    type: data.highlight.type,
    reason: data.reason,
    scoringPoint: data.highlight.scoringPoint || 0
  })
  
  ElMessage.success('Reason saved')
}


// 提交理由示例
const handleSubmitReasonExample = (data: {
  text: string
  type: 'correct' | 'wrong' | 'unclear' | 'redundant'
  reason: string
}) => {
  addReasonExample({
    questionId: currentQuestionId.value,
    studentAnswer: data.text,
    highlightType: data.type,
    reason: data.reason
  })
  ElMessage.success('Reason example added to library')
}

// 设置金标试卷
const handleSaveAsGoldenExample = () => {
  const success = setGoldPaper(currentStudentId.value, currentQuestionId.value)
  
  if (success) {
    ElMessage.success('Paper set as golden standard, all reasons extracted to example library')
  } else {
    ElMessage.error('Failed to set golden standard, please check paper data')
  }
}

// 初始化
const initializeCurrentIds = () => {
  if (examDataStore.studentList.length > 0) {
    currentStudentId.value = examDataStore.studentList[0].id
  }

  if (examDataStore.questions.length > 0) {
    currentQuestionId.value = examDataStore.questions[0].question_id
  }

  logger.info('初始化当前选择', {
    studentId: currentStudentId.value,
    questionId: currentQuestionId.value,
  })
}

/**
 * ===== 初始化 =====
 */
onMounted(async () => {
  try {
    logger.info('Grading页面初始化开始')

    // 从本地恢复所有状态
    examDataStore.loadFromLocal()
    uploadStatusStore.loadFromLocal()

    logger.info('数据状态检查', {
      题目数量: examDataStore.questionCount,
      参考答案数量: examDataStore.referenceAnswerCount,
      学生数量: examDataStore.studentCount,
      答案数量: examDataStore.totalAnswerCount,
      数据完整性: examDataStore.isDataComplete
    })

    initializeCurrentIds()

    logger.info('Grading页面初始化完成')
  } catch (error) {
    logger.error('初始化失败', error)
    ElMessage.error('初始化失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
})
</script>

<style scoped>
/* ===== 主布局 ===== */
.grading-page {
  min-height: 100vh;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.grading-row {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}

.grading-row-top {
  height: 80px;
}

.grading-row-main {
  height: 500px;
  min-height: 500px;
}

/* ===== 导航控制 ===== */
.navigation-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  gap: 20px;
}

.nav-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-section label {
  font-weight: 500;
  color: #475569;
  min-width: 80px;
}

.nav-info {
  font-size: 14px;
  color: #64748b;
  min-width: 50px;
  text-align: center;
}

/* ===== 卡片悬停效果 ===== */
.hover {
  transition: all 0.3s ease;
}

.hover:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  transform: translateY(-4px) scale(1.01);
}

/* ===== 卡片样式 ===== */
.grading-card {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
}

/* ===== 卡片比例 ===== */
.scoring-card {
  flex: 7;
}

.action-card {
  flex: 3;
}

.preview-card {
  flex: 4;
}

.reference-card {
  flex: 3;
}

.feedback-card {
  flex: 3;
}

/* ===== 卡片头部 ===== */
.card-header {
  padding: 16px 20px;
  background: #f5f5f5;
  border-bottom: 1px solid #e5e5e5;
  height: 56px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
}

/* ===== 卡片内容 ===== */
.card-content {
  background: #ffffff;
  flex: 1;
  color: rgba(0, 0, 0, 0.87);
  overflow-y: auto;
  min-height: 0;
}

/* ===== 滚动条样式 ===== */
.grading-page :deep(*)::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.grading-page :deep(*)::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 2px;
}

.grading-page :deep(*)::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  transition: background 0.2s ease;
}

.grading-page :deep(*)::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

/* ===== 响应式 ===== */
@media (max-width: 1080px) {
  .grading-row {
    flex-direction: column;
    gap: 12px;
  }

  .grading-row-top {
    height: auto;
  }

  .grading-row-top .grading-card {
    height: 80px;
  }

  .grading-row-main {
    height: auto;
  }

  .grading-row-main .grading-card {
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .grading-page {
    gap: 12px;
    padding: 12px;
  }

  .grading-row {
    gap: 8px;
  }

  .grading-row-top .grading-card {
    height: 70px;
  }

  .grading-row-main .grading-card {
    min-height: 250px;
  }
}

@media (max-width: 480px) {
  .grading-page {
    gap: 8px;
    padding: 8px;
  }
}
</style>