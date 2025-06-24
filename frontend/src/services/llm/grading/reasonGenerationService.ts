/**
 * 理由生成服务：教师标注后自动生成评分理由
 */

import { API_CONFIG, isAPIConfigValid } from '../../../config/api'
import type { Question, ReferenceAnswer, StudentAnswer } from '../../../stores/useExamDataStore'
import { buildReasonGenerationPrompt } from './gradingPrompts'

// 理由生成请求接口
export interface ReasonGenerationRequest {
  question: Question                // 问题
  referenceAnswer: ReferenceAnswer  // 参考答案
  studentAnswer: StudentAnswer      // 学生答案
  highlightedText: string          // 教师高亮的文本
  highlightType: 'correct' | 'wrong' | 'unclear' | 'redundant'  // 标注类型
}

// 理由生成响应接口
export interface ReasonGenerationResponse {
  success: boolean      // 是否成功
  reason?: string       // 生成的理由
  error?: string        // 错误信息
  message?: string      // 消息
}

/**
 * 为教师标注生成评分理由（支持重试）
 */
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
  
  console.log('构建的理由生成Prompt长度:', prompt.length)
  
  let lastError: Error | null = null
  
  // 重试逻辑
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`理由生成尝试 ${attempt}/${maxRetries}`)
      
      // 调用LLM API生成理由
      const reason = await callReasonGenerationAPI(prompt)
      
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

/**
 * 调用LLM API生成理由
 */
async function callReasonGenerationAPI(prompt: string): Promise<string> {
  if (!isAPIConfigValid()) {
    throw new Error('Invalid API configuration, please check API_KEY and API_URL environment variables')
  }

  const requestBody = {
    model: API_CONFIG.LLM.GRADING.MODEL,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 300, // 理由生成使用较少的token
    temperature: 0.3, // 较低的温度确保一致性
  }

  const response = await fetch(API_CONFIG.LLM.API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_CONFIG.LLM.API_KEY}`
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `API call failed: ${response.status} ${response.statusText}. ${
        errorData.error?.message || 'Unknown error'
      }`
    )
  }

  const data = await response.json()
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('API response format error: missing required fields')
  }

  const content = data.choices[0].message.content
  
  console.log('=== LLM返回的理由 ===')
  console.log(content)
  console.log('=== 理由生成结束 ===')
  
  if (!content || !content.trim()) {
    throw new Error('LLM returned empty content')
  }
  
  return content.trim()
}

/**
 * 检查理由生成服务状态
 */
export function checkReasonGenerationServiceStatus(): {
  available: boolean
  message: string
} {
  if (!isAPIConfigValid()) {
    return {
      available: false,
      message: 'Invalid API configuration, please set correct API_KEY and API_URL environment variables'
    }
  }

  return {
    available: true,
    message: 'Reason generation service available'
  }
}