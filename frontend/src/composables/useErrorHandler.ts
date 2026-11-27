import { Message } from '@/components/Message'

export enum ErrorType {
  GRADING = 'grading',
  REASON_GENERATION = 'reason_generation',
  DATA_VALIDATION = 'data_validation',
  SERVICE_UNAVAILABLE = 'service_unavailable',
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error || 'Unknown error')

const displayName = (context: string) =>
  context.replace(/_/g, ' ').replace(/^./, (character) => character.toUpperCase())

export function useErrorHandler() {
  const formatErrorMessage = (error: unknown): string => {
    const message = errorMessage(error)
    const normalized = message.toLowerCase()

    if (normalized.includes('empty content')) {
      return 'The AI service returned an empty response.'
    }
    if (normalized.includes('api call failed') || normalized.includes('request failed')) {
      return 'The AI service request failed. Check your connection and API settings.'
    }
    if (normalized.includes('not found')) {
      return 'Required data was not found. Check the uploads.'
    }
    if (normalized.includes('timeout') || normalized.includes('timed out')) {
      return 'The request timed out. Please try again.'
    }
    return message
  }

  const handleGradingError = (error: unknown): void => {
    Message.error(formatErrorMessage(error))
  }

  const handleValidationError = (field: string, requirement: string): void => {
    Message.warning(`Invalid ${field}: ${requirement}`)
  }

  const handleError = (
    error: unknown,
    type: ErrorType = ErrorType.GRADING,
    context = 'service',
  ): void => {
    const message = formatErrorMessage(error)

    if (type === ErrorType.DATA_VALIDATION) {
      Message.warning(message)
    } else if (type === ErrorType.REASON_GENERATION) {
      Message.error(`Reason generation failed: ${message}`)
    } else if (type === ErrorType.SERVICE_UNAVAILABLE) {
      Message.error(`${displayName(context)} is unavailable: ${message}`)
    } else {
      Message.error(message)
    }
  }

  return { handleError, handleGradingError, handleValidationError }
}
