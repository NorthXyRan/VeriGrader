import {
  HIGHLIGHT_TYPES,
  type HighlightData,
  type HighlightItem,
  type HighlightType,
} from '@/types/exam'

export interface LocatedHighlight {
  start: number
  end: number
  item: HighlightItem
  type: HighlightType
  occurrence: number
}

export function findTextOccurrence(content: string, text: string, occurrence: number): number {
  if (!text || occurrence < 0) return -1

  let position = 0
  for (let current = 0; current <= occurrence; current += 1) {
    const match = content.indexOf(text, position)
    if (match === -1) return -1
    if (current === occurrence) return match
    position = match + text.length
  }

  return -1
}

export function locateHighlightRanges(
  content: string,
  highlightData: HighlightData,
): LocatedHighlight[] {
  const ranges: LocatedHighlight[] = []

  for (const type of HIGHLIGHT_TYPES) {
    const occurrences = new Map<string, number>()
    for (const item of highlightData.answer[type] ?? []) {
      const text = item['Student answer']
      const occurrence = occurrences.get(text) ?? 0
      occurrences.set(text, occurrence + 1)

      const start = findTextOccurrence(content, text, occurrence)
      if (start !== -1) {
        ranges.push({ start, end: start + text.length, item, type, occurrence })
      }
    }
  }

  return ranges
}

export function getHighlightItem(
  highlightData: HighlightData,
  type: HighlightType,
  text: string,
  occurrence: number,
): HighlightItem | undefined {
  const index = getHighlightItemIndex(highlightData, type, text, occurrence)
  return index === -1 ? undefined : highlightData.answer[type][index]
}

export function getHighlightItemIndex(
  highlightData: HighlightData,
  type: HighlightType,
  text: string,
  occurrence: number,
): number {
  let currentOccurrence = 0
  return highlightData.answer[type].findIndex((item) => {
    if (item['Student answer'] !== text) return false
    if (currentOccurrence === occurrence) return true
    currentOccurrence += 1
    return false
  })
}
