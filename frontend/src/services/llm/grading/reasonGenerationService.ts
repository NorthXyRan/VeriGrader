// 理由生成服务

import type { Question, ReferenceAnswer, StudentAnswer } from '../../../stores/useExamDataStore'
import { buildReasonGenerationPrompt } from './gradingPrompts'
import { callLLMAPI, getReasonGenerationConfig, checkLLMServiceStatus } from '../baseLLMService'

// 请求接口
export interface ReasonGenerationRequest {
  question: Question                // 问题
  referenceAnswer: ReferenceAnswer  // 参考答案
  studentAnswer: StudentAnswer      // 学生答案
  highlightedText: string          // 教师高亮的文本
  highlightType: 'correct' | 'wrong' | 'unclear' | 'redundant'  // 标注类型
}

// 响应接口
export interface ReasonGenerationResponse {
  success: boolean      // 是否成功
  reason?: string       // 生成的理由
  error?: string        // 错误信息
  message?: string      // 消息
}

// 生成评分理由
export async function generateReasonForHighlight(request: ReasonGenerationRequest, maxRetries: number = 3): Promise<ReasonGenerationResponse> {
  console.log('开始生成理由：', {
    studentId: request.studentAnswer.student_id,
    questionId: request.question.question_id,
    highlightType: request.highlightType,
    textLength: request.highlightedText.length,
    maxRetries
  })
  
  // 构建理由生成提示词
  const prompt = buildReasonGenerationPrompt(
    request.question,
    request.referenceAnswer,
    request.studentAnswer,
    request.highlightedText,
    request.highlightType
  )
  console.log('=== 理由生成Prompt ===')
  console.log('长度:', prompt.length)
  console.log('内容:', prompt)
  console.log('=== Prompt结束 ===')
  
  let lastError: Error | null = null
  
  // 重试逻辑
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`理由生成尝试 ${attempt}/${maxRetries}`)
      
      // 调用统一的LLM API生成理由
      const llmResponse = await callLLMAPI(prompt, getReasonGenerationConfig())
      
      if (!llmResponse.success) {
        throw new Error(llmResponse.error || 'LLM API call failed')
      }

      const reason = llmResponse.content!
      
      console.log(`理由生成完成 (第${attempt}次尝试)`)
      
      return {
        success: true,
        reason: reason.trim(),
        message: `Successfully generated reason for ${request.highlightType} highlight (attempt ${attempt})`
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      console.warn(`理由生成失败 (第${attempt}次尝试):`, lastError.message)
      
      // 如果不是最后一次尝试，等待一下再重试
      if (attempt < maxRetries) {
        console.log(`等待1秒后进行第${attempt + 1}次重试...`)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }
  
  // 所有重试都失败了
  console.error(`理由生成失败，已重试${maxRetries}次:`, lastError)
  
  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    message: `Reason generation failed after ${maxRetries} attempts`
  }
}


// 检查服务状态
export const checkReasonGenerationServiceStatus = checkLLMServiceStatus