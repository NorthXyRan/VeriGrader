// 基础LLM服务

import { API_CONFIG, isAPIConfigValid } from '../../config/api'

// 配置接口
export interface LLMConfig {
  model: string
  maxTokens: number
  temperature: number
  responseFormat?: 'json' | 'text'
}

// 响应接口
export interface LLMResponse {
  success: boolean
  content?: string
  error?: string
}

// 统一API调用
export async function callLLMAPI(prompt: string, config: LLMConfig): Promise<LLMResponse> {
  try {
    if (!isAPIConfigValid()) {
      throw new Error('Invalid API configuration, please check API_KEY and API_URL environment variables')
    }

    const requestBody = {
      model: config.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
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
    
    if (!content || !content.trim()) {
      throw new Error('LLM returned empty content')
    }

    return {
      success: true,
      content: content.trim()
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 批改配置
export function getGradingConfig(): LLMConfig {
  return {
    model: API_CONFIG.LLM.GRADING.MODEL,
    maxTokens: API_CONFIG.LLM.GRADING.MAX_TOKENS,
    temperature: API_CONFIG.LLM.GRADING.TEMPERATURE,
    responseFormat: 'json'
  }
}

// 理由生成配置
export function getReasonGenerationConfig(): LLMConfig {
  return {
    model: API_CONFIG.LLM.REASON_GENERATION.MODEL,
    maxTokens: API_CONFIG.LLM.REASON_GENERATION.MAX_TOKENS,
    temperature: API_CONFIG.LLM.REASON_GENERATION.TEMPERATURE,
    responseFormat: 'text'
  }
}

// 服务状态检查
export function checkLLMServiceStatus(): {
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
    message: 'LLM service available'
  }
}