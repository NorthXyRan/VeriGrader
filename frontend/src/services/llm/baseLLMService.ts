import { API_CONFIG, isAPIConfigValid } from '@/config/api'

export interface LLMConfig {
  model: string
  maxTokens: number
  temperature: number
  responseFormat?: 'json' | 'text'
}

export interface LLMResponse {
  success: boolean
  content?: string
  error?: string
}

export async function callLLMAPI(
  prompt: string,
  config: LLMConfig,
  options: { signal?: AbortSignal } = {},
): Promise<LLMResponse> {
  try {
    if (!isAPIConfigValid()) {
      throw new Error('Invalid API configuration. Check VITE_API_KEY and VITE_API_URL.')
    }

    const requestBody: Record<string, unknown> = {
      model: config.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    }

    if (config.responseFormat === 'json') {
      requestBody.response_format = { type: 'json_object' }
    }

    const response = await fetch(API_CONFIG.LLM.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_CONFIG.LLM.API_KEY}`,
      },
      body: JSON.stringify(requestBody),
      signal: options.signal,
    })

    if (!response.ok) {
      throw new Error(`LLM request failed with status ${response.status}`)
    }

    const data: unknown = await response.json()
    if (
      typeof data !== 'object' ||
      data === null ||
      !('choices' in data) ||
      !Array.isArray(data.choices) ||
      typeof data.choices[0] !== 'object' ||
      data.choices[0] === null ||
      !('message' in data.choices[0]) ||
      typeof data.choices[0].message !== 'object' ||
      data.choices[0].message === null ||
      !('content' in data.choices[0].message) ||
      typeof data.choices[0].message.content !== 'string'
    ) {
      throw new Error('API response format error: missing required fields')
    }

    const content = data.choices[0].message.content

    if (!content || !content.trim()) {
      throw new Error('LLM returned empty content')
    }

    return {
      success: true,
      content: content.trim(),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export function getGradingConfig(): LLMConfig {
  return {
    model: API_CONFIG.LLM.GRADING.MODEL,
    maxTokens: API_CONFIG.LLM.GRADING.MAX_TOKENS,
    temperature: API_CONFIG.LLM.GRADING.TEMPERATURE,
    responseFormat: 'json',
  }
}

export function getUploadConfig(): LLMConfig {
  return {
    model: API_CONFIG.LLM.UPLOAD.MODEL,
    maxTokens: API_CONFIG.LLM.UPLOAD.MAX_TOKENS,
    temperature: API_CONFIG.LLM.UPLOAD.TEMPERATURE,
    responseFormat: 'json',
  }
}

export function getReasonGenerationConfig(): LLMConfig {
  return {
    model: API_CONFIG.LLM.REASON_GENERATION.MODEL,
    maxTokens: API_CONFIG.LLM.REASON_GENERATION.MAX_TOKENS,
    temperature: API_CONFIG.LLM.REASON_GENERATION.TEMPERATURE,
    responseFormat: 'json',
  }
}

export function checkLLMServiceStatus(): {
  available: boolean
  message: string
} {
  if (!isAPIConfigValid()) {
    return {
      available: false,
      message: 'Invalid API configuration. Set VITE_API_KEY and VITE_API_URL in frontend/.env.',
    }
  }

  return {
    available: true,
    message: 'LLM service available',
  }
}
