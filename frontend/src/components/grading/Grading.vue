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
      />
    </div>
    <!-- 第二行：预览 + 参考答案 + 反馈 (4:3:3) -->
    <div class="grading-row grading-row-main">
      <!-- 预览区域 -->
      <div class="grading-card preview-card hover">
        <highlight-toolbar
          ref="highlightToolbarRef"
          :paper-preview-ref="paperPreviewRef"
          @mark-answer="handleMarkAnswer"
        />
        <paper-preview
          ref="paperPreviewRef"
          :student-answer="currentStudentAnswer"
          :highlight-data="currentHighlightData"
          @mark-answer="handleMarkAnswer"
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
          :current-highlight-data="currentHighlightData"
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
  console.log('👤 切换学生:', studentId)
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
  console.log('📝 切换题目:', question.id)
}

// 事件转发
const handleHighlightClicked = (data: any) => {
  feedbackPanelRef.value?.handleHighlightClicked(data)
}

const handleMarkAnswer = (data: any) => {
  feedbackPanelRef.value?.handleMarkAnswer(data)
}

// 批改相关事件
const startGrading = async () => {
  if (!examDataStore.isDataComplete) {
    ElMessage.warning('请先完成所有数据上传')
    return
  }

  try {
    ElMessage.info('开始AI评分...')

    // TODO: 后续开发时替换为真实的AI API调用
    // 当前使用本地JSON文件模拟AI评分结果
    // 实际实现时应该：
    // 1. 收集当前学生答案和参考答案
    // 2. 调用AI评分API (例如: POST /api/grading/start)
    // 3. 处理返回的评分结果
    // 4. 支持批量评分和单个评分模式

    // 读取模拟的AI评分数据
    const response = await fetch('/paper/example1/student_answer_marked.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const aiGradingData = await response.json()

    // 将AI评分数据设置到store中
    examDataStore.setHighlightData(aiGradingData)

    // 保存到本地存储
    examDataStore.saveToLocal()

    // 如果当前显示的学生和题目有评分数据，立即刷新显示
    const currentData = examDataStore.getHighlightData(
      currentStudentId.value,
      currentQuestionId.value,
    )
    if (currentData) {
      ElMessage.info(`当前答案评分：${currentData.total_score}分`)
    }

    // 重置ActionSection的loading状态
    if (actionSectionRef.value) {
      actionSectionRef.value.resetGradingState()
    }
  } catch (error) {
    console.error('❌ AI评分失败:', error)
    ElMessage.error(`AI评分失败: ${error instanceof Error ? error.message : '未知错误'}`)

    // 出错时也要重置loading状态
    if (actionSectionRef.value) {
      actionSectionRef.value.resetGradingState()
    }
  }
}

const handleScoreChange = (data: { teacherScore: number; llmScore: number }) => {
  ElMessage.info(`教师评分: ${data.teacherScore}分 (LLM评分: ${data.llmScore}分)`)
  // TODO: 保存教师评分变更到JSON文件
  // 后续实现：
  // 1. 更新teacher_scores.json文件中的评分数据
  // 2. 保存评分历史到feedback_history.json
  // 3. 实现自动保存和版本控制
  // 4. 添加评分变更的撤销/重做功能
}

const handleModifyReason = () => {
  ElMessage.info('理由编辑模式')
}

const handleSaveReason = () => {
  ElMessage.success('理由已保存')
  // TODO: 保存评分理由到JSON文件
  // 后续实现：
  // 1. 获取当前编辑的理由内容
  // 2. 保存到feedback_history.json文件
  // 3. 关联到具体的学生、题目和评分项
  // 4. 支持理由模板的使用和管理
}

const handleSubmitReason = () => {
  ElMessage.success('理由已提交，重新评分中...')
  // TODO: 提交教师反馈并触发AI重新评分
  // 后续实现：
  // 1. 收集教师的修改意见和反馈
  // 2. 调用第三方AI API重新评分 (例如: OpenAI GPT-4)
  // 3. 更新grading_results.json文件
  // 4. 刷新界面的评分结果和高亮显示
  // 5. 保存重新评分的历史到feedback_history.json
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

  console.log('🎯 初始化当前选择:', {
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