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
          @submit-reason="handleSubmitReason"
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

// 导入分离式 Store
import { useExamDataStore } from '../../stores/useExamDataStore'
import { useUploadStatusStore } from '../../stores/useUploadStatusStore'

// 导入选择工具
import { selectStudents, validateSelection, getSelectionStats } from './utils/selectionUtils'

// 使用分离的 Store
const examDataStore = useExamDataStore()
const uploadStatusStore = useUploadStatusStore()

/**
 * ===== UI 状态管理 =====
 */
const currentStudentId = ref<number>(1)
const currentQuestionId = ref<number>(1)

/**
 * ===== 计算属性 =====
 */
// 当前题目信息
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

// 当前高亮数据
const currentHighlightData = computed(() => {
  if (!currentStudentId.value || !currentQuestionId.value) return null
  return examDataStore.getHighlightData(currentStudentId.value, currentQuestionId.value)
})

// 当前AI评分
const currentLLMScore = computed(() => {
  return currentHighlightData.value?.total_score || 0
})

// 当前题目满分
const currentMaxScore = computed(() => {
  return currentQuestion.value?.score || 0
})

/**
 * ===== 组件引用 =====
 */
const feedbackPanelRef = ref()
const paperPreviewRef = ref()
const highlightToolbarRef = ref()
const actionSectionRef = ref()

/**
 * ===== 辅助函数 =====
 */

// 生成理由并保存
const generateAndSaveReason = async (text: string, type: 'correct' | 'wrong' | 'unclear' | 'redundant', scoringPoint: number) => {
  let finalReason = '教师标注'
  
  try {
    const { generateReasonForHighlight, checkReasonGenerationServiceStatus } = await import('../../services/llm/grading/reasonGenerationService')
    
    const serviceStatus = checkReasonGenerationServiceStatus()
    if (serviceStatus.available) {
      const question = examDataStore.getQuestionById(currentQuestionId.value)
      const referenceAnswer = examDataStore.getReferenceAnswer(currentQuestionId.value)
      const studentAnswer = examDataStore.getStudentAnswer(currentStudentId.value, currentQuestionId.value)
      
      if (question && referenceAnswer && studentAnswer) {
        const reasonResult = await generateReasonForHighlight({
          question,
          referenceAnswer,
          studentAnswer,
          highlightedText: text,
          highlightType: type
        })
        
        if (reasonResult.success && reasonResult.reason) {
          finalReason = reasonResult.reason
        }
      }
    }
  } catch (error) {
    console.error('理由生成失败:', error)
  }
  
  // 保存到数据
  if (!currentHighlightData.value) {
    console.warn('没有高亮数据，无法保存标注')
    return
  }
  
  const targetArray = currentHighlightData.value.answer[type]
  const newItem = {
    'Student answer': text,
    'Scoring point': scoringPoint,
    reason: finalReason
  }
  targetArray.push(newItem)
  
  // 更新反馈面板显示最终理由
  const finalHighlightData = {
    text: text,
    type: type,
    reason: finalReason,
    scoringPoint: scoringPoint
  }
  feedbackPanelRef.value?.handleHighlightClicked(finalHighlightData)
  
  // 保存到本地
  examDataStore.saveToLocal()
}

/**
 * ===== 事件处理 =====
 */
const handleStudentChange = (studentId: number) => {
  if (studentId === currentStudentId.value) return

  const studentExists = examDataStore.studentList.some((student) => student.id === studentId)

  if (!studentExists) {
    ElMessage.warning(`学生 ${studentId} 不存在`)
    return
  }

  currentStudentId.value = studentId
  ElMessage.success(`切换到学生 ${studentId}`)
  console.log('切换学生:', studentId)
}

const handleQuestionChange = (question: { id: number; name: string; score: number }) => {
  if (question.id === currentQuestionId.value) return

  const questionExists = examDataStore.getQuestionById(question.id)

  if (!questionExists) {
    ElMessage.warning(`题目 ${question.id} 不存在`)
    return
  }

  currentQuestionId.value = question.id
  ElMessage.success(`切换到第${question.id}题，满分${questionExists.score}分`)
  console.log('切换题目:', question.id)
}

// 高亮点击事件处理
const handleHighlightClicked = (data: { text: string; type: string; reason: string; scoringPoint: number }) => {
  console.log('[Grading] 高亮点击事件:', {
    text: data.text.substring(0, 30) + '...',
    type: data.type,
    hasReason: !!data.reason
  })
  feedbackPanelRef.value?.handleHighlightClicked(data)
}

// 更新HighlightData的核心方法
const handleUpdateHighlightData = async (data: {
  operation: 'add' | 'remove' | 'reset'
  text?: string
  type?: string
  reason?: string
  scoringPoint?: number
}) => {
  console.log('[Grading] 更新HighlightData:', {
    operation: data.operation,
    text: data.text ? data.text.substring(0, 30) + '...' : undefined,
    type: data.type
  })
  
  if (!currentHighlightData.value) {
    console.warn('没有当前HighlightData，无法更新')
    return
  }
  
  const validTypes = ['correct', 'wrong', 'unclear', 'redundant'] as const
  
  if (data.operation === 'add' && data.text && data.type) {
    // 验证类型
    if (!validTypes.includes(data.type as any)) {
      console.error('无效的标注类型:', data.type)
      return
    }
    
    const targetType = data.type as 'correct' | 'wrong' | 'unclear' | 'redundant'
    const targetArray = currentHighlightData.value.answer[targetType]
    
    // 立即显示"正在生成理由"到反馈面板
    const tempHighlightData = {
      text: data.text,
      type: targetType,
      reason: '当前LLM正在生成理由...',
      scoringPoint: data.scoringPoint || 0
    }
    feedbackPanelRef.value?.handleHighlightClicked(tempHighlightData)
    
    // 异步生成理由
    generateAndSaveReason(data.text, targetType, data.scoringPoint || 0)
    
  } else if (data.operation === 'remove' && data.text && data.type) {
    // 验证类型
    if (!validTypes.includes(data.type as any)) {
      console.error('无效的标注类型:', data.type)
      return
    }
    
    // 移除标注
    const targetType = data.type as 'correct' | 'wrong' | 'unclear' | 'redundant'
    const targetArray = currentHighlightData.value.answer[targetType]
    const index = targetArray.findIndex((item: any) => item['Student answer'] === data.text)
    if (index !== -1) {
      targetArray.splice(index, 1)
      console.log('移除标注')
    }
    
  } else if (data.operation === 'reset') {
    // 重置所有标注
    currentHighlightData.value.answer.correct = []
    currentHighlightData.value.answer.wrong = []
    currentHighlightData.value.answer.unclear = []
    currentHighlightData.value.answer.redundant = []
    currentHighlightData.value.total_score = 0
    console.log('重置所有标注')
  }
  
  // 保存到store
  examDataStore.saveToLocal()
}

// 开始给分
const startGrading = async () => {
  if (!examDataStore.isDataComplete) {
    ElMessage.warning('Please complete all data uploads first')
    return
  }

  try {
    // 检查当前答案是否已经给分
    const existingResult = examDataStore.getHighlightData(
      currentStudentId.value,
      currentQuestionId.value
    )
    // 允许重新批改
    if (existingResult) {
      ElMessage.info(`Re-grading current answer (previous score: ${existingResult.total_score} points)...`)
    }

    ElMessage.info('Starting AI grading for current student...')

    // 导入单个学生给分服务
    const { gradeSingleStudentAnswer, checkGradingServiceStatus } = await import('../../services/llm/grading/gradingLLMService')
    
    // 检查服务状态
    const serviceStatus = checkGradingServiceStatus()
    if (!serviceStatus.available) {
      ElMessage.warning(serviceStatus.message)
      return
    }

    // 获取当前上下文数据
    const question = examDataStore.getQuestionById(currentQuestionId.value)
    const referenceAnswer = examDataStore.getReferenceAnswer(currentQuestionId.value)
    const studentAnswer = examDataStore.getStudentAnswer(currentStudentId.value, currentQuestionId.value)

    // 验证当前上下文
    if (!question) {
      throw new Error(`Question ${currentQuestionId.value} not found`)
    }
    if (!referenceAnswer) {
      throw new Error(`Reference answer for question ${currentQuestionId.value} not found`)
    }
    if (!studentAnswer) {
      throw new Error(`Student ${currentStudentId.value} answer for question ${currentQuestionId.value} not found`)
    }

    console.log('Grading context:', {
      studentId: currentStudentId.value,
      questionId: currentQuestionId.value,
      question: question.question.substring(0, 50) + '...',
      answerLength: studentAnswer.answer.length
    })

    // 调用单个学生给分服务
    const gradingResult = await gradeSingleStudentAnswer({
      question,
      referenceAnswer,
      studentAnswer
    })

    if (!gradingResult.success) {
      throw new Error(gradingResult.error || 'Grading failed')
    }

    if (!gradingResult.data || gradingResult.data.length === 0) {
      throw new Error('Grading result is empty')
    }

    // 直接使用AI批改结果覆盖现有数据
    examDataStore.addHighlightData(gradingResult.data[0])
    console.log('AI批改完成')

    // 保存到本地存储
    examDataStore.saveToLocal()

    // 显示成功消息
    ElMessage.success(`Grading completed! Score: ${gradingResult.data[0].total_score} points`)

    // 重置ActionSection加载状态
    if (actionSectionRef.value) {
      actionSectionRef.value.resetGradingState()
    }
  } catch (error) {
    console.error('AI grading failed:', error)
    ElMessage.error(`AI grading failed: ${error instanceof Error ? error.message : 'Unknown error'}`)

    // 重置加载状态
    if (actionSectionRef.value) {
      actionSectionRef.value.resetGradingState()
    }
  }
}

// 批量给分
const startBatchGrading = async (batchCount: number) => {
  if (!examDataStore.isDataComplete) {
    ElMessage.warning('Please complete all data uploads first')
    return
  }

  try {
    ElMessage.info(`Starting batch grading for ${batchCount} randomly selected papers...`)

    // 设置批量给分状态
    if (actionSectionRef.value) {
      actionSectionRef.value.setBatchGradingState(true)
    }

    // 导入给分服务
    const { gradeSingleStudentAnswer, checkGradingServiceStatus } = await import('../../services/llm/grading/gradingLLMService')
    
    // 检查服务状态
    const serviceStatus = checkGradingServiceStatus()
    if (!serviceStatus.available) {
      ElMessage.warning(serviceStatus.message)
      return
    }

    // 获取当前题目信息
    const question = examDataStore.getQuestionById(currentQuestionId.value)
    const referenceAnswer = examDataStore.getReferenceAnswer(currentQuestionId.value)

    if (!question || !referenceAnswer) {
      throw new Error(`Current question or reference answer not found`)
    }

    // 获取所有学生ID并随机选择
    const allStudentIds = examDataStore.studentList.map(student => student.id)
    const selectedStudentIds = selectStudents(allStudentIds, batchCount)
    
    // 验证选择结果
    const validation = validateSelection(allStudentIds, selectedStudentIds, batchCount)
    if (!validation.valid) {
      throw new Error(`Selection validation failed: ${validation.errors.join(', ')}`)
    }
    
    // 获取选择统计信息
    const stats = getSelectionStats(allStudentIds, selectedStudentIds)
    
    console.log('Batch grading info:', {
      totalStudents: stats.totalCount,
      selectedCount: stats.selectedCount,
      selectionRate: `${(stats.selectionRate * 100).toFixed(1)}%`,
      selectedIds: stats.selectedIds,
      unselectedIds: stats.unselectedIds.slice(0, 5), // 只显示前5个未选中的ID
      questionId: currentQuestionId.value
    })
    
    ElMessage.info(`Selected ${stats.selectedCount} out of ${stats.totalCount} students (${(stats.selectionRate * 100).toFixed(1)}% selection rate)`)

    // 逐个批改学生答案
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < selectedStudentIds.length; i++) {
      const studentId = selectedStudentIds[i]
      
      try {
        // 检查是否已经批改过
        const existingResult = examDataStore.getHighlightData(studentId, currentQuestionId.value)
        if (existingResult) {
          console.log(`Student ${studentId} already graded, re-grading...`)
        }

        // 获取学生答案
        const studentAnswer = examDataStore.getStudentAnswer(studentId, currentQuestionId.value)
        if (!studentAnswer) {
          console.warn(`Student ${studentId} answer not found, skipping...`)
          continue
        }

        ElMessage.info(`Grading student ${studentId} (${i + 1}/${selectedStudentIds.length})...`)

        // 调用单个学生给分服务
        const gradingResult = await gradeSingleStudentAnswer({
          question,
          referenceAnswer,
          studentAnswer
        })

        if (gradingResult.success && gradingResult.data && gradingResult.data.length > 0) {
          // 直接使用AI批改结果覆盖现有数据
          examDataStore.addHighlightData(gradingResult.data[0])
          successCount++
          
          console.log(`Student ${studentId} graded successfully: ${gradingResult.data[0].total_score} points`)
        } else {
          throw new Error(gradingResult.error || 'Grading result is empty')
        }

        // 添加延迟避免API限流
        if (i < selectedStudentIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }

      } catch (error) {
        console.error(`Failed to grade student ${studentId}:`, error)
        errorCount++
      }
    }

    // 保存到本地存储
    examDataStore.saveToLocal()

    // 显示批量给分结果
    if (successCount > 0) {
      ElMessage.success(`Batch grading completed! ${successCount} papers graded successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`)
    } else {
      ElMessage.error(`Batch grading failed! ${errorCount} papers failed`)
    }

    // 重置ActionSection状态
    if (actionSectionRef.value) {
      actionSectionRef.value.resetBatchGradingState()
    }

  } catch (error) {
    console.error('Batch grading failed:', error)
    ElMessage.error(`Batch grading failed: ${error instanceof Error ? error.message : 'Unknown error'}`)

    // 重置状态
    if (actionSectionRef.value) {
      actionSectionRef.value.resetBatchGradingState()
    }
  }
}

const handleScoreChange = (data: { teacherScore: number; llmScore: number }) => {
  ElMessage.info(`教师评分: ${data.teacherScore}分 (LLM评分: ${data.llmScore}分)`)
}

const handleModifyReason = () => {
  ElMessage.info('理由编辑模式')
}

const handleSaveReason = (data: { highlight: any, reason: string }) => {
  console.log('[Grading] 保存理由:', {
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
  
  ElMessage.success('理由已保存')
}

const handleSubmitReason = () => {
  ElMessage.success('理由已提交，重新评分中...')
  // TODO: 提交教师反馈并触发AI重新评分
}

/**
 * ===== 初始化当前选择 =====
 */
const initializeCurrentIds = () => {
  // 设置第一个可用的学生和题目
  if (examDataStore.studentList.length > 0) {
    currentStudentId.value = examDataStore.studentList[0].id
  }

  if (examDataStore.questions.length > 0) {
    currentQuestionId.value = examDataStore.questions[0].question_id
  }

  console.log('初始化当前选择:', {
    studentId: currentStudentId.value,
    questionId: currentQuestionId.value,
  })
}

/**
 * ===== 初始化 =====
 */
onMounted(async () => {
  try {
    console.log('Grading页面初始化开始')

    // 从本地恢复所有状态
    examDataStore.loadFromLocal()
    uploadStatusStore.loadFromLocal()

    console.log('数据状态检查:')
    console.log('- 题目数量:', examDataStore.questionCount)
    console.log('- 参考答案数量:', examDataStore.referenceAnswerCount)
    console.log('- 学生数量:', examDataStore.studentCount)
    console.log('- 答案数量:', examDataStore.totalAnswerCount)
    console.log('- 数据完整性:', examDataStore.isDataComplete)

    initializeCurrentIds()

    console.log('Grading页面初始化完成')
  } catch (error) {
    console.error('初始化失败:', error)
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