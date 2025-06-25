// 标注数据操作

import { useExamDataStore } from '../stores/useExamDataStore'
import { useErrorHandler, ErrorType } from './useErrorHandler'
import { logger } from '../utils/logger'
import { previewText } from '../utils/textUtils'

// 标注数据接口
export interface AnnotationData {
  text: string
  type: 'correct' | 'wrong' | 'unclear' | 'redundant'
  reason: string
  scoringPoint: number
  studentId: number
  questionId: number
}


export function useHighlightDataOperations() {
  const examDataStore = useExamDataStore()
  const { handleError, handleValidationError } = useErrorHandler()

  // 验证数据
  const validateAnnotationData = (data: Partial<AnnotationData>): boolean => {
    const validTypes = ['correct', 'wrong', 'unclear', 'redundant'] as const

    if (!data.text || !data.text.trim()) {
      handleValidationError('text', data.text, '不能为空')
      return false
    }

    if (!data.type || !validTypes.includes(data.type)) {
      handleValidationError('type', data.type, '必须是有效的标注类型')
      return false
    }

    if (data.studentId === undefined || data.studentId === null) {
      handleValidationError('studentId', data.studentId, '必须提供学生ID')
      return false
    }

    if (data.questionId === undefined || data.questionId === null) {
      handleValidationError('questionId', data.questionId, '必须提供题目ID')
      return false
    }

    return true
  }

  // 获取数据
  const getHighlightData = (studentId: number, questionId: number) => {
    try {
      return examDataStore.getHighlightData(studentId, questionId)
    } catch (error) {
      handleError(error as Error, ErrorType.DATA_VALIDATION, 'get_highlight_data')
      return null
    }
  }

  // 保存数据
  const saveAnnotation = (data: AnnotationData): boolean => {
    try {
      // 验证数据
      if (!validateAnnotationData(data)) {
        return false
      }

      // 获取当前高亮数据
      const currentHighlightData = getHighlightData(data.studentId, data.questionId)
      if (!currentHighlightData) {
        handleError('没有找到高亮数据', ErrorType.DATA_VALIDATION, 'save_annotation')
        return false
      }

      // 获取目标数组
      const targetArray = currentHighlightData.answer[data.type]
      
      // 查找是否已存在相同文本的标注
      const existingIndex = targetArray.findIndex(
        (item: any) => item['Student answer'] === data.text
      )

      // 创建新的标注项
      const newItem = {
        'Student answer': data.text,
        'Scoring point': data.scoringPoint,
        reason: data.reason
      }

      // 更新或添加
      if (existingIndex !== -1) {
        targetArray[existingIndex] = newItem
        logger.info('更新已有标注', { text: previewText(data.text), type: data.type })
      } else {
        targetArray.push(newItem)
        logger.info('添加新标注', { text: previewText(data.text), type: data.type })
      }

      // 保存到本地存储
      examDataStore.saveToLocal()
      return true

    } catch (error) {
      handleError(error as Error, ErrorType.GRADING, 'save_annotation')
      return false
    }
  }

  // 移除标注
  const removeAnnotation = (
    text: string,
    type: 'correct' | 'wrong' | 'unclear' | 'redundant',
    studentId: number,
    questionId: number
  ): boolean => {
    try {
      const currentHighlightData = getHighlightData(studentId, questionId)
      if (!currentHighlightData) {
        return false
      }

      const targetArray = currentHighlightData.answer[type]
      const index = targetArray.findIndex((item: any) => item['Student answer'] === text)
      
      if (index !== -1) {
        targetArray.splice(index, 1)
        examDataStore.saveToLocal()
        logger.info('移除标注', { text: previewText(text), type })
        return true
      }

      return false
    } catch (error) {
      handleError(error as Error, ErrorType.GRADING, 'remove_annotation')
      return false
    }
  }

  // 重置所有标注
  const resetAllAnnotations = (studentId: number, questionId: number): boolean => {
    try {
      const currentHighlightData = getHighlightData(studentId, questionId)
      if (!currentHighlightData) {
        return false
      }

      // 重置所有标注数组
      currentHighlightData.answer.correct = []
      currentHighlightData.answer.wrong = []
      currentHighlightData.answer.unclear = []
      currentHighlightData.answer.redundant = []
      currentHighlightData.total_score = 0

      examDataStore.saveToLocal()
      logger.info('重置所有标注', { studentId, questionId })
      return true

    } catch (error) {
      handleError(error as Error, ErrorType.GRADING, 'reset_annotations')
      return false
    }
  }


  // 查找标注
  const findAnnotation = (
    text: string,
    studentId: number,
    questionId: number
  ): { type: string; item: any } | null => {
    try {
      const currentHighlightData = getHighlightData(studentId, questionId)
      if (!currentHighlightData) {
        return null
      }

      const types = ['correct', 'wrong', 'unclear', 'redundant'] as const
      
      for (const type of types) {
        const targetArray = currentHighlightData.answer[type]
        const item = targetArray.find((item: any) => item['Student answer'] === text)
        if (item) {
          return { type, item }
        }
      }

      return null
    } catch (error) {
      handleError(error as Error, ErrorType.DATA_VALIDATION, 'find_annotation')
      return null
    }
  }

  // 获取统计信息
  const getAnnotationStats = (studentId: number, questionId: number) => {
    try {
      const currentHighlightData = getHighlightData(studentId, questionId)
      if (!currentHighlightData) {
        return null
      }

      return {
        correct: currentHighlightData.answer.correct.length,
        wrong: currentHighlightData.answer.wrong.length,
        unclear: currentHighlightData.answer.unclear.length,
        redundant: currentHighlightData.answer.redundant.length,
        totalScore: currentHighlightData.total_score
      }
    } catch (error) {
      handleError(error as Error, ErrorType.DATA_VALIDATION, 'get_annotation_stats')
      return null
    }
  }

  return {
    saveAnnotation,
    removeAnnotation,
    resetAllAnnotations,
    findAnnotation,
    getAnnotationStats,
    getHighlightData,
    validateAnnotationData
  }
}