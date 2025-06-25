// 文本处理工具

// 截取文本并添加省略号
export const truncateText = (text: string, maxLength: number = 30): string => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// 预览文本（常用的30字符截取）
export const previewText = (text: string): string => {
  return truncateText(text, 30)
}

// 长预览文本（50字符截取）
export const longPreviewText = (text: string): string => {
  return truncateText(text, 50)
}

// 短预览文本（20字符截取）
export const shortPreviewText = (text: string): string => {
  return truncateText(text, 20)
}

// 格式化文本用于日志显示
export const formatTextForLog = (text: string, length: number = 30): string => {
  return truncateText(text, length)
}