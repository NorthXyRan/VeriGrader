// Few-Shot 学习管理

import { useExamDataStore } from '../stores/useExamDataStore'
import { logger } from '../utils/logger'
import { previewText } from '../utils/textUtils'

export function useFewShotManager() {
  const examDataStore = useExamDataStore()

  // 添加理由示例
  const addReasonExample = (data: {
    questionId: number
    studentAnswer: string
    highlightType: 'correct' | 'wrong' | 'unclear' | 'redundant'
    reason: string
  }) => {
    examDataStore.addReasonExample(data)
    examDataStore.saveToLocal()
    
    logger.info('添加单个理由示例', {
      题目ID: data.questionId,
      标注类型: data.highlightType,
      文本预览: previewText(data.studentAnswer),
      理由长度: data.reason.length,
      当前题目示例总数: examDataStore.getReasonExamplesByQuestion(data.questionId).length
    })
  }

  // 设置金标试卷
  const setGoldPaper = (studentId: number, questionId: number): boolean => {
    const success = examDataStore.setGoldPaper(studentId, questionId)
    
    if (success) {
      examDataStore.saveToLocal()
      logger.success('设置金标试卷成功', {
        学生ID: studentId,
        题目ID: questionId,
        当前题目示例总数: examDataStore.getReasonExamplesByQuestion(questionId).length,
        全部示例总数: examDataStore.reasonExamples.length
      })
    }
    
    return success
  }

  // 检查金标试卷
  const isGoldPaper = (studentId: number, questionId: number): boolean => {
    return examDataStore.isGoldPaper(studentId, questionId)
  }

  // 构建Few-Shot Prompt
  const buildFewShotPrompt = (questionId: number): string => {
    const examples = examDataStore.getReasonExamplesByQuestion(questionId)
    
    if (examples.length === 0) {
      logger.info('无Few-Shot示例，使用基础Prompt', { 题目ID: questionId })
      return ''
    }

    logger.info('构建Few-Shot Prompt', { 题目ID: questionId, 示例数量: examples.length })

    let prompt = '\n## Grading Examples\nPlease refer to the following grading examples for consistency in evaluation standards and reasoning style:\n\n'
    
    examples.forEach((example, index) => {
      prompt += `Example ${index + 1}:\n`
      prompt += `Student Answer: "${example.studentAnswer}"\n`
      prompt += `Marked as: ${example.highlightType}\n`
      prompt += `Reason: ${example.reason}\n\n`
    })

    prompt += 'Please strictly follow the evaluation standards and reasoning style demonstrated in the above examples.\n'

    logger.success('Few-Shot Prompt构建完成', { 长度: prompt.length })
    return prompt
  }

  // 获取示例统计
  const getQuestionExampleStats = (questionId: number) => {
    const examples = examDataStore.getReasonExamplesByQuestion(questionId)
    const stats = {
      total: examples.length,
      correct: examples.filter(e => e.highlightType === 'correct').length,
      wrong: examples.filter(e => e.highlightType === 'wrong').length,
      unclear: examples.filter(e => e.highlightType === 'unclear').length,
      redundant: examples.filter(e => e.highlightType === 'redundant').length
    }
    
    logger.info('题目示例统计', { 题目ID: questionId, ...stats })
    return stats
  }

  return {
    addReasonExample,
    setGoldPaper,
    isGoldPaper,
    buildFewShotPrompt,
    getQuestionExampleStats
  }
}