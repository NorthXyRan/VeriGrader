/**
 * 批改业务逻辑 Composable
 * 抽取 Grading.vue 中的所有批改相关业务逻辑
 */

import { ElMessage } from 'element-plus'
import { useExamDataStore } from '../stores/useExamDataStore'
import { selectStudents, validateSelection, getSelectionStats } from '../components/grading/utils/selectionUtils'
import { useErrorHandler, ErrorType } from './useErrorHandler'
import { useHighlightDataOperations } from './useHighlightDataOperations'

/**
 * 批改业务逻辑 Hook
 */
export function useGradingBusiness() {
  const examDataStore = useExamDataStore()
  const { handleError, handleGradingError, createRetryHandler } = useErrorHandler()
  const { saveAnnotation } = useHighlightDataOperations()

  /**
   * 执行单个学生批改
   */
  const executeSingleGrading = async (studentId: number, questionId: number, actionSectionRef?: any) => {
    if (!examDataStore.isDataComplete) {
      ElMessage.warning('Please complete all data uploads first')
      return
    }

    try {
      // 检查当前答案是否已经给分
      const existingResult = examDataStore.getHighlightData(studentId, questionId)
      // 允许重新批改
      if (existingResult) {
        ElMessage.info(`Re-grading current answer (previous score: ${existingResult.total_score} points)...`)
      }

      ElMessage.info('Starting AI grading for current student...')

      // 导入单个学生给分服务
      const { gradeSingleStudentAnswer, checkGradingServiceStatus } = await import('../services/llm/grading/gradingLLMService')
      
      // 检查服务状态
      const serviceStatus = checkGradingServiceStatus()
      if (!serviceStatus.available) {
        ElMessage.warning(serviceStatus.message)
        return
      }

      // 获取当前上下文数据
      const question = examDataStore.getQuestionById(questionId)
      const referenceAnswer = examDataStore.getReferenceAnswer(questionId)
      const studentAnswer = examDataStore.getStudentAnswer(studentId, questionId)

      // 验证当前上下文
      if (!question) {
        throw new Error(`Question ${questionId} not found`)
      }
      if (!referenceAnswer) {
        throw new Error(`Reference answer for question ${questionId} not found`)
      }
      if (!studentAnswer) {
        throw new Error(`Student ${studentId} answer for question ${questionId} not found`)
      }

      console.log('Grading context:', {
        studentId: studentId,
        questionId: questionId,
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
      if (actionSectionRef?.value) {
        actionSectionRef.value.resetGradingState()
      }
    } catch (error) {
      handleGradingError(error, 'single_grading')

      // 重置加载状态
      if (actionSectionRef?.value) {
        actionSectionRef.value.resetGradingState()
      }
    }
  }

  /**
   * 执行批量批改
   */
  const executeBatchGrading = async (batchCount: number, questionId: number, actionSectionRef?: any) => {
    if (!examDataStore.isDataComplete) {
      ElMessage.warning('Please complete all data uploads first')
      return
    }

    try {
      ElMessage.info(`Starting batch grading for ${batchCount} randomly selected papers...`)

      // 设置批量给分状态
      if (actionSectionRef?.value) {
        actionSectionRef.value.setBatchGradingState(true)
      }

      // 导入给分服务
      const { gradeSingleStudentAnswer, checkGradingServiceStatus } = await import('../services/llm/grading/gradingLLMService')
      
      // 检查服务状态
      const serviceStatus = checkGradingServiceStatus()
      if (!serviceStatus.available) {
        ElMessage.warning(serviceStatus.message)
        return
      }

      // 获取当前题目信息
      const question = examDataStore.getQuestionById(questionId)
      const referenceAnswer = examDataStore.getReferenceAnswer(questionId)

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
        questionId: questionId
      })
      
      ElMessage.info(`Selected ${stats.selectedCount} out of ${stats.totalCount} students (${(stats.selectionRate * 100).toFixed(1)}% selection rate)`)

      // 逐个批改学生答案
      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < selectedStudentIds.length; i++) {
        const studentId = selectedStudentIds[i]
        
        try {
          // 检查是否已经批改过
          const existingResult = examDataStore.getHighlightData(studentId, questionId)
          if (existingResult) {
            console.log(`Student ${studentId} already graded, re-grading...`)
          }

          // 获取学生答案
          const studentAnswer = examDataStore.getStudentAnswer(studentId, questionId)
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
      if (actionSectionRef?.value) {
        actionSectionRef.value.resetBatchGradingState()
      }

    } catch (error) {
      handleGradingError(error, 'batch_grading')

      // 重置状态
      if (actionSectionRef?.value) {
        actionSectionRef.value.resetBatchGradingState()
      }
    }
  }

  /**
   * 生成理由并保存（带实时反馈）
   */
  const generateReasonWithFeedback = async (
    text: string, 
    type: 'correct' | 'wrong' | 'unclear' | 'redundant', 
    scoringPoint: number,
    studentId: number,
    questionId: number,
    feedbackPanelRef?: any
  ) => {
    // 更新反馈面板的辅助函数
    const updateFeedback = (reason: string) => {
      feedbackPanelRef?.value?.handleHighlightClicked({
        text, type, reason, scoringPoint
      })
    }

    try {
      // 检查服务状态和上下文数据
      const { generateReasonForHighlight, checkReasonGenerationServiceStatus } = await import('../services/llm/grading/reasonGenerationService')
      
      const serviceStatus = checkReasonGenerationServiceStatus()
      if (!serviceStatus.available) {
        updateFeedback('LLM服务不可用，请检查网络连接后重试。')
        return
      }
      
      const question = examDataStore.getQuestionById(questionId)
      const referenceAnswer = examDataStore.getReferenceAnswer(questionId)
      const studentAnswer = examDataStore.getStudentAnswer(studentId, questionId)
      
      if (!question || !referenceAnswer || !studentAnswer) {
        updateFeedback('缺少必要的上下文数据，请刷新页面后重试。')
        return
      }
      
      // 使用重试处理器
      const retryHandler = createRetryHandler('理由生成', 3)
      let finalReason = ''
      
      // 重试逻辑
      for (let attempt = 1; attempt <= 3; attempt++) {
        if (attempt > 1) {
          updateFeedback(`理由生成重试中... (第${attempt}/3次尝试)`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        try {
          const reasonResult = await generateReasonForHighlight({
            question, referenceAnswer, studentAnswer,
            highlightedText: text, highlightType: type
          }, 1)
          
          if (reasonResult.success && reasonResult.reason?.trim()) {
            finalReason = reasonResult.reason.trim()
            break
          }
          
          if (attempt === 3) {
            throw new Error(reasonResult.error || '理由生成返回空内容')
          }
        } catch (error) {
          retryHandler.onRetry(attempt, error)
          if (attempt === 3) {
            retryHandler.onFinalFailure(error)
            updateFeedback(`理由生成失败: ${error instanceof Error ? error.message : '未知错误'}。请重新尝试标注。`)
            return
          }
        }
      }
      
      // 保存生成的理由
      const success = saveAnnotation({
        text, type, reason: finalReason, scoringPoint, studentId, questionId
      })
      
      if (success) {
        updateFeedback(finalReason)
        ElMessage.success('理由生成成功')
        console.log('理由生成并保存成功:', { text: text.substring(0, 30), reasonLength: finalReason.length })
      }
      
    } catch (error) {
      handleError(error, ErrorType.REASON_GENERATION, 'generate_reason')
      updateFeedback('理由生成出错，请检查网络连接后重试。')
    }
  }

  /**
   * 直接保存理由，不调用LLM
   */
  const saveReasonDirectly = (
    text: string, 
    type: 'correct' | 'wrong' | 'unclear' | 'redundant', 
    reason: string, 
    scoringPoint: number,
    studentId: number,
    questionId: number,
    feedbackPanelRef?: any
  ) => {
    // 使用统一的保存方法
    const success = saveAnnotation({
      text, type, reason, scoringPoint, studentId, questionId
    })
    
    if (success) {
      // 更新反馈面板显示
      feedbackPanelRef?.value?.handleHighlightClicked({
        text, type, reason, scoringPoint
      })
      console.log('理由直接保存成功:', { text: text.substring(0, 30), type })
    }
  }

  return {
    executeSingleGrading,
    executeBatchGrading,
    generateReasonWithFeedback,
    saveReasonDirectly
  }
}