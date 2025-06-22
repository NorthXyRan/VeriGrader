/**
 * 批改服务：调用LLM API进行给分
 */

import { API_CONFIG, isAPIConfigValid } from '../../../config/api'
import type { Question, ReferenceAnswer, StudentAnswer, HighlightData } from '../../../stores/useExamDataStore'
import { loadStaticPromptTemplate, buildGradingPrompt } from './gradingPrompts'

// 单个学生给分请求接口
export interface SingleGradingRequest {
  question: Question                // 问题
  referenceAnswer: ReferenceAnswer  // 参考答案
  studentAnswer: StudentAnswer      // 学生答案
}

// 给分响应数据接口
export interface GradingResponse {
  success: boolean                     // 是否成功
  data?: HighlightData[]               // 批改结果
  error?: string                       // 错误信息
  message?: string                     // 消息
}

/**
 * 给单个学生答案批改，批改后返回批改结果
 */
export async function gradeSingleStudentAnswer(request: SingleGradingRequest): Promise<GradingResponse> {
  try {
    console.log('开始批改：学生', request.studentAnswer.student_id, '问题', request.question.question_id)
    
    // 加载静态提示词模板
    const staticPrompt = await loadStaticPromptTemplate()
    
    // 构建完整的prompt
    const prompt = buildGradingPrompt(
      request.question,
      request.referenceAnswer,
      request.studentAnswer,
      staticPrompt
    )
    
    console.log('构建的Prompt长度:', prompt.length)
    console.log('=== 📝 发送给LLM的完整Prompt ===\n', prompt)
    console.log('=== Prompt结束 ===')
    
    // 直接调用LLM API
    const gradingResult = await callLLMAPI(prompt)
    
    console.log('批改完成：学生', gradingResult.student_id)
    
    // 转换为HighlightData格式
    const highlightData: HighlightData = {
      student_id: gradingResult.student_id,
      question_id: gradingResult.question_id,
      answer: gradingResult.answer,
      total_score: gradingResult.total_score
    }

    return {
      success: true,
      data: [highlightData],
      message: `Successfully graded student ${gradingResult.student_id} for question ${gradingResult.question_id}`
    }
  } catch (error) {
    console.error('打分失败：', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Single student grading failed, please check network connection and API configuration'
    }
  }
}

/**
 * 直接调用LLM API
 */
async function callLLMAPI(prompt: string): Promise<any> {
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
    max_tokens: API_CONFIG.LLM.GRADING.MAX_TOKENS,
    temperature: API_CONFIG.LLM.GRADING.TEMPERATURE,
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
  
  console.log('=== LLM返回的原始回答 ===')
  console.log(content)
  console.log('=== LLM回答结束 ===')
  
  return  JSON.parse(content)
}

/**
 * 检查服务状态
 */
export function checkGradingServiceStatus(): {
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
    message: 'Grading service available'
  }
}