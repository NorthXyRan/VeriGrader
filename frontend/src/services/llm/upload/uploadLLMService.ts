import { Message } from '@/components/Message'

import { callLLMAPI, checkLLMServiceStatus, getUploadConfig } from '../baseLLMService'
import { parseJsonObject } from '../jsonResponse'
import { UPLOAD_PROMPTS } from './uploadPrompts'

class UploadLLMService {
  async parse(content: string, type: 'paper' | 'answer'): Promise<Record<string, unknown>> {
    const label = type === 'paper' ? 'paper' : 'reference answer'
    Message.info(`Parsing the ${label} with the configured language model...`)

    const prompt =
      type === 'paper' ? UPLOAD_PROMPTS.PARSE_PAPER(content) : UPLOAD_PROMPTS.PARSE_ANSWER(content)
    const response = await callLLMAPI(prompt, getUploadConfig())

    if (!response.success || !response.content) {
      const message = response.error || 'The model returned no content'
      Message.error(`Model parsing failed: ${message}`)
      throw new Error(message)
    }

    try {
      const result = parseJsonObject(response.content)
      Message.success(`${label[0].toUpperCase()}${label.slice(1)} parsed successfully`)
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid model response'
      Message.error(`Model parsing failed: ${message}`)
      throw error
    }
  }

  isAvailable(): boolean {
    return checkLLMServiceStatus().available
  }
}

export const uploadLLMService = new UploadLLMService()
