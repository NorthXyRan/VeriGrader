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
 * 为教师标注生成评分理由
 */
export async function generateReasonForHighlight(request: ReasonGenerationRequest): Promise<ReasonGenerationResponse> {
  try {
    console.log('开始生成理由：', {
      studentId: request.studentAnswer.student_id,
      questionId: request.question.question_id,
      highlightType: request.highlightType,
      textLength: request.highlightedText.length
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
    
    // 调用LLM API生成理由
    const reason = await callReasonGenerationAPI(prompt)
    
    console.log('理由生成完成')
    
    return {
      success: true,
      reason: reason.trim(),
      message: `Successfully generated reason for ${request.highlightType} highlight`
    }
  } catch (error) {
    console.error('理由生成失败：', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Reason generation failed, please check network connection and API configuration'
    }
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
  
  return content
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