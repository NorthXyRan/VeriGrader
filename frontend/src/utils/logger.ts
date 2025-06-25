// 统一日志工具

interface LogData {
  [key: string]: any
}

class Logger {
  private isDevelopment = import.meta.env.DEV

  // 开始日志组
  group(operation: string, context: string): void {
    if (this.isDevelopment) {
      console.group(`[${operation}] ${context}`)
    }
  }

  // 结束日志组
  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd()
    }
  }

  // 信息日志
  info(message: string, data?: LogData): void {
    if (this.isDevelopment) {
      if (data) {
        console.log(`INFO: ${message}`, data)
      } else {
        console.log(`INFO: ${message}`)
      }
    }
  }

  // 成功日志
  success(message: string, data?: LogData): void {
    if (this.isDevelopment) {
      if (data) {
        console.log(`SUCCESS: ${message}`, data)
      } else {
        console.log(`SUCCESS: ${message}`)
      }
    }
  }

  // 错误日志
  error(message: string, error?: any): void {
    if (this.isDevelopment) {
      if (error) {
        console.error(`ERROR: ${message}`, error)
      } else {
        console.error(`ERROR: ${message}`)
      }
    }
  }

  // 警告日志
  warn(message: string, data?: LogData): void {
    if (this.isDevelopment) {
      if (data) {
        console.warn(`WARN: ${message}`, data)
      } else {
        console.warn(`WARN: ${message}`)
      }
    }
  }

  // 跳过日志
  skip(message: string, reason?: string): void {
    if (this.isDevelopment) {
      console.log(`SKIP: ${message}${reason ? ` (${reason})` : ''}`)
    }
  }

  // 保存日志
  saved(message: string): void {
    if (this.isDevelopment) {
      console.log(`SAVED: ${message}`)
    }
  }

  // 等待日志
  wait(message: string): void {
    if (this.isDevelopment) {
      console.log(`WAIT: ${message}`)
    }
  }

  // 重试日志
  retry(message: string, attempt: number, total: number): void {
    if (this.isDevelopment) {
      console.log(`RETRY: ${message} (第${attempt}次尝试，共${total}次)`)
    }
  }

  // 通用日志
  log(message: string, data?: LogData): void {
    if (this.isDevelopment) {
      if (data) {
        console.log(message, data)
      } else {
        console.log(message)
      }
    }
  }
}

// 导出单例
export const logger = new Logger()

// 便捷的批改日志方法
export const gradingLogger = {
  // 单个批改
  startSingle: (studentId: number, questionId: number) => {
    logger.group('单个批改', `学生${studentId}-题目${questionId}`)
  },

  // 批量批改
  startBatch: (questionId: number, count: number) => {
    logger.group('批量批改', `题目${questionId} - ${count}个学生`)
  },

  // 理由生成
  startReasonGeneration: (studentId: number, questionId: number) => {
    logger.group('理由生成', `学生${studentId}-题目${questionId}`)
  },

  // 批改前检查
  preCheck: (data: {
    数据完整性: boolean
    FewShot状态?: string
    题目预览?: string
    答案长度?: number
    是否重新批改?: boolean
  }) => {
    logger.info('批改前检查', data)
  },

  // 批改成功
  gradingSuccess: (data: {
    总分: number
    标注统计?: {
      正确: number
      错误: number
      不清楚: number
      冗余: number
    }
  }) => {
    logger.success('批改成功', data)
  },

  // 学生选择统计
  selectionStats: (data: {
    总学生数: number
    选中数量: number
    选择比例: string
    选中学生: number[]
    题目ID: number
  }) => {
    logger.info('学生选择统计', data)
  },

  end: () => {
    logger.groupEnd()
  }
}