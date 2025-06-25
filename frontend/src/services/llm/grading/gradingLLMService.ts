// 批改服务

import type { Question, ReferenceAnswer, StudentAnswer, HighlightData } from '../../../stores/useExamDataStore'
import { loadStaticPromptTemplate, buildGradingPrompt, buildGradingPromptWithFewShot } from './gradingPrompts'
import { callLLMAPI, getGradingConfig, checkLLMServiceStatus } from '../baseLLMService'

// 单个批改请求
export interface SingleGradingRequest {
  question: Question                // 问题
  referenceAnswer: ReferenceAnswer  // 参考答案
  studentAnswer: StudentAnswer      // 学生答案
}

// Few-Shot批改请求
export interface FewShotGradingRequest {
  question: Question                // 问题
  referenceAnswer: ReferenceAnswer  // 参考答案
  studentAnswer: StudentAnswer      // 学生答案
  fewShotPrompt: string            // Few-Shot 示例prompt
}

// 批改响应
export interface GradingResponse {
  success: boolean                     // 是否成功
  data?: HighlightData[]               // 批改结果
  error?: string                       // 错误信息
  message?: string                     // 消息
}

// 单个学生批改
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
    
    console.log('=== 批改Prompt ===')
    console.log('长度:', prompt.length)
    console.log('内容:', prompt)
    console.log('=== Prompt结束 ===')
    
    // 调用统一的LLM API
    const llmResponse = await callLLMAPI(prompt, getGradingConfig())
    
    if (!llmResponse.success) {
      throw new Error(llmResponse.error || 'LLM API call failed')
    }

    const gradingResult = JSON.parse(llmResponse.content!)
    
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


// 检查服务状态
export const checkGradingServiceStatus = checkLLMServiceStatus

// Few-Shot学生批改
export async function gradeSingleStudentAnswerWithFewShot(request: FewShotGradingRequest): Promise<GradingResponse> {
  try {
    console.log('开始Few-Shot批改：学生', request.studentAnswer.student_id, '问题', request.question.question_id)
    
    // 加载静态提示词模板
    const staticPrompt = await loadStaticPromptTemplate()
    
    // 构建带Few-Shot的完整prompt
    const prompt = buildGradingPromptWithFewShot(
      request.question,
      request.referenceAnswer,
      request.studentAnswer,
      staticPrompt,
      request.fewShotPrompt
    )
    
    console.log('=== Few-Shot批改Prompt ===')
    console.log('长度:', prompt.length)
    console.log('内容:', prompt)
    console.log('=== Prompt结束 ===')
    
    // 调用统一的LLM API
    const llmResponse = await callLLMAPI(prompt, getGradingConfig())
    
    if (!llmResponse.success) {
      throw new Error(llmResponse.error || 'LLM API call failed')
    }

    const gradingResult = JSON.parse(llmResponse.content!)
    
    console.log('Few-Shot批改完成：学生', gradingResult.student_id)
    
    return {
      success: true,
      data: [gradingResult],
      message: `Successfully graded student ${request.studentAnswer.student_id} with Few-Shot examples`
    }

  } catch (error) {
    console.error('Few-Shot批改失败:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: `Few-Shot grading failed for student ${request.studentAnswer.student_id}`
    }
  }
}