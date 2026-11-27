export type MessageType = 'success' | 'error' | 'warning' | 'info' | 'grading'
export type GradingStatus = 'in-progress' | 'completed' | 'failed'

export interface GradingProgress {
  current: number
  total: number
}

export interface GradingSubMessage {
  message: string
  status: GradingStatus
}

export interface CompletedStudent {
  studentId: number
  score: number
}

export interface MessageOptions {
  message: string
  type?: Exclude<MessageType, 'grading'>
  duration?: number
  showIcon?: boolean
}

export interface GradingMessageOptions {
  message: string
  type: 'grading'
  duration?: number
  showIcon?: boolean
  progress?: GradingProgress
  status?: GradingStatus
  subMessages?: GradingSubMessage[]
  completedStudents?: CompletedStudent[]
}

export interface MessageInstance {
  id: string
  message: string
  type: MessageType
  duration: number
  showIcon: boolean
  visible: boolean

  progress?: GradingProgress
  status?: GradingStatus
  subMessages?: GradingSubMessage[]
  completedStudents?: CompletedStudent[]
}

export interface MessageManagerInstance {
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
  grading: (options: GradingMessageOptions) => string
  updateGrading: (id: string, options: Partial<GradingMessageOptions>) => void
  addSubMessage: (id: string, subMessage: GradingSubMessage) => void
  updateSubMessage: (id: string, index: number, updates: Partial<GradingSubMessage>) => void
  addCompletedStudent: (id: string, studentInfo: CompletedStudent) => void
  close: (id: string) => void
}
