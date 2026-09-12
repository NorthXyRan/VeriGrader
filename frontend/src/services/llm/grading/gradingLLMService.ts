import type { HighlightData, Question, ReferenceAnswer, StudentAnswer } from '@/types/exam'
import { abortableDelay } from '@/utils/asyncUtils'

import { callLLMAPI, checkLLMServiceStatus, getGradingConfig } from '../baseLLMService'
import { buildGradingPrompt } from './gradingPrompts'
import { parseGradingResult } from './gradingResult'

export { parseGradingResult } from './gradingResult'

export interface SingleGradingRequest {
  question: Question
  referenceAnswer: ReferenceAnswer
  studentAnswer: StudentAnswer
  signal?: AbortSignal
}

export interface FewShotGradingRequest extends SingleGradingRequest {
  fewShotPrompt: string
}

export interface GradingResponse {
  success: boolean
  data?: HighlightData[]
  error?: string
  message?: string
}

const retryDelay = (attempt: number) => Math.min(500 * 2 ** (attempt - 1), 4_000)

async function gradeStudentAnswer(
  request: SingleGradingRequest,
  fewShotPrompt: string | undefined,
  maxRetries: number,
): Promise<GradingResponse> {
  const { question, referenceAnswer, studentAnswer, signal } = request
  if (studentAnswer.question_id !== question.question_id) {
    return { success: false, error: 'Student answer question_id does not match the question' }
  }
  if (referenceAnswer.question_id !== question.question_id) {
    return { success: false, error: 'Reference answer question_id does not match the question' }
  }

  const prompt = buildGradingPrompt(question, referenceAnswer, studentAnswer, fewShotPrompt)
  const attempts = Math.max(1, Math.trunc(maxRetries) || 1)
  let lastError = 'Unknown grading error'

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await callLLMAPI(prompt, getGradingConfig(), { signal })
    if (response.success && response.content) {
      try {
        const result = parseGradingResult(
          response.content,
          studentAnswer.student_id,
          question.question_id,
          question.score,
        )
        return {
          success: true,
          data: [result],
          message: `Successfully graded student ${studentAnswer.student_id} for question ${question.question_id}`,
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : lastError
      }
    } else {
      lastError = response.error || lastError
    }

    if (signal?.aborted) break
    if (attempt < attempts) await abortableDelay(retryDelay(attempt), signal)
  }

  return {
    success: false,
    error: lastError,
    message: `Grading failed after ${attempts} attempts`,
  }
}

export function gradeSingleStudentAnswer(
  request: SingleGradingRequest,
  maxRetries = 3,
): Promise<GradingResponse> {
  return gradeStudentAnswer(request, undefined, maxRetries)
}

export function gradeSingleStudentAnswerWithFewShot(
  request: FewShotGradingRequest,
  maxRetries = 3,
): Promise<GradingResponse> {
  return gradeStudentAnswer(request, request.fewShotPrompt, maxRetries)
}

export const checkGradingServiceStatus = checkLLMServiceStatus
