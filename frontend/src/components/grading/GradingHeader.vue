<template>
  <div class="page-header">
    <div class="header-content">
      <!-- 题目选择区域 -->
      <div class="select-section">
        <h1>Select Question</h1>
        <div class="select-list">
          <div
            v-for="(question, index) in questions"
            :key="question.question_id"
            :class="['select-item', { active: currentQuestion === index + 1 }]"
            @click="handleQuestionChange(index + 1, question)"
            :title="`${question.question.substring(0, 50)}...（${question.score}分）`"
          >
            Question {{ index + 1 }}
          </div>
        </div>
      </div>

      <!-- 学生选择区域 -->
      <div class="select-section">
        <h1>Select Student</h1>
        <div class="select-list">
          <div
            v-for="student in studentList"
            :key="student.id"
            :class="[
              'select-item circle',
              {
                active: currentStudentId === student.id,
                graded: gradedPapers.includes(student.id),
                golden: isStudentGolden(student.id),
              },
            ]"
            @click="handleStudentChange(student.id)"
            :title="`学生ID: ${student.id}${getStudentStatusText(student.id)}`"
          >
            {{ student.id }}
          </div>
        </div>
      </div>

      <!-- 统计信息概览 -->
      <div class="statistics-overview">
        <el-row :gutter="10">
          <!-- 批改进度 -->
          <el-col :span="5">
            <div class="stat-item">
              <span class="label">Marked/Total</span>
              <span class="value">{{ gradedCount }}/{{ totalStudents }}</span>
            </div>
          </el-col>

          <!-- 最高分（可点击跳转） -->
          <el-col :span="5">
            <div class="stat-item clickable" @click="jumpToStudent(statistics.highestStudent)">
              <span class="label">Highest</span>
              <span class="value highlight-good">{{ statistics.highest }}</span>
            </div>
          </el-col>

          <!-- 最低分（可点击跳转） -->
          <el-col :span="5">
            <div class="stat-item clickable" @click="jumpToStudent(statistics.lowestStudent)">
              <span class="label">Lowest</span>
              <span class="value highlight-poor">{{ statistics.lowest }}</span>
            </div>
          </el-col>

          <!-- 平均分 -->
          <el-col :span="5">
            <div class="stat-item">
              <span class="label">Average</span>
              <span class="value">{{ statistics.average }}</span>
            </div>
          </el-col>

          <!-- 当前题目查看 -->
          <el-col :span="4">
            <div class="stat-item clickable" @click="showCurrentQuestion">
              <span class="label">Current Question</span>
              <span class="value icon-value">
                <el-icon><Document /></el-icon>
              </span>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 题目浮动窗口 -->
    <teleport to="body">
      <div 
        v-if="questionDialogVisible" 
        class="question-float"
        :style="{ left: position.x + 'px', top: position.y + 'px' }"
      >
        <div class="float-header" @mousedown="startDrag">
          <span class="float-title">
            <el-icon class="title-icon"><Document /></el-icon>
            Current Question
          </span>
          <el-button type="text" size="small" class="close-btn"
            @click="questionDialogVisible = false"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        <div class="float-body">{{ currentQuestionText }}</div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { Document, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'

/**
 * ===== TypeScript 接口定义 =====
 */
interface HighlightData {
  student_id: number
  question_id: number
  answer: {
    correct: any[]
    wrong: any[]
    unclear: any[]
    redundant: any[]
  }
  total_score: number
  isGold?: boolean
}

interface Props {
  currentQuestion: number
  currentStudentId: number
  questions: Array<{
    question_id: number
    question: string
    score: number
  }>
  studentList: Array<{ id: number }>
  highlightDataList: HighlightData[]
}

const props = defineProps<Props>()

/**
 * ===== 浮动窗口状态 =====
 */
const questionDialogVisible = ref(false)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const position = ref({ x: 200, y: 150 })

/**
 * ===== 拖拽功能 =====
 */
const startDrag = (e: MouseEvent) => {
  isDragging.value = true
  dragOffset.value = { x: e.offsetX, y: e.offsetY }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return
  position.value = {
    x: Math.max(0, Math.min(e.clientX - dragOffset.value.x, window.innerWidth - 400)),
    y: Math.max(0, Math.min(e.clientY - dragOffset.value.y, window.innerHeight - 200))
  }
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

/**
 * ===== 计算属性 =====
 */
const totalStudents = computed(() => props.studentList.length)

const gradedPapers = computed(() => {
  return props.highlightDataList
    .filter((data) => data.question_id === props.currentQuestion)
    .map((data) => data.student_id)
})

const gradedCount = computed(() => gradedPapers.value.length)

const currentQuestionData = computed(() => {
  return props.questions.find(q => q.question_id === props.currentQuestion)
})

const currentQuestionText = computed(() => {
  const question = currentQuestionData.value
  if (!question) return '请先上传试卷文件'
  return question.question || '暂无题目内容'
})

const statistics = computed(() => {
  const currentQuestionScores = props.highlightDataList
    .filter((data) => data.question_id === props.currentQuestion)
    .map((data) => ({ studentId: data.student_id, score: data.total_score }))

  if (currentQuestionScores.length === 0) {
    return {
      highest: 0, lowest: 0, average: 0,
      highestStudent: { id: undefined },
      lowestStudent: { id: undefined }
    }
  }

  const scores = currentQuestionScores.map((item) => item.score)
  const highest = Math.max(...scores)
  const lowest = Math.min(...scores)
  const average = Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10

  const highestStudent = currentQuestionScores.find((item) => item.score === highest)
  const lowestStudent = currentQuestionScores.find((item) => item.score === lowest)

  return {
    highest, lowest, average,
    highestStudent: { id: highestStudent?.studentId },
    lowestStudent: { id: lowestStudent?.studentId }
  }
})

/**
 * ===== 事件定义 =====
 */
const emits = defineEmits<{
  (e: 'questionChange', question: { id: number; name: string; score: number }): void
  (e: 'studentChange', studentId: number): void
}>()

/**
 * ===== 事件处理 =====
 */
const handleStudentChange = (studentId: number) => {
  if (!studentId) {
    ElMessage.warning('Invalid student ID')
    return
  }
  emits('studentChange', studentId)
}

const handleQuestionChange = (questionIndex: number, question: any) => {
  emits('questionChange', {
    id: questionIndex,
    name: `第${questionIndex}题`,
    score: question.score
  })
}

const showCurrentQuestion = () => {
  if (!props.currentQuestion) {
    ElMessage.warning('Please select a question first')
    return
  }
  questionDialogVisible.value = true
}

const jumpToStudent = (student: { id?: number } | undefined) => {
  if (!student?.id) {
    ElMessage.warning('Student information not found')
    return
  }
  handleStudentChange(student.id)
}

/**
 * ===== 金标相关方法 =====
 */
// 检查学生是否为金标
const isStudentGolden = (studentId: number): boolean => {
  // 遍历高亮数据，检查该学生在当前题目下是否为金标
  const highlightData = props.highlightDataList.find(
    data => data.student_id === studentId && data.question_id === props.currentQuestion
  )
  
  return highlightData?.isGold === true
}

// 获取学生状态文本
const getStudentStatusText = (studentId: number): string => {
  if (isStudentGolden(studentId)) {
    return '（金标试卷）'
  } else if (gradedPapers.value.includes(studentId)) {
    return '（已批改）'
  } else {
    return '（未批改）'
  }
}
</script>

<style scoped>
/**
 * ===== 主容器样式 =====
 */
.page-header {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  padding: 16px 20px;
  border-radius: 12px;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/**
 * ===== 选择区域样式 =====
 */
.select-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.select-section h1 {
  margin: 0;
  color: rgba(0, 0, 0, 0.87);
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  min-width: 120px;
}

.select-list {
  display: flex;
  gap: 8px;
  padding: 4px;
  overflow-x: auto;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.03);
}

.select-list::-webkit-scrollbar {
  height: 4px;
}

.select-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 2px;
}

.select-list::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  transition: background 0.2s ease;
}

/**
 * ===== 选择项样式 =====
 */
.select-item {
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  flex-shrink: 0;
  border: 1px solid transparent;
  user-select: none;
}

.select-item:hover {
  background-color: #e5e5e5;
  transform: translateY(-1px);
}

.select-item.active {
  background-color: #007aff;
  color: #ffffff;
  border-color: #007aff;
}

.select-item.circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  padding: 0;
}

.select-item.graded {
  background-color: #4cd964;
  color: #ffffff;
  border-color: #4cd964;
}

.select-item.graded:hover {
  background-color: #3ac85a;
}

.select-item.golden {
  background-color: #ffd700 !important;
  color: #000000 !important;
  border-color: #ffd700 !important;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3) !important;
}

.select-item.golden:hover {
  background-color: #ffcc00 !important;
  box-shadow: 0 3px 12px rgba(255, 215, 0, 0.4) !important;
}

/**
 * ===== 统计信息样式 =====
 */
.statistics-overview {
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid #e5e5e5;
}

.stat-item {
  text-align: center;
  padding: 12px 8px;
  background-color: #f5f5f5;
  border-radius: 12px;
  height: 100%;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.stat-item.clickable {
  cursor: pointer;
}

.stat-item.clickable:hover {
  background-color: #e5e5e5;
  transform: translateY(-1px);
  border-color: #007aff;
}

.stat-item .label {
  display: block;
  color: rgba(0, 0, 0, 0.6);
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 4px;
}

.stat-item .value {
  display: block;
  color: #007aff;
  font-size: 16px;
  font-weight: 600;
}

.value.highlight-good {
  color: #4cd964;
}

.value.highlight-poor {
  color: #ff3b30;
}

.value.icon-value {
  font-size: 18px;
}

/**
 * ===== 浮动窗口样式 =====
 */
.question-float {
  position: fixed;
  width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 3000;
  border: 1px solid #e5e5e5;
}

.float-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #f3f2f2;
  border-bottom: 1px solid #e5e5e5;
  border-radius: 12px 12px 0 0;
  cursor: move;
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
}

.float-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.title-icon {
  font-size: 16px;
  color: #007aff;
}

.close-btn {
  padding: 4px !important;
  min-height: auto !important;
  margin: 0 !important;
}

.close-btn :deep(.el-icon) {
  font-size: 16px;
}

.float-body {
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-line;
  line-height: 1.6;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
}

/**
 * ===== 响应式设计 =====
 */
@media (max-width: 768px) {
  .page-header {
    padding: 12px 16px;
  }

  .header-content {
    gap: 12px;
  }

  .select-section {
    gap: 12px;
  }

  .select-section h1 {
    min-width: 80px;
    font-size: 14px;
  }

  .statistics-overview {
    padding-top: 8px;
    margin-top: 8px;
  }

  .stat-item {
    padding: 8px 4px;
  }

  .stat-item .value {
    font-size: 14px;
  }

  .statistics-overview :deep(.el-col) {
    margin-bottom: 8px;
  }

  .question-float {
    width: 90%;
    max-width: 350px;
  }
}

@media (max-width: 480px) {
  .select-section {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .select-section h1 {
    min-width: unset;
    text-align: center;
  }
}
</style>