<template>
  <div class="uploading-container">
    <!-- 试卷上传组件 -->
    <component :is="PaperUpload.default"
      :status="uploadStore.examPaper.status"
      :file-name="uploadStore.examPaper.name"
      :display-text="paperDisplayText"
      :error="uploadStore.examPaper.error"
      @file-selected="handlePaperSelected"
      @remove="handlePaperRemove"
      @preview="handlePaperPreview"
    />

    <!-- 参考答案上传组件 -->
    <component :is="AnswerUpload.default"
      :disabled="!uploadStore.canUploadAnswer"
      :status="uploadStore.referenceAnswer.status"
      :file-name="uploadStore.referenceAnswer.name"
      :display-text="answerDisplayText"
      :error="uploadStore.referenceAnswer.error"
      @file-selected="handleAnswerSelected"
      @remove="handleAnswerRemove"
      @preview="handleAnswerPreview"
    />

    <!-- 学生答案上传组件 -->
    <component :is="StudentUpload.default"
      :disabled="!uploadStore.canUploadStudent"
      :status="uploadStore.studentAnswers.status"
      :file-name="uploadStore.studentAnswers.name"
      :display-text="studentDisplayText"
      :error="uploadStore.studentAnswers.error"
      @file-selected="handleStudentSelected"
      @remove="handleStudentRemove"
      @preview="handleStudentPreview"
    />

    <!-- 重置按钮 -->
    <div class="reset-button-container">
      <el-button type="danger" @click="resetAll">
        <el-icon><RefreshLeft /></el-icon>
        Reset All
      </el-button>
    </div>

    <!-- 统一预览弹窗 -->
    <component
      :is="Preview.default"
      v-model="previewDialog.visible"
      :title="previewDialog.title"
      :content="previewDialog.content"
    />

    <!-- 自动批改进度与错误展示 -->
    <div v-if="gradingStatus !== 'idle'" class="auto-grading-status">
      <div>{{ gradingMessage }}</div>
      <div v-if="gradingStatus === 'grading'">
        <el-progress :percentage="Math.round((gradingProgress.current / gradingProgress.total) * 100)" :text-inside="true" :stroke-width="18" status="active" />
        <div>{{ gradingProgress.current }}/{{ gradingProgress.total }}</div>
      </div>
      <div v-if="gradingErrors.length > 0" class="auto-grading-errors">
        <el-alert title="批改出错（不影响整体进度）" type="error" show-icon :closable="false">
          <ul>
            <li v-for="err in gradingErrors" :key="err.studentId + '-' + err.questionId">
              学生ID: {{ err.studentId }}，题目ID: {{ err.questionId }}，错误: {{ err.error }}
            </li>
          </ul>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import {
  askToSaveJsonResult,
  isJsonFile,
  readFileContent,
  validateJsonData,
} from '../../services/file/fileReaders'
import { uploadLLMService } from '../../services/llm'
import { useExamDataStore } from '../../stores/useExamDataStore'
import { useUploadStatusStore } from '../../stores/useUploadStatusStore'
import { logger } from '../../utils/logger'
import * as AnswerUpload from './AnswerUpload.vue'
import * as PaperUpload from './PaperUpload.vue'
import * as Preview from './preview.vue'
import * as StudentUpload from './StudentUpload.vue'

// 使用 Store
const uploadStore = useUploadStatusStore()
const examStore = useExamDataStore()

// 预览弹窗状态
const previewDialog = ref({
  visible: false,
  title: '',
  content: '',
})

// ===== 计算属性：显示文本 =====
const paperDisplayText = computed(() => {
  const paper = uploadStore.examPaper
  if (paper.status === 'error') return paper.error || 'Parsing failed'
  if (paper.status === 'ready') {
    const questionCount = paper.meta?.questionCount || 0
    return `Current paper: ${paper.name} (Total ${questionCount} questions)`
  }
  return ''
})

const answerDisplayText = computed(() => {
  const answer = uploadStore.referenceAnswer
  if (answer.status === 'error') return answer.error || 'Parsing failed'
  if (answer.status === 'ready') {
    const answerCount = answer.meta?.answerCount || 0
    return `Current answer: ${answer.name} (Total ${answerCount} answers)`
  }
  return ''
})

const studentDisplayText = computed(() => {
  const student = uploadStore.studentAnswers
  if (student.status === 'error') return student.error || 'Parsing failed'
  if (student.status === 'ready') {
    const studentCount = student.meta?.studentCount || 0
    const answerCount = student.meta?.answerCount || 0
    return `Student answer: ${student.name} (${studentCount} students, ${answerCount} answers)`
  }
  return ''
})

// ===== 自动批改进度与错误展示 =====
const gradingStatus = computed(() => uploadStore.autoGradingStatus)
const gradingProgress = computed(() => uploadStore.autoGradingProgress)
const gradingMessage = computed(() => uploadStore.autoGradingMessage)
const gradingErrors = computed(() => uploadStore.autoGradingErrors)

// ===== 类型定义 =====
type FileType = 'paper' | 'answer' | 'student'

interface FileTypeConfig {
  displayName: string
  setUploading: (fileName: string, content: string) => void
  setReady: (data: any, meta: any) => void
  setError: (error: string) => void
  updateStore: (data: any) => { count: number; message: string }
}

// ===== 配置映射 =====
const fileTypeConfigs: Record<FileType, FileTypeConfig> = {
  paper: {
    displayName: 'Paper',
    setUploading: (fileName, content) => uploadStore.setPaperUploading(fileName, content),
    setReady: (data, meta) => uploadStore.setPaperReady(data, meta),
    setError: (error) => uploadStore.setPaperError(error),
    updateStore: (data) => {
      examStore.setQuestions(data.questions)
      return {
        count: data.questions.length,
        message: `Paper uploaded successfully! Parsed ${data.questions.length} questions`
      }
    }
  },
  answer: {
    displayName: 'Reference answer',
    setUploading: (fileName, content) => uploadStore.setAnswerUploading(fileName, content),
    setReady: (data, meta) => uploadStore.setAnswerReady(data, meta),
    setError: (error) => uploadStore.setAnswerError(error),
    updateStore: (data) => {
      examStore.setReferenceAnswers(data.answers)
      return {
        count: data.answers.length,
        message: `Reference answer uploaded successfully! Parsed ${data.answers.length} answers`
      }
    }
  },
  student: {
    displayName: 'Student answer',
    setUploading: (fileName, content) => uploadStore.setStudentUploading(fileName, content),
    setReady: (data, meta) => uploadStore.setStudentReady(data, meta),
    setError: (error) => uploadStore.setStudentError(error),
    updateStore: (data) => {
      examStore.setStudentAnswers(data)
      const uniqueStudentIds = [...new Set(data.map((item: any) => item.student_id))]
      return {
        count: uniqueStudentIds.length,
        message: `Student answer uploaded successfully! Parsed ${uniqueStudentIds.length} students, ${data.length} answers`
      }
    }
  }
}

// ===== 核心处理函数：统一的文件处理流程 =====
const processFile = async (file: File, type: FileType) => {
  const config = fileTypeConfigs[type]
  
  logger.group('文件处理', `${config.displayName}: ${file.name}`)
  
  try {
    // 1. 读取文件内容
    logger.info('读取文件内容', { 文件名: file.name, 文件大小: `${file.size} bytes` })
    const content = await readFileContent(file)
    if (!content?.trim()) {
      throw new Error('File content is empty or parsing failed')
    }
    logger.success('文件内容读取成功', { 内容长度: content.length })

    // 2. 设置上传状态
    config.setUploading(file.name, content)
    logger.info('上传状态已设置')

    // 3. 解析数据
    let parsedData
    if (isJsonFile(file.name)) {
      logger.info('检测到JSON文件，直接解析')
      parsedData = JSON.parse(content)
      validateJsonData(parsedData, type)
    } else {
      logger.info('检测到非JSON文件，使用AI解析')
      
      if (!uploadLLMService.isAvailable()) {
        throw new Error('AI parsing service is not available, please upload a JSON file or check the API configuration')
      }
      
      if (type === 'student') {
        throw new Error('Student answer must be in JSON format')
      }
      
      parsedData = await uploadLLMService.Parse(content, type)
      validateJsonData(parsedData, type)
      await askToSaveJsonResult(parsedData, file.name, type)
    }
    
    logger.success('数据解析成功', { 数据类型: typeof parsedData })

    // 4. 更新数据和状态
    const { count, message } = config.updateStore(parsedData)
    
    const meta = type === 'student' 
      ? { studentCount: count, answerCount: parsedData.length }
      : type === 'paper'
      ? { questionCount: count }
      : { answerCount: count }
    
    config.setReady(parsedData, meta)
    ElMessage.success(message)
    logger.success('数据更新完成', { 解析数量: count })

    // 5. 保存到本地存储
    examStore.saveToLocal()
    uploadStore.saveToLocal()
    logger.saved('数据已保存到本地存储')
  } catch (error: any) {
    const errorMessage = error.message || '未知错误'
    logger.error(`${config.displayName}处理失败`, { 错误: errorMessage, 文件: file.name })
    
    config.setError(errorMessage)
    ElMessage.error(`${config.displayName} processing failed: ${errorMessage}`)
    uploadStore.saveToLocal()
  } finally {
    logger.groupEnd()
  }
}

// ===== 事件处理 =====
const handleFileSelected = (file: File, type: FileType) => {
  logger.info('文件选择', { 类型: fileTypeConfigs[type].displayName, 文件名: file.name })
  processFile(file, type)
}

const handlePaperSelected = (file: File) => handleFileSelected(file, 'paper')
const handleAnswerSelected = (file: File) => handleFileSelected(file, 'answer')
const handleStudentSelected = (file: File) => handleFileSelected(file, 'student')

// ===== 移除操作配置 =====
interface RemoveConfig {
  displayName: string
  resetUpload: () => void
  resetExam: () => void
}

const removeConfigs: Record<FileType, RemoveConfig> = {
  paper: {
    displayName: 'Paper',
    resetUpload: () => uploadStore.resetPaper(),
    resetExam: () => examStore.resetQuestions()
  },
  answer: {
    displayName: 'Reference answer',
    resetUpload: () => uploadStore.resetAnswer(),
    resetExam: () => examStore.resetReferenceAnswers()
  },
  student: {
    displayName: 'Student answer',
    resetUpload: () => uploadStore.resetStudent(),
    resetExam: () => examStore.resetStudentData()
  }
}

const handleRemove = (type: FileType) => {
  const config = removeConfigs[type]
  logger.info('移除文件', { 类型: config.displayName })
  
  config.resetUpload()
  config.resetExam()
  examStore.saveToLocal()
  uploadStore.saveToLocal()
  
  ElMessage.success(`${config.displayName} removed successfully`)
  logger.success('文件移除成功', { 类型: config.displayName })
}

const handlePaperRemove = () => handleRemove('paper')
const handleAnswerRemove = () => handleRemove('answer')
const handleStudentRemove = () => handleRemove('student')

// ===== 预览操作 =====
interface PreviewConfig {
  getState: () => { name: string; rawContent: string }
  displayName: string
}

const previewConfigs: Record<FileType, PreviewConfig> = {
  paper: {
    getState: () => uploadStore.examPaper,
    displayName: 'Paper'
  },
  answer: {
    getState: () => uploadStore.referenceAnswer,
    displayName: 'Reference answer'
  },
  student: {
    getState: () => uploadStore.studentAnswers,
    displayName: 'Student answer'
  }
}

const handlePreview = (type: FileType) => {
  const config = previewConfigs[type]
  const state = config.getState()
  
  previewDialog.value = {
    visible: true,
    title: `${config.displayName} preview - ${state.name}`,
    content: state.rawContent || 'No content'
  }
  
  logger.info('打开预览', { 类型: config.displayName, 文件名: state.name })
}

const handlePaperPreview = () => handlePreview('paper')
const handleAnswerPreview = () => handlePreview('answer')
const handleStudentPreview = () => handlePreview('student')

// ===== 重置操作 =====
const resetAll = async () => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to reset all data? This will clear all uploaded files and data.',
      'Confirm reset',
      {
        confirmButtonText: 'Reset',
        cancelButtonText: 'Cancel',
        type: 'warning',
      },
    )

    logger.group('重置操作', '重置所有上传数据')
    
    uploadStore.resetAll()
    examStore.resetAllData()
    examStore.saveToLocal()
    uploadStore.saveToLocal()
    
    ElMessage.success('All data reset successfully')
    logger.success('所有数据重置完成')
    logger.groupEnd()
  } catch {
    logger.skip('重置操作', '用户取消')
  }
}

// ===== 初始化 =====
onMounted(() => {
  logger.group('组件初始化', 'Uploading 组件')
  
  examStore.loadFromLocal()
  uploadStore.loadFromLocal()
  logger.success('数据加载完成', uploadStore.getUploadSummary())
  
  logger.groupEnd()
})
</script>

<style scoped>
.uploading-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px;
}

/* 重置按钮容器 */
.reset-button-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

/* 重置按钮样式 */
.reset-button-container .el-button {
  background-color: #f97069;
  border-color: #f97069;
  border-radius: 12px;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 600;
  min-height: 48px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.reset-button-container .el-button:hover {
  background-color: #ff2d20;
  border-color: #ff2d20;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
}

.reset-button-container .el-button:active {
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .uploading-container {
    max-width: 100%;
    padding: 16px;
    gap: 20px;
  }

  .reset-button-container {
    margin-top: 24px;
  }

  .reset-button-container .el-button {
    padding: 12px 24px;
    font-size: 14px;
    min-height: 44px;
  }
}

@media (max-width: 480px) {
  .uploading-container {
    padding: 12px;
    gap: 16px;
  }

  .reset-button-container {
    margin-top: 20px;
  }

  .reset-button-container .el-button {
    padding: 10px 20px;
    font-size: 14px;
    min-height: 40px;
  }
}
</style>
