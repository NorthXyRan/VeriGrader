// 管理解析后的核心业务数据

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// ===== 数据类型定义 =====
export interface Question {
  question_id: number
  question: string
  score: number
}

export interface ReferenceAnswer {
  question_id: number
  answer: string
}

export interface StudentAnswer {
  student_id: number
  question_id: number
  answer: string
}

export interface StudentInfo {
  id: number
}

export interface HighlightItem {
  'Student answer': string
  'Scoring point': number
  reason: string
}

export interface HighlightData {
  student_id: number
  question_id: number
  answer: {
    correct: HighlightItem[]
    wrong: HighlightItem[]
    unclear: HighlightItem[]
    redundant: HighlightItem[]
  }
  total_score: number
  isGold?: boolean  // 金标试卷标记
}

export interface ReasonExample {
  questionId: number
  studentAnswer: string
  highlightType: 'correct' | 'wrong' | 'unclear' | 'redundant'
  reason: string
}

// ===== 核心数据存储 =====
export const useExamDataStore = defineStore('examData', () => {
  // ===== 状态 =====
  const questions = ref<Question[]>([])                  // 题目列表
  const referenceAnswers = ref<ReferenceAnswer[]>([])    // 参考答案列表
  const studentAnswers = ref<StudentAnswer[]>([])        // 学生答案列表
  const studentList = ref<StudentInfo[]>([])             // 学生列表
  const highlightDataList = ref<HighlightData[]>([])     // 评分结果
  const reasonExamples = ref<ReasonExample[]>([])        // Few-Shot 理由示例

  // ===== 计算属性 =====
  const questionCount = computed(() => questions.value.length)
  const referenceAnswerCount = computed(() => referenceAnswers.value.length)
  const studentCount = computed(() => studentList.value.length)
  const totalAnswerCount = computed(() => studentAnswers.value.length)

  // 获取指定题目
  const getQuestionById = (questionId: number) => {
    return questions.value.find((q) => q.question_id === questionId)
  }

  // 获取指定题目的参考答案
  const getReferenceAnswer = (questionId: number) => {
    return referenceAnswers.value.find((ans) => ans.question_id === questionId)
  }

  // 获取指定学生的答案
  const getStudentAnswer = (studentId: number, questionId: number) => {
    return studentAnswers.value.find(
      (ans) => ans.student_id === studentId && ans.question_id === questionId,
    )
  }

  // 获取指定的高亮数据
  const getHighlightData = (studentId: number, questionId: number) => {
    return highlightDataList.value.find(
      (data) => data.student_id === studentId && data.question_id === questionId,
    )
  }

  // 检查数据完整性
  const isDataComplete = computed(() => {
    return questions.value.length > 0 && studentAnswers.value.length > 0
  })

  // ===== 基础操作方法 =====

  // 设置题目数据
  const setQuestions = (questionsData: Question[]) => {
    questions.value = questionsData
  }

  // 设置参考答案数据
  const setReferenceAnswers = (answersData: ReferenceAnswer[]) => {
    referenceAnswers.value = answersData
  }

  // 设置学生答案数据
  const setStudentAnswers = (answersData: StudentAnswer[]) => {
    studentAnswers.value = answersData
    // 自动生成学生列表
    const uniqueStudentIds = [...new Set(answersData.map((item) => item.student_id))]
    studentList.value = uniqueStudentIds.map((id) => ({ id }))
  }

  // 设置高亮数据
  const setHighlightData = (highlightData: HighlightData[]) => {
    highlightDataList.value = highlightData
  }

  // 添加高亮数据
  const addHighlightData = (highlight: HighlightData) => {
    const existingIndex = highlightDataList.value.findIndex(
      (data) =>
        data.student_id === highlight.student_id && data.question_id === highlight.question_id,
    )
    
    const existing = existingIndex >= 0 ? highlightDataList.value[existingIndex] : null
    const operation = existing ? '更新' : '新增'
    
    if (existingIndex >= 0) {
      highlightDataList.value[existingIndex] = highlight
    } else {
      highlightDataList.value.push(highlight)
    }
    
    console.log(`STORE: [数据存储] ${operation}批改结果:`, {
      学生ID: highlight.student_id,
      题目ID: highlight.question_id,
      分数变化: existing ? `${existing.total_score} → ${highlight.total_score}` : highlight.total_score,
      标注统计: {
        正确: highlight.answer.correct.length,
        错误: highlight.answer.wrong.length,
        不清楚: highlight.answer.unclear.length,
        冗余: highlight.answer.redundant.length
      },
      是否金标: highlight.isGold || false
    })
  }

  // ===== Few-Shot 相关方法 =====
  
  // 添加单个理由示例
  const addReasonExample = (example: ReasonExample) => {
    reasonExamples.value.push(example)
    console.log('添加理由示例到题目', example.questionId, '，当前示例总数:', reasonExamples.value.length)
  }

  // 设置金标试卷并批量提取理由
  const setGoldPaper = (studentId: number, questionId: number): boolean => {
    const highlightData = getHighlightData(studentId, questionId)
    if (!highlightData) {
      console.error('未找到高亮数据，无法设置金标')
      return false
    }

    // 设置金标标记
    highlightData.isGold = true
    
    // 批量提取理由示例
    const extractCount = batchExtractReasons(highlightData)
    
    console.log(`设置金标试卷 学生${studentId}-题目${questionId}，提取${extractCount}条理由示例`)
    return true
  }

  // 批量提取理由示例
  const batchExtractReasons = (highlightData: HighlightData): number => {
    const types = ['correct', 'wrong', 'unclear', 'redundant'] as const
    let extractCount = 0
    
    types.forEach(type => {
      const items = highlightData.answer[type]
      items.forEach(item => {
        if (item.reason && item.reason.trim()) {
          reasonExamples.value.push({
            questionId: highlightData.question_id,
            studentAnswer: item['Student answer'],
            highlightType: type,
            reason: item.reason
          })
          extractCount++
        }
      })
    })
    
    console.log('批量提取理由完成，提取', extractCount, '条，总计', reasonExamples.value.length, '条')
    
    return extractCount
  }

  // 检查是否为金标试卷
  const isGoldPaper = (studentId: number, questionId: number): boolean => {
    const highlightData = getHighlightData(studentId, questionId)
    return highlightData?.isGold === true
  }

  // 获取指定题目的理由示例
  const getReasonExamplesByQuestion = (questionId: number): ReasonExample[] => {
    return reasonExamples.value.filter(example => example.questionId === questionId)
  }

  // ===== 数据重置 =====
  const resetQuestions = () => {
    questions.value = []
  }

  const resetReferenceAnswers = () => {
    referenceAnswers.value = []
  }

  const resetStudentData = () => {
    studentAnswers.value = []
    studentList.value = []
    highlightDataList.value = []
    reasonExamples.value = []
  }

  const resetAllData = () => {
    resetQuestions()
    resetReferenceAnswers()
    resetStudentData()
  }



  // ===== 本地存储 =====
  const saveToLocal = () => {
    try {
      localStorage.setItem('exam_questions', JSON.stringify(questions.value))
      localStorage.setItem('exam_reference_answers', JSON.stringify(referenceAnswers.value))
      localStorage.setItem('exam_student_answers', JSON.stringify(studentAnswers.value))
      localStorage.setItem('exam_student_list', JSON.stringify(studentList.value))
      localStorage.setItem('exam_highlight_data', JSON.stringify(highlightDataList.value))
      localStorage.setItem('exam_reason_examples', JSON.stringify(reasonExamples.value))
    } catch (error) {
      console.error('保存数据失败:', error)
    }
  }

  const loadFromLocal = () => {
    try {
      const savedQuestions = localStorage.getItem('exam_questions')
      const savedReferenceAnswers = localStorage.getItem('exam_reference_answers')
      const savedStudentAnswers = localStorage.getItem('exam_student_answers')
      const savedStudentList = localStorage.getItem('exam_student_list')
      const savedHighlightData = localStorage.getItem('exam_highlight_data')
      const savedReasonExamples = localStorage.getItem('exam_reason_examples')

      if (savedQuestions) questions.value = JSON.parse(savedQuestions)
      if (savedReferenceAnswers) referenceAnswers.value = JSON.parse(savedReferenceAnswers)
      if (savedStudentAnswers) studentAnswers.value = JSON.parse(savedStudentAnswers)
      if (savedStudentList) studentList.value = JSON.parse(savedStudentList)
      if (savedHighlightData) highlightDataList.value = JSON.parse(savedHighlightData)
      if (savedReasonExamples) reasonExamples.value = JSON.parse(savedReasonExamples)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  return {
    // 状态
    questions,
    referenceAnswers,
    studentAnswers,
    studentList,
    highlightDataList,
    reasonExamples,

    // 计算属性
    questionCount,
    referenceAnswerCount,
    studentCount,
    totalAnswerCount,
    getQuestionById,
    getReferenceAnswer,
    getStudentAnswer,
    getHighlightData,
    isDataComplete,

    // 方法
    setQuestions,
    setReferenceAnswers,
    setStudentAnswers,
    setHighlightData,
    addHighlightData,
    
    // Few-Shot 方法
    addReasonExample,
    setGoldPaper,
    isGoldPaper,
    getReasonExamplesByQuestion,
    
    // 重置方法
    resetQuestions,
    resetReferenceAnswers,
    resetStudentData,
    resetAllData,
    saveToLocal,
    loadFromLocal,
  }
})
