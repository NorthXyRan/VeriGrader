/**
 * 高亮数据操作 Composable
 * 统一管理所有高亮数据的增删改查操作
 */

import { useExamDataStore } from '../stores/useExamDataStore'
import { useErrorHandler, ErrorType } from './useErrorHandler'

/**
 * 标注数据接口
 */
export interface AnnotationData {
  text: string
  type: 'correct' | 'wrong' | 'unclear' | 'redundant'
  reason: string
  scoringPoint: number
  studentId: number
  questionId: number
}

/**
 * 高亮操作类型
 */
export interface HighlightOperation {
  operation: 'add' | 'remove' | 'reset'
  text?: string
  type?: 'correct' | 'wrong' | 'unclear' | 'redundant'
  reason?: string
  scoringPoint?: number
}

/**
 * 高亮数据操作 Hook
 */
export function useHighlightDataOperations() {
  const examDataStore = useExamDataStore()
  const { handleError, handleValidationError } = useErrorHandler()

  /**
   * 验证标注数据
   */
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

  /**
   * 获取高亮数据
   */
  const getHighlightData = (studentId: number, questionId: number) => {
    try {
      return examDataStore.getHighlightData(studentId, questionId)
    } catch (error) {
      handleError(error, ErrorType.DATA_VALIDATION, 'get_highlight_data')
      return null
    }
  }

  /**
   * 保存标注数据
   */
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
        console.log('更新已有标注:', { text: data.text.substring(0, 30), type: data.type })
      } else {
        targetArray.push(newItem)
        console.log('添加新标注:', { text: data.text.substring(0, 30), type: data.type })
      }

      // 保存到本地存储
      examDataStore.saveToLocal()
      return true

    } catch (error) {
      handleError(error, ErrorType.GRADING, 'save_annotation')
      return false
    }
  }

  /**
   * 移除标注
   */
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
        console.log('移除标注:', { text: text.substring(0, 30), type })
        return true
      }

      return false
    } catch (error) {
      handleError(error, ErrorType.GRADING, 'remove_annotation')
      return false
    }
  }

  /**
   * 重置所有标注
   */
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
      console.log('重置所有标注:', { studentId, questionId })
      return true

    } catch (error) {
      handleError(error, ErrorType.GRADING, 'reset_annotations')
      return false
    }
  }

  /**
   * 执行高亮操作
   */
  const executeHighlightOperation = (
    operation: HighlightOperation,
    studentId: number,
    questionId: number
  ): boolean => {
    const validTypes = ['correct', 'wrong', 'unclear', 'redundant'] as const

    switch (operation.operation) {
      case 'add':
        if (!operation.text || !operation.type) {
          handleValidationError('operation', operation, '添加操作需要提供text和type')
          return false
        }
        
        if (!validTypes.includes(operation.type)) {
          handleValidationError('type', operation.type, '无效的标注类型')
          return false
        }

        return saveAnnotation({
          text: operation.text,
          type: operation.type,
          reason: operation.reason || '',
          scoringPoint: operation.scoringPoint || 0,
          studentId,
          questionId
        })

      case 'remove':
        if (!operation.text || !operation.type) {
          handleValidationError('operation', operation, '移除操作需要提供text和type')
          return false
        }
        
        return removeAnnotation(operation.text, operation.type, studentId, questionId)

      case 'reset':
        return resetAllAnnotations(studentId, questionId)

      default:
        handleValidationError('operation', operation.operation, '无效的操作类型')
        return false
    }
  }

  /**
   * 查找标注项
   */
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
      handleError(error, ErrorType.DATA_VALIDATION, 'find_annotation')
      return null
    }
  }

  /**
   * 获取标注统计信息
   */
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
      handleError(error, ErrorType.DATA_VALIDATION, 'get_annotation_stats')
      return null
    }
  }

  return {
    saveAnnotation,
    removeAnnotation,
    resetAllAnnotations,
    executeHighlightOperation,
    findAnnotation,
    getAnnotationStats,
    getHighlightData,
    validateAnnotationData
  }
}