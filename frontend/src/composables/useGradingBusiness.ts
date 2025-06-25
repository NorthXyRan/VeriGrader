// 批改业务逻辑

import { ElMessage } from 'element-plus'
import { useExamDataStore } from '../stores/useExamDataStore'
import { selectStudents, validateSelection, getSelectionStats } from '../utils/selectionUtils'
import { useErrorHandler, ErrorType } from './useErrorHandler'
import { useHighlightDataOperations } from './useHighlightDataOperations'
import { useFewShotManager } from './useFewShotManager'
import { gradeSingleStudentAnswer, gradeSingleStudentAnswerWithFewShot, checkGradingServiceStatus } from '../services/llm/grading/gradingLLMService'
import { generateReasonForHighlight, checkReasonGenerationServiceStatus } from '../services/llm/grading/reasonGenerationService'
import { logger, gradingLogger } from '../utils/logger'
import { previewText, longPreviewText } from '../utils/textUtils'

export function useGradingBusiness() {
  const examDataStore = useExamDataStore()
  const { handleError, handleGradingError, createRetryHandler } = useErrorHandler()
  const { saveAnnotation } = useHighlightDataOperations()
  const { buildFewShotPrompt } = useFewShotManager()

  // 统一批改执行逻辑
  const executeGradingForStudent = async (studentId: number, questionId: number): Promise<any> => {
    // 检查服务状态
    const serviceStatus = checkGradingServiceStatus()
    if (!serviceStatus.available) {
      throw new Error(serviceStatus.message)
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

    // 获取few-shot prompt
    const fewShotPrompt = buildFewShotPrompt(questionId)
    
    gradingLogger.preCheck({
      数据完整性: examDataStore.isDataComplete,
      FewShot状态: fewShotPrompt ? '启用' : '未启用',
      题目预览: longPreviewText(question.question),
      答案长度: studentAnswer.answer.length
    })

    // 调用学生给分服务（根据是否有few-shot选择不同方法）
    let gradingResult
    if (fewShotPrompt) {
      // 使用few-shot版本
      gradingResult = await gradeSingleStudentAnswerWithFewShot({
        question,
        referenceAnswer,
        studentAnswer,
        fewShotPrompt
      })
    } else {
      // 使用原版本
      gradingResult = await gradeSingleStudentAnswer({
        question,
        referenceAnswer,
        studentAnswer
      })
    }

    if (!gradingResult.success) {
      throw new Error(gradingResult.error || 'Grading failed')
    }

    if (!gradingResult.data || gradingResult.data.length === 0) {
      throw new Error('Grading result is empty')
    }

    return gradingResult.data[0]
  }

  // 单个学生批改
  const executeSingleGrading = async (studentId: number, questionId: number, actionSectionRef?: any) => {
    gradingLogger.startSingle(studentId, questionId)
    
    if (!examDataStore.isDataComplete) {
      logger.error('数据不完整，取消批改')
      ElMessage.warning('Please complete all data uploads first')
      gradingLogger.end()
      return
    }

    // 检查是否为金标试卷，金标试卷不能重新批改
    if (examDataStore.isGoldPaper(studentId, questionId)) {
      logger.skip('金标试卷保护，跳过批改')
      ElMessage.warning('Golden standard papers cannot be re-graded')
      gradingLogger.end()
      return
    }

    try {
      // 检查当前答案是否已经给分
      const existingResult = examDataStore.getHighlightData(studentId, questionId)
      if (existingResult) {
        ElMessage.info(`Re-grading current answer (previous score: ${existingResult.total_score} points)...`)
      }

      ElMessage.info('Starting AI grading for current student...')

      // 使用统一的批改执行逻辑
      const gradingResult = await executeGradingForStudent(studentId, questionId)
      
      // 直接使用AI批改结果覆盖现有数据
      examDataStore.addHighlightData(gradingResult)
      
      gradingLogger.gradingSuccess({
        总分: gradingResult.total_score,
        标注统计: {
          正确: gradingResult.answer.correct.length,
          错误: gradingResult.answer.wrong.length,
          不清楚: gradingResult.answer.unclear.length,
          冗余: gradingResult.answer.redundant.length
        }
      })

      // 保存到本地存储
      examDataStore.saveToLocal()
      logger.saved('数据已保存')

      // 显示成功消息
      ElMessage.success(`Grading completed! Score: ${gradingResult.total_score} points`)

      // 重置ActionSection加载状态
      if (actionSectionRef?.value) {
        actionSectionRef.value.resetGradingState()
      }
      
      gradingLogger.end()
    } catch (error) {
      logger.error('批改失败', error)
      handleGradingError(error as Error, 'single_grading')

      // 重置加载状态
      if (actionSectionRef?.value) {
        actionSectionRef.value.resetGradingState()
      }
      gradingLogger.end()
    }
  }

  // 批量批改
  const executeBatchGrading = async (batchCount: number, questionId: number, actionSectionRef?: any) => {
    gradingLogger.startBatch(questionId, batchCount)
    
    if (!examDataStore.isDataComplete) {
      logger.error('数据不完整，取消批量批改')
      ElMessage.warning('Please complete all data uploads first')
      gradingLogger.end()
      return
    }

    try {
      logger.info('开始批量批改...')
      ElMessage.info(`Starting batch grading for ${batchCount} randomly selected papers...`)

      // 设置批量给分状态
      if (actionSectionRef?.value) {
        actionSectionRef.value.setBatchGradingState(true)
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
      
      gradingLogger.selectionStats({
        总学生数: stats.totalCount,
        选中数量: stats.selectedCount,
        选择比例: `${(stats.selectionRate * 100).toFixed(1)}%`,
        选中学生: stats.selectedIds,
        题目ID: questionId
      })
      
      ElMessage.info(`Selected ${stats.selectedCount} out of ${stats.totalCount} students (${(stats.selectionRate * 100).toFixed(1)}% selection rate)`)

      // 逐个批改学生答案
      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < selectedStudentIds.length; i++) {
        const studentId = selectedStudentIds[i]
        
        logger.group('批改学生', `${studentId} (${i + 1}/${selectedStudentIds.length})`)
        
        try {
          // 检查是否为金标试卷，跳过金标试卷
          if (examDataStore.isGoldPaper(studentId, questionId)) {
            logger.skip('金标试卷，跳过批改')
            logger.groupEnd()
            continue
          }

          // 检查是否已经批改过
          const existingResult = examDataStore.getHighlightData(studentId, questionId)
          if (existingResult) {
            logger.retry('重新批改', i + 1, selectedStudentIds.length)
            logger.info(`之前分数: ${existingResult.total_score}`)
          }

          ElMessage.info(`Grading student ${studentId} (${i + 1}/${selectedStudentIds.length})...`)

          // 使用统一的批改执行逻辑
          const gradingResult = await executeGradingForStudent(studentId, questionId)
          
          // 直接使用AI批改结果覆盖现有数据
          examDataStore.addHighlightData(gradingResult)
          successCount++
          
          logger.success('批改成功', { 分数: gradingResult.total_score })
          logger.groupEnd()

          // 添加延迟避免API限流
          if (i < selectedStudentIds.length - 1) {
            logger.wait('等待500ms防止限流...')
            await new Promise(resolve => setTimeout(resolve, 500))
          }

        } catch (error) {
          logger.error('批改失败', error)
          logger.groupEnd()
          errorCount++
        }
      }

      // 保存到本地存储
      examDataStore.saveToLocal()

      logger.success('批量批改结果', {
        成功数量: successCount,
        失败数量: errorCount,
        成功率: `${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`
      })

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
      
      gradingLogger.end()

    } catch (error) {
      logger.error('批量批改异常', error)
      handleGradingError(error as Error, 'batch_grading')

      // 重置状态
      if (actionSectionRef?.value) {
        actionSectionRef.value.resetBatchGradingState()
      }
      gradingLogger.end()
    }
  }

  // 生成理由并保存
  const generateReasonWithFeedback = async (
    text: string, 
    type: 'correct' | 'wrong' | 'unclear' | 'redundant', 
    scoringPoint: number,
    studentId: number,
    questionId: number,
    feedbackPanelRef?: any
  ) => {
    gradingLogger.startReasonGeneration(studentId, questionId)
    logger.info('标注信息', {
      文本预览: longPreviewText(text),
      标注类型: type,
      评分点: scoringPoint,
      文本长度: text.length
    })
    // 更新反馈面板的辅助函数
    const updateFeedback = (reason: string) => {
      feedbackPanelRef?.value?.handleHighlightClicked({
        text, type, reason, scoringPoint
      })
    }

    try {
      // 检查服务状态
      const serviceStatus = checkReasonGenerationServiceStatus()
      if (!serviceStatus.available) {
        logger.error('理由生成服务不可用')
        handleError(serviceStatus.message, ErrorType.SERVICE_UNAVAILABLE, 'reason_generation')
        updateFeedback('LLM service unavailable, please check network connection and retry.')
        gradingLogger.end()
        return
      }
      
      const question = examDataStore.getQuestionById(questionId)
      const referenceAnswer = examDataStore.getReferenceAnswer(questionId)
      const studentAnswer = examDataStore.getStudentAnswer(studentId, questionId)
      
      if (!question || !referenceAnswer || !studentAnswer) {
        logger.error('上下文数据不完整')
        handleError('Missing required context data', ErrorType.DATA_VALIDATION, 'reason_generation')
        updateFeedback('Missing required context data, please refresh the page and retry.')
        gradingLogger.end()
        return
      }
      
      logger.info('数据检查通过，开始生成理由')
      
      // 直接调用理由生成服务，使用其内部重试机制
      const reasonResult = await generateReasonForHighlight({
        question, referenceAnswer, studentAnswer,
        highlightedText: text, highlightType: type
      }, 3)
      
      if (!reasonResult.success || !reasonResult.reason?.trim()) {
        logger.error('理由生成失败', reasonResult.error)
        handleError(reasonResult.error || 'Reason generation failed', ErrorType.REASON_GENERATION, 'generate_reason')
        updateFeedback(`Reason generation failed: ${reasonResult.error || 'Unknown error'}. Please try annotation again.`)
        gradingLogger.end()
        return
      }
      
      const finalReason = reasonResult.reason.trim()
      logger.success('理由生成成功', { 长度: finalReason.length })
      
      // 保存生成的理由
      const success = saveAnnotation({
        text, type, reason: finalReason, scoringPoint, studentId, questionId
      })
      
      if (success) {
        updateFeedback(finalReason)
        ElMessage.success('Reason generated successfully')
        logger.saved('理由保存成功')
        gradingLogger.end()
      }
      
    } catch (error) {
      logger.error('理由生成异常', error)
      handleError(error as Error, ErrorType.REASON_GENERATION, 'generate_reason')
      updateFeedback('Reason generation error, please check network connection and retry.')
      gradingLogger.end()
    }
  }

  // 直接保存理由
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
      logger.success('理由直接保存成功', { text: previewText(text), type })
    }
  }

  return {
    executeSingleGrading,
    executeBatchGrading,
    generateReasonWithFeedback,
    saveReasonDirectly
  }
}