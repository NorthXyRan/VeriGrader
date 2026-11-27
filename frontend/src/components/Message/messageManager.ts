import { reactive } from 'vue'
import type {
  CompletedStudent,
  GradingMessageOptions,
  GradingSubMessage,
  MessageInstance,
  MessageManagerInstance,
  MessageOptions,
} from './types'

export const messageStore = reactive({
  messages: [] as MessageInstance[],
  maxMessages: 5,

  add(options: MessageOptions | GradingMessageOptions): string {
    const isGradingMessage = options.type === 'grading'
    const id = generateId()
    const message: MessageInstance = {
      id,
      message: options.message,
      type: options.type || 'info',
      duration: options.duration !== undefined ? options.duration : 3000,
      showIcon: options.showIcon !== false,
      visible: true,
    }

    if (options.type === 'grading') {
      message.progress = options.progress
      message.status = options.status || 'in-progress'
      message.subMessages = options.subMessages || []
      message.completedStudents = options.completedStudents || []

      message.duration = options.duration !== undefined ? options.duration : 0
    }

    if (!isGradingMessage) {
      const nonGradingMessages = this.messages.filter((msg) => msg.type !== 'grading')
      if (nonGradingMessages.length >= this.maxMessages) {
        const oldestNonGrading = this.messages.find((msg) => msg.type !== 'grading')
        if (oldestNonGrading) {
          this.close(oldestNonGrading.id)
        }
      }
    }

    this.messages.push(message)

    return id
  },

  close(id: string): void {
    const index = this.messages.findIndex((msg) => msg.id === id)
    if (index > -1) {
      this.messages[index].visible = false

      setTimeout(() => {
        const currentIndex = this.messages.findIndex((msg) => msg.id === id)
        if (currentIndex > -1) {
          this.messages.splice(currentIndex, 1)
        }
      }, 300)
    }
  },

  updateGrading(id: string, updates: Partial<GradingMessageOptions>): void {
    const index = this.messages.findIndex((msg) => msg.id === id)
    if (index > -1 && this.messages[index].type === 'grading') {
      const message = this.messages[index]

      const updatedMessage = { ...message }

      if (updates.message !== undefined) {
        updatedMessage.message = updates.message
      }
      if (updates.progress !== undefined) {
        updatedMessage.progress = { ...updates.progress }
      }
      if (updates.status !== undefined) {
        updatedMessage.status = updates.status
      }
      if (updates.subMessages !== undefined) {
        updatedMessage.subMessages = [...updates.subMessages]
      }
      if (updates.completedStudents !== undefined) {
        updatedMessage.completedStudents = [...updates.completedStudents]
      }
      if (updates.duration !== undefined) {
        updatedMessage.duration = updates.duration
      }

      this.messages.splice(index, 1, updatedMessage)
    }
  },

  addSubMessage(id: string, subMessage: GradingSubMessage): void {
    const index = this.messages.findIndex((msg) => msg.id === id)
    if (index > -1 && this.messages[index].type === 'grading') {
      const message = this.messages[index]
      const updatedMessage = {
        ...message,
        subMessages: [...(message.subMessages || []), subMessage],
      }
      this.messages.splice(index, 1, updatedMessage)
    }
  },

  updateSubMessage(id: string, index: number, updates: Partial<GradingSubMessage>): void {
    const msgIndex = this.messages.findIndex((msg) => msg.id === id)
    if (msgIndex > -1 && this.messages[msgIndex].type === 'grading') {
      const message = this.messages[msgIndex]
      if (message.subMessages && message.subMessages[index]) {
        const updatedSubMessages = [...message.subMessages]
        updatedSubMessages[index] = { ...updatedSubMessages[index], ...updates }

        const updatedMessage = {
          ...message,
          subMessages: updatedSubMessages,
        }
        this.messages.splice(msgIndex, 1, updatedMessage)
      }
    }
  },

  addCompletedStudent(id: string, studentInfo: CompletedStudent): void {
    const index = this.messages.findIndex((msg) => msg.id === id)
    if (index > -1 && this.messages[index].type === 'grading') {
      const message = this.messages[index]

      const updatedStudents = [...(message.completedStudents || []), studentInfo]

      const updatedMessage = {
        ...message,
        completedStudents: updatedStudents,
      }

      this.messages.splice(index, 1, updatedMessage)
    }
  },
})

let messageId = 0

function generateId(): string {
  return `message_${Date.now()}_${++messageId}`
}

const messageManager: MessageManagerInstance = {
  success(message: string, duration = 3000): string {
    return messageStore.add({
      message,
      type: 'success',
      duration,
      showIcon: true,
    })
  },

  error(message: string, duration = 4000): string {
    return messageStore.add({
      message,
      type: 'error',
      duration,
      showIcon: true,
    })
  },

  warning(message: string, duration = 3500): string {
    return messageStore.add({
      message,
      type: 'warning',
      duration,
      showIcon: true,
    })
  },

  info(message: string, duration = 3000): string {
    return messageStore.add({
      message,
      type: 'info',
      duration,
      showIcon: true,
    })
  },

  grading(options: GradingMessageOptions): string {
    return messageStore.add(options)
  },

  updateGrading(id: string, options: Partial<GradingMessageOptions>): void {
    messageStore.updateGrading(id, options)
  },

  addSubMessage(id: string, subMessage: GradingSubMessage): void {
    messageStore.addSubMessage(id, subMessage)
  },

  updateSubMessage(id: string, index: number, updates: Partial<GradingSubMessage>): void {
    messageStore.updateSubMessage(id, index, updates)
  },

  addCompletedStudent(id: string, studentInfo: CompletedStudent): void {
    messageStore.addCompletedStudent(id, studentInfo)
  },

  close(id: string): void {
    messageStore.close(id)
  },
}

export const Message = Object.assign(
  (options: string | MessageOptions) => {
    if (typeof options === 'string') {
      return messageStore.add({ message: options })
    }
    return messageStore.add(options)
  },
  {
    success: messageManager.success,
    error: messageManager.error,
    warning: messageManager.warning,
    info: messageManager.info,
    grading: messageManager.grading,
    updateGrading: messageManager.updateGrading,
    addSubMessage: messageManager.addSubMessage,
    updateSubMessage: messageManager.updateSubMessage,
    addCompletedStudent: messageManager.addCompletedStudent,
    close: messageManager.close,
  },
)
