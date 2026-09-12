import type { HighlightType, Question, ReferenceAnswer, StudentAnswer } from '@/types/exam'
import { abortableDelay } from '@/utils/asyncUtils'

import { callLLMAPI, checkLLMServiceStatus, getReasonGenerationConfig } from '../baseLLMService'
import { parseJsonObject } from '../jsonResponse'
import { buildReasonGenerationPrompt } from './gradingPrompts'

export interface ReasonGenerationRequest {
  question: Question
  referenceAnswer: ReferenceAnswer
  studentAnswer: StudentAnswer
  highlightedText: string
  highlightType: HighlightType
  signal?: AbortSignal
}

export interface ReasonGenerationResponse {
  success: boolean
  reason?: string
  matchedReferenceAnswer?: string
  error?: string
  message?: string
}

function parseReason(content: string): { reason: string; matchedReferenceAnswer: string } {
  const result = parseJsonObject(content)
  if (typeof result.reason !== 'string' || !result.reason.trim()) {
    throw new Error('Reason response is missing a reason')
  }
  const matchedReferenceAnswer = result['matched reference answer']
  if (matchedReferenceAnswer !== undefined && typeof matchedReferenceAnswer !== 'string') {
    throw new Error('Reason response contains an invalid reference match')
  }

  return {
    reason: result.reason.trim(),
    matchedReferenceAnswer: matchedReferenceAnswer || '',
  }
}

export async function generateReasonForHighlight(
  request: ReasonGenerationRequest,
  maxRetries = 3,
): Promise<ReasonGenerationResponse> {
  const prompt = buildReasonGenerationPrompt(
    request.question,
    request.referenceAnswer,
    request.studentAnswer,
    request.highlightedText,
    request.highlightType,
  )
  const attempts = Math.max(1, Math.trunc(maxRetries) || 1)
  let lastError = 'Unknown reason-generation error'

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await callLLMAPI(prompt, getReasonGenerationConfig(), {
      signal: request.signal,
    })
    if (response.success && response.content) {
      try {
        const parsed = parseReason(response.content)
        return {
          success: true,
          ...parsed,
          message: `Successfully generated a ${request.highlightType} reason`,
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : lastError
      }
    } else {
      lastError = response.error || lastError
    }

    if (request.signal?.aborted) break
    if (attempt < attempts) {
      await abortableDelay(Math.min(500 * 2 ** attempt, 4_000), request.signal)
    }
  }

  return {
    success: false,
    error: lastError,
    message: `Reason generation failed after ${attempts} attempts`,
  }
}

export const checkReasonGenerationServiceStatus = checkLLMServiceStatus
