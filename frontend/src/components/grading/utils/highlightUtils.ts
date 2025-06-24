/**
 * 高亮算法工具文件 - 简化版本
 * 只在这里定义颜色，Vue组件不重复定义
 */

// ============== 类型定义 ==============

export interface HighlightItem {
  'Student answer': string
  'Scoring point': number
  reason: string
}

export interface HighlightData {
  student_id: number
  question_id: number
  answer: {
    correct: HighlightItem[]
    wrong: HighlightItem[]
    unclear: HighlightItem[]
    redundant: HighlightItem[]
  }
  total_score: number
}


export type HighlightType = 'correct' | 'wrong' | 'unclear' | 'redundant'

// ============== 统一颜色配置 ==============

export const HIGHLIGHT_CONFIG = {
    correct: {
      className: 'highlight-correct',
      backgroundColor: 'rgba(212, 237, 218, 1)',
      borderColor: 'rgba(40, 167, 69, 1)',
      hoverBackgroundColor: 'rgba(195, 230, 203, 1)',
      hoverBorderColor: 'rgba(30, 126, 52, 1)',
      label: '正确',
    },
    wrong: {
      className: 'highlight-wrong',
      backgroundColor: 'rgba(248, 215, 218, 1)',
      borderColor: 'rgba(220, 53, 69, 1)',
      hoverBackgroundColor: 'rgba(245, 198, 203, 1)',
      hoverBorderColor: 'rgba(200, 35, 51, 1)',
      label: '错误',
    },
    unclear: {
      className: 'highlight-unclear',
      backgroundColor: 'rgba(255, 243, 205, 1)',
      borderColor: 'rgba(255, 193, 7, 1)',
      hoverBackgroundColor: 'rgba(255, 234, 167, 1)',
      hoverBorderColor: 'rgba(224, 168, 0, 1)',
      label: '模糊',
    },
    redundant: {
      className: 'highlight-redundant',
      backgroundColor: 'rgba(209, 236, 241, 1)',
      borderColor: 'rgba(23, 162, 184, 1)',
      hoverBackgroundColor: 'rgba(190, 229, 235, 1)',
      hoverBorderColor: 'rgba(19, 132, 150, 1)',
      label: '冗余',
    },
  }

// ============== 工具函数 ==============

export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// ============== 主函数 ==============

/**
 * 生成高亮后的HTML内容，直接使用HighlightData
 */
export function generateHighlightedHTML(
  content: string,
  highlightData: HighlightData | null
): string {
  if (!content || !highlightData) {
    return escapeHtml(content || '')
  }

  // 收集所有高亮片段及其位置
  const highlights: Array<{
    start: number
    end: number
    text: string
    type: HighlightType
    reason: string
    scoringPoint: number
  }> = []

  // 遍历所有高亮类型
  Object.entries(highlightData.answer).forEach(([type, items]) => {
    if (Array.isArray(items)) {
      items.forEach((item) => {
        const searchText = item['Student answer']
        let pos = 0

        // 查找所有出现位置
        while ((pos = content.indexOf(searchText, pos)) !== -1) {
          highlights.push({
            start: pos,
            end: pos + searchText.length,
            text: searchText,
            type: type as HighlightType,
            reason: item.reason,
            scoringPoint: item['Scoring point']
          })
          pos += 1
        }
      })
    }
  })

  // 按位置排序，长文本优先
  highlights.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start
    return b.text.length - a.text.length
  })

  console.log('[highlightUtils] 生成高亮HTML:', {
    totalHighlights: highlights.length,
    highlightTypes: Object.keys(highlightData.answer).reduce((acc: Record<string, number>, key) => {
      const typedKey = key as keyof typeof highlightData.answer
      acc[key] = highlightData.answer[typedKey].length
      return acc
    }, {} as Record<string, number>)
  })

  let tempContent = content

  // 为每个高亮创建开始和结束标记
  highlights.forEach((highlight, index) => {
    const uniqueId = `HL_${index}_`
    const markedText = `${uniqueId}START${highlight.text}${uniqueId}END`

    const startPos = tempContent.indexOf(highlight.text, highlight.start)
    if (startPos !== -1) {
      tempContent =
        tempContent.substring(0, startPos) +
        markedText +
        tempContent.substring(startPos + highlight.text.length)
    }
  })

  // 替换标记为实际的HTML标签
  let finalResult = escapeHtml(tempContent)

  highlights.forEach((highlight, index) => {
    const uniqueId = `HL_${index}_`
    const config = HIGHLIGHT_CONFIG[highlight.type]

    const startTag = `<span 
          class="text-highlight ${config.className}" 
          data-type="${highlight.type}"
          data-text="${escapeHtml(highlight.text)}"
          data-reason="${escapeHtml(highlight.reason)}"
          data-scoring-point="${highlight.scoringPoint}"
          style="
            background-color: ${config.backgroundColor}; 
            border-left: 3px solid ${config.borderColor}; 
            padding: 2px 4px;
            border-radius: 3px;
            cursor: pointer;
            margin: 0 1px;
            position: relative;
            z-index: ${index + 1};
            transition: all 0.2s ease;
          "
          onmouseover="this.style.backgroundColor='${config.hoverBackgroundColor}'; this.style.borderLeftColor='${config.hoverBorderColor}'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.15)'"
          onmouseout="this.style.backgroundColor='${config.backgroundColor}'; this.style.borderLeftColor='${config.borderColor}'; this.style.transform=''; this.style.boxShadow=''"
          title="【${config.label}】${highlight.reason}"
      >`
    const endTag = '</span>'

    finalResult = finalResult
      .replace(new RegExp(escapeHtml(`${uniqueId}START`), 'g'), startTag)
      .replace(new RegExp(escapeHtml(`${uniqueId}END`), 'g'), endTag)
  })

  return finalResult
}

/**
 * 解析高亮元素  把HTML还原成数据
 */
export function parseHighlightElement(element: HTMLElement, highlightData?: HighlightData | null): {
  type: HighlightType
  text: string
  reason: string
  scoringPoint: number
} | null {
  if (!element.classList.contains('text-highlight')) {
    return null
  }

  const type = element.getAttribute('data-type') as HighlightType
  const text = element.getAttribute('data-text') || ''
  const scoringPointStr = element.getAttribute('data-scoring-point') || '0'
  const scoringPoint = parseInt(scoringPointStr) || 0
  
  // 从原始数据中查找完整理由，避免HTML属性截断问题
  let reason = ''
  if (highlightData && type && text) {
    const targetArray = highlightData.answer[type]
    const foundItem = targetArray.find((item: any) => item['Student answer'] === text)
    if (foundItem) {
      reason = foundItem.reason || ''
    }
  }
  
  // 如果没有找到，回退到HTML属性（虽然可能被截断）
  if (!reason) {
    reason = element.getAttribute('data-reason') || ''
  }
  
  console.log('[highlightUtils] 解析高亮元素:', {
    text: text.substring(0, 20) + '...',
    type: type,
    scoringPoint: scoringPoint,
    hasReason: !!reason,
    reasonLength: reason.length
  })

  return {
    type,
    text: text.replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
    reason: reason.replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
    scoringPoint
  }
}
