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
      当前题目示例总数: examDataStore.getTotalExampleCountByQuestion(data.questionId)
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
    const reasonExamples = examDataStore.getReasonExamplesByQuestion(questionId)
    const goldExamples = examDataStore.getGoldStandardExamplesByQuestion(questionId)

    const totalExamples = reasonExamples.length + goldExamples.length

    if (totalExamples === 0) {
      logger.info('无Few-Shot示例，使用基础Prompt', { 题目ID: questionId })
      return ''
    }

    logger.info('构建混合Few-Shot Prompt', {
      题目ID: questionId,
      理由示例数量: reasonExamples.length,
      金标示例数量: goldExamples.length,
      总示例数量: totalExamples
    })

    let prompt = '\n## Grading Examples\nPlease refer to the following grading examples for consistency in evaluation standards and reasoning style:\n\n'
    let exampleIndex = 1

    // 先添加单个理由示例
    reasonExamples.forEach((example) => {
      prompt += `Example ${exampleIndex}:\n`
      prompt += `Student Answer: "${example.studentAnswer}"\n`
      prompt += `Marked as: ${example.highlightType}\n`
      prompt += `Reason: ${example.reason}\n\n`
      exampleIndex++
    })

    // 再添加金标示例（连续编号）
    goldExamples.forEach((example) => {
      prompt += `Example ${exampleIndex}:\n`
      prompt += `gold_standard_example: {\n`
      prompt += `  "student_id": null,\n`
      prompt += `  "question_id": ${example.question_id},\n`
      prompt += `  "answer": {\n`

      // correct 数组
      prompt += `    "correct": [\n`
      example.answer.correct.forEach((item, index) => {
        prompt += `      {\n`
        prompt += `        "Student answer": "${item['Student answer']}",\n`
        prompt += `        "Scoring point": ${item['Scoring point']},\n`
        prompt += `        "reason": "${item.reason}"\n`
        prompt += `      }${index < example.answer.correct.length - 1 ? ',' : ''}\n`
      })
      prompt += `    ],\n`

      // wrong 数组
      prompt += `    "wrong": [\n`
      example.answer.wrong.forEach((item, index) => {
        prompt += `      {\n`
        prompt += `        "Student answer": "${item['Student answer']}",\n`
        prompt += `        "Scoring point": ${item['Scoring point']},\n`
        prompt += `        "reason": "${item.reason}"\n`
        prompt += `      }${index < example.answer.wrong.length - 1 ? ',' : ''}\n`
      })
      prompt += `    ],\n`

      // unclear 数组
      prompt += `    "unclear": [\n`
      example.answer.unclear.forEach((item, index) => {
        prompt += `      {\n`
        prompt += `        "Student answer": "${item['Student answer']}",\n`
        prompt += `        "Scoring point": ${item['Scoring point']},\n`
        prompt += `        "reason": "${item.reason}"\n`
        prompt += `      }${index < example.answer.unclear.length - 1 ? ',' : ''}\n`
      })
      prompt += `    ],\n`

      // redundant 数组
      prompt += `    "redundant": [\n`
      example.answer.redundant.forEach((item, index) => {
        prompt += `      {\n`
        prompt += `        "Student answer": "${item['Student answer']}",\n`
        prompt += `        "reason": "${item.reason}"\n`
        prompt += `      }${index < example.answer.redundant.length - 1 ? ',' : ''}\n`
      })
      prompt += `    ]\n`

      prompt += `  },\n`
      prompt += `  "total_score": ${example.total_score}\n`
      prompt += `}\n\n`

      exampleIndex++
    })

    prompt += 'Please strictly follow the evaluation standards and reasoning style demonstrated in the above examples.\n'

    logger.success('混合Few-Shot Prompt构建完成', {
      长度: prompt.length,
      总示例数: totalExamples
    })

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