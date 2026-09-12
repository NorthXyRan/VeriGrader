import { isHighlightType, type HighlightData, type HighlightType } from '@/types/exam'

import { getHighlightItem, locateHighlightRanges, type LocatedHighlight } from './highlightRanges'

export type { HighlightData, HighlightType } from '@/types/exam'

const HIGHLIGHT_LABELS: Record<HighlightType, string> = {
  correct: 'Correct',
  wrong: 'Wrong',
  unclear: 'Unclear',
}

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character])
}

function highlightTag(range: LocatedHighlight, content: string): string {
  const text = content.slice(range.start, range.end)
  const reason = range.item.reason || ''
  const title = `${HIGHLIGHT_LABELS[range.type]}: ${reason}`

  return `<span class="text-highlight highlight-${range.type}" data-type="${range.type}" data-text="${escapeHtml(text)}" data-reason="${escapeHtml(reason)}" data-occurrence="${range.occurrence}" title="${escapeHtml(title)}">${escapeHtml(text)}</span>`
}

function removeOverlaps(ranges: LocatedHighlight[]): LocatedHighlight[] {
  const sorted = [...ranges].sort((left, right) => left.start - right.start || right.end - left.end)
  const result: LocatedHighlight[] = []
  let nextStart = 0

  for (const range of sorted) {
    if (range.start >= nextStart) {
      result.push(range)
      nextStart = range.end
    }
  }

  return result
}

export function generateHighlightedHTML(
  content: string,
  highlightData: HighlightData | null,
): string {
  if (!content || !highlightData) return escapeHtml(content || '')

  const ranges = removeOverlaps(locateHighlightRanges(content, highlightData))
  let cursor = 0
  let result = ''

  for (const range of ranges) {
    result += escapeHtml(content.slice(cursor, range.start))
    result += highlightTag(range, content)
    cursor = range.end
  }

  return result + escapeHtml(content.slice(cursor))
}

function renderReferenceHighlights(content: string, matchedText: string, tag: string): string {
  let cursor = 0
  let result = ''
  let match = content.indexOf(matchedText)

  while (match !== -1) {
    result += escapeHtml(content.slice(cursor, match)) + tag
    cursor = match + matchedText.length
    match = content.indexOf(matchedText, cursor)
  }

  return result + escapeHtml(content.slice(cursor))
}

export function generateReferenceHighlightedHTML(
  referenceContent: string,
  highlightData: HighlightData | null,
  currentHighlight: {
    text: string
    type: HighlightType
    reason: string
    occurrence?: number
  } | null,
): string {
  if (!referenceContent || !highlightData || !currentHighlight) {
    return escapeHtml(referenceContent || '')
  }

  const item = getHighlightItem(
    highlightData,
    currentHighlight.type,
    currentHighlight.text,
    currentHighlight.occurrence ?? 0,
  )
  const matchedText = item?.['matched reference answer'] || ''
  if (!matchedText || !referenceContent.includes(matchedText)) return escapeHtml(referenceContent)

  const title = `${HIGHLIGHT_LABELS[currentHighlight.type]} — student answer: ${currentHighlight.text}`
  const tag = `<span class="text-highlight reference-highlight highlight-${currentHighlight.type}" title="${escapeHtml(title)}">${escapeHtml(matchedText)}</span>`
  return renderReferenceHighlights(referenceContent, matchedText, tag)
}

export function parseHighlightElement(
  element: HTMLElement,
  highlightData?: HighlightData | null,
): {
  type: HighlightType
  text: string
  reason: string
  matchedReferenceAnswer: string
  occurrenceIndex: number
} | null {
  if (!element.classList.contains('text-highlight')) return null

  const type = element.dataset.type
  if (!isHighlightType(type)) return null

  const text = element.dataset.text || ''
  const occurrenceIndex = Number.parseInt(element.dataset.occurrence || '0', 10)
  if (!Number.isSafeInteger(occurrenceIndex) || occurrenceIndex < 0) return null

  const item = highlightData
    ? getHighlightItem(highlightData, type, text, occurrenceIndex)
    : undefined

  return {
    type,
    text,
    reason: item?.reason || element.dataset.reason || '',
    matchedReferenceAnswer: item?.['matched reference answer'] || '',
    occurrenceIndex,
  }
}
