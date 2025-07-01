// 统一错误处理

import { ElMessage } from 'element-plus'

// 错误类型
export enum ErrorType {
  GRADING = 'grading',
  REASON_GENERATION = 'reason_generation',
  DATA_VALIDATION = 'data_validation',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  NETWORK = 'network'
}

// 错误处理配置
interface ErrorConfig {
  showMessage: boolean
  logToConsole: boolean
  messageType: 'error' | 'warning' | 'info'
}

const defaultErrorConfig: ErrorConfig = {
  showMessage: true,
  logToConsole: true,
  messageType: 'error'
}

export function useErrorHandler() {
  
  // 格式化错误信息
  const formatErrorMessage = (error: Error | string, context: string): string => {
    const errorMsg = error instanceof Error ? error.message : error
    
    // 根据错误类型提供用户友好的消息
    if (errorMsg.includes('LLM returned empty content')) {
      return 'AI服务返回空内容，请重试'
    }
    if (errorMsg.includes('API call failed')) {
      return 'AI服务调用失败，请检查网络连接'
    }
    if (errorMsg.includes('not found')) {
      return '数据未找到，请检查上传内容'
    }
    if (errorMsg.includes('timeout')) {
      return '请求超时，请重试'
    }
    
    return errorMsg
  }

  // 处理批改错误
  const handleGradingError = (
    error: Error | string, 
    context: string = 'grading',
    config: Partial<ErrorConfig> = {}
  ): void => {
    const finalConfig = { ...defaultErrorConfig, ...config }
    const formattedMessage = formatErrorMessage(error, context)
    
    if (finalConfig.logToConsole) {
      console.error(`[${context}]`, error)
    }
    
    if (finalConfig.showMessage) {
      ElMessage.error(formattedMessage)
    }
  }

  // 处理理由生成错误
  const handleReasonGenerationError = (
    error: Error | string,
    attempt?: number,
    maxAttempts?: number
  ): void => {
    const errorMsg = error instanceof Error ? error.message : error
    
    console.warn('理由生成失败:', errorMsg)
    
    // 不在重试过程中显示错误消息，只有最终失败才显示
    if (!attempt || !maxAttempts || attempt >= maxAttempts) {
      const userMessage = formatErrorMessage(error, 'reason_generation')
      ElMessage.error(`Reason generation failed: ${userMessage}`)
    }
  }

  // 处理数据验证错误
  const handleValidationError = (
    field: string,
    value: any,
    requirement: string
  ): void => {
    const message = `Data validation failed: ${field} ${requirement}`
    console.warn('[validation]', { field, value, requirement })
    ElMessage.warning(message)
  }

  // 处理服务不可用错误
  const handleServiceUnavailableError = (
    serviceName: string,
    details?: string
  ): void => {
    const message = `${serviceName} is temporarily unavailable${details ? ': ' + details : ''}`
    console.error('[service]', { serviceName, details })
    ElMessage.error(message)
  }

  // 处理网络错误
  const handleNetworkError = (
    operation: string,
    error: Error | string
  ): void => {
    const errorMsg = error instanceof Error ? error.message : error
    const message = `Network request failed (${operation}): Please check your network connection`
    
    console.error('[network]', { operation, error: errorMsg })
    ElMessage.error(message)
  }

  // 通用错误处理器
  const handleError = (
    error: Error | string,
    type: ErrorType = ErrorType.GRADING,
    context?: string
  ): void => {
    switch (type) {
      case ErrorType.GRADING:
        handleGradingError(error, context || 'grading')
        break
      case ErrorType.REASON_GENERATION:
        handleReasonGenerationError(error)
        break
      case ErrorType.DATA_VALIDATION:
        ElMessage.warning(error instanceof Error ? error.message : error)
        break
      case ErrorType.SERVICE_UNAVAILABLE:
        handleServiceUnavailableError(context || 'Unknown Service', error instanceof Error ? error.message : error)
        break
      case ErrorType.NETWORK:
        handleNetworkError(context || 'unknown', error)
        break
      default:
        handleGradingError(error, context || 'unknown')
    }
  }

  // 创建重试处理器
  const createRetryHandler = (
    operation: string,
    maxRetries: number = 3
  ) => {
    return {
      onRetry: (attempt: number, error: Error | string) => {
        console.warn(`${operation} 重试 ${attempt}/${maxRetries}:`, error)
      },
      onFinalFailure: (error: Error | string) => {
        handleError(error, ErrorType.GRADING, operation)
      }
    }
  }

  return {
    handleError,
    handleGradingError,
    handleReasonGenerationError,
    handleValidationError,
    handleServiceUnavailableError,
    handleNetworkError,
    createRetryHandler,
    ErrorType
  }
}