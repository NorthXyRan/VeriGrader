<template>
  <div class="page-container uploading-container">
    <PaperUpload
      :status="uploadStore.examPaper.status"
      :file-name="uploadStore.examPaper.name"
      :display-text="paperDisplayText"
      @file-selected="handleFileSelected($event, 'paper')"
      @remove="removeFile('paper')"
      @preview="openPreview('paper')"
    />
    <AnswerUpload
      :disabled="!uploadStore.canUploadAnswer"
      :status="uploadStore.referenceAnswer.status"
      :file-name="uploadStore.referenceAnswer.name"
      :display-text="answerDisplayText"
      @file-selected="handleFileSelected($event, 'answer')"
      @remove="removeFile('answer')"
      @preview="openPreview('answer')"
    />
    <StudentUpload
      :disabled="!uploadStore.canUploadStudent"
      :status="uploadStore.studentAnswers.status"
      :file-name="uploadStore.studentAnswers.name"
      :display-text="studentDisplayText"
      @file-selected="handleFileSelected($event, 'student')"
      @remove="removeFile('student')"
      @preview="openPreview('student')"
    />

    <div class="reset-button-container">
      <el-button type="danger" @click="resetAll">
        <el-icon><RefreshLeft /></el-icon>
        Reset all
      </el-button>
    </div>

    <Preview
      v-model:visible="previewDialog.visible"
      :title="previewDialog.title"
      :content="previewDialog.content"
    />
  </div>
</template>

<script setup lang="ts">
import { Message } from '@/components/Message'
import { useGradingBusiness } from '@/composables/useGradingBusiness'
import {
  askToSaveJsonResult,
  isJsonFile,
  readFileContent,
  validateDataRelationships,
  validateJsonData,
  validateUploadFile,
} from '@/services/file/fileReaders'
import type {
  AnswerData,
  PaperData,
  UploadDataMap,
  UploadDataType,
} from '@/services/file/fileValidation'
import { uploadLLMService } from '@/services/llm'
import { useExamDataStore } from '@/stores/useExamDataStore'
import { useUploadStatusStore, type UploadMeta } from '@/stores/useUploadStatusStore'
import { RefreshLeft } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import 'element-plus/es/components/message-box/style/css'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import AnswerUpload from './AnswerUpload.vue'
import PaperUpload from './PaperUpload.vue'
import Preview from './Preview.vue'
import StudentUpload from './StudentUpload.vue'

type FileType = UploadDataType
type ParsedUpload = {
  [Type in FileType]: { type: Type; data: UploadDataMap[Type] }
}[FileType]

const uploadStore = useUploadStatusStore()
const examStore = useExamDataStore()
const router = useRouter()
const { executeInitialGrading } = useGradingBusiness()

const labels: Record<FileType, string> = {
  paper: 'Paper',
  answer: 'Reference answer',
  student: 'Student answers',
}

const previewDialog = ref({ visible: false, title: '', content: '' })

const paperDisplayText = computed(() =>
  statusText(
    uploadStore.examPaper.status,
    uploadStore.examPaper.error,
    `Current paper: ${uploadStore.examPaper.name} (${uploadStore.examPaper.meta?.questionCount || 0} questions)`,
  ),
)
const answerDisplayText = computed(() =>
  statusText(
    uploadStore.referenceAnswer.status,
    uploadStore.referenceAnswer.error,
    `Current reference answer: ${uploadStore.referenceAnswer.name} (${uploadStore.referenceAnswer.meta?.answerCount || 0} answers)`,
  ),
)
const studentDisplayText = computed(() =>
  statusText(
    uploadStore.studentAnswers.status,
    uploadStore.studentAnswers.error,
    `Student answers: ${uploadStore.studentAnswers.name} (${uploadStore.studentAnswers.meta?.studentCount || 0} students, ${uploadStore.studentAnswers.meta?.answerCount || 0} answers)`,
  ),
)

function statusText(status: string, error: string | undefined, readyText: string): string {
  if (status === 'error') return error || 'Parsing failed'
  return status === 'ready' ? readyText : ''
}

function setProcessing(type: FileType, file: File, content: string): void {
  if (type === 'paper') uploadStore.setPaperUploading(file.name, content)
  else if (type === 'answer') uploadStore.setAnswerUploading(file.name, content)
  else uploadStore.setStudentUploading(file.name, content)
}

function setError(type: FileType, message: string): void {
  if (type === 'paper') uploadStore.setPaperError(message)
  else if (type === 'answer') uploadStore.setAnswerError(message)
  else uploadStore.setStudentError(message)
}

function applyData(upload: ParsedUpload): { meta: UploadMeta; message: string } {
  if (upload.type === 'paper') {
    const paper: PaperData = upload.data
    uploadStore.resetAnswer()
    uploadStore.resetStudent()
    examStore.resetReferenceAnswers()
    examStore.resetStudentData()
    examStore.setQuestions(paper.questions)
    return {
      meta: { questionCount: paper.questions.length },
      message: `Paper uploaded: ${paper.questions.length} questions`,
    }
  }

  if (upload.type === 'answer') {
    const answer: AnswerData = upload.data
    validateDataRelationships(examStore.questions, answer.answers)
    uploadStore.resetStudent()
    examStore.resetStudentData()
    examStore.setReferenceAnswers(answer.answers)
    return {
      meta: { answerCount: answer.answers.length },
      message: `Reference answers uploaded: ${answer.answers.length} answers`,
    }
  }

  const students = upload.data
  validateDataRelationships(examStore.questions, examStore.referenceAnswers, students)
  examStore.resetStudentData()
  examStore.setStudentAnswers(students)
  const studentCount = new Set(students.map((answer) => answer.student_id)).size
  return {
    meta: { studentCount, answerCount: students.length },
    message: `Student answers uploaded: ${studentCount} students, ${students.length} answers`,
  }
}

function setReady(type: FileType, meta: UploadMeta): void {
  if (type === 'paper') uploadStore.setPaperReady(meta)
  else if (type === 'answer') uploadStore.setAnswerReady(meta)
  else uploadStore.setStudentReady(meta)
}

async function parseFile(file: File, type: FileType, content: string): Promise<ParsedUpload> {
  let data: unknown
  if (isJsonFile(file.name)) {
    data = JSON.parse(content)
  } else {
    if (type === 'student') throw new Error('Student responses must be uploaded as JSON')
    data = await uploadLLMService.parse(content, type)
  }

  if (type === 'paper') {
    if (!validateJsonData(data, type)) throw new Error('Invalid paper data')
    await askToSaveJsonResult(data, file.name, type)
    return { type, data }
  }
  if (type === 'answer') {
    if (!validateJsonData(data, type)) throw new Error('Invalid reference answer data')
    await askToSaveJsonResult(data, file.name, type)
    return { type, data }
  }
  if (!validateJsonData(data, type)) throw new Error('Invalid student response data')
  return { type, data }
}

async function handleFileSelected(file: File, type: FileType): Promise<void> {
  try {
    validateUploadFile(file, type)
    const content = await readFileContent(file)
    if (!content.trim()) throw new Error('The file is empty')

    setProcessing(type, file, content)
    const upload = await parseFile(file, type, content)
    const { meta, message } = applyData(upload)
    setReady(upload.type, meta)
    examStore.saveToLocal()
    Message.success(message)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown processing error'
    setError(type, message)
    Message.error(`${labels[type]} processing failed: ${message}`)
    return
  }

  if (type === 'student') {
    try {
      await router.push('/grading')
      await executeInitialGrading()
    } catch (error) {
      Message.error(
        `Could not start grading: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}

function removeFile(type: FileType): void {
  if (type === 'paper') {
    uploadStore.resetAll()
    examStore.resetAllData()
  } else if (type === 'answer') {
    uploadStore.resetAnswer()
    uploadStore.resetStudent()
    examStore.resetReferenceAnswers()
    examStore.resetStudentData()
  } else {
    uploadStore.resetStudent()
    examStore.resetStudentData()
  }

  examStore.saveToLocal()
  Message.success(`${labels[type]} removed`)
}

function previewFallback(type: FileType): string {
  if (type === 'paper') return JSON.stringify({ questions: examStore.questions }, null, 2)
  if (type === 'answer') return JSON.stringify({ answers: examStore.referenceAnswers }, null, 2)
  return JSON.stringify(examStore.studentAnswers, null, 2)
}

function openPreview(type: FileType): void {
  const state =
    type === 'paper'
      ? uploadStore.examPaper
      : type === 'answer'
        ? uploadStore.referenceAnswer
        : uploadStore.studentAnswers
  previewDialog.value = {
    visible: true,
    title: `${labels[type]} preview — ${state.name}`,
    content: state.rawContent || previewFallback(type),
  }
}

async function resetAll(): Promise<void> {
  try {
    await ElMessageBox.confirm('Reset all uploaded files and grading data?', 'Confirm reset', {
      confirmButtonText: 'Reset',
      cancelButtonText: 'Cancel',
      type: 'warning',
    })
  } catch {
    return
  }

  uploadStore.resetAll()
  examStore.resetAllData()
  examStore.saveToLocal()
  Message.success('All data was reset')
}
</script>

<style scoped>
.uploading-container {
  max-width: 1200px;
  margin: 0 auto;
  gap: 24px;
}

.reset-button-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.reset-button-container .el-button {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 14px 32px;
  border-color: #f97069;
  border-radius: 12px;
  background-color: #f97069;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.reset-button-container .el-button:hover {
  border-color: #ff2d20;
  background-color: #ff2d20;
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
  transform: translateY(-1px);
}

.reset-button-container .el-button:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .uploading-container {
    max-width: 100%;
    gap: 20px;
  }

  .reset-button-container {
    margin-top: 24px;
  }

  .reset-button-container .el-button {
    min-height: 44px;
    padding: 12px 24px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .uploading-container {
    gap: 16px;
  }

  .reset-button-container {
    margin-top: 20px;
  }

  .reset-button-container .el-button {
    min-height: 40px;
    padding: 10px 20px;
  }
}
</style>
