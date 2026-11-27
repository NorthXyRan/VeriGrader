import { HIGHLIGHT_TYPES, type HighlightData, type HighlightItem } from '@/types/exam'

import { findTextOccurrence, locateHighlightRanges } from './highlightRanges'

export function getHighlightStatistics(
  studentContent: string,
  highlightData: HighlightData,
): {
  expectedHighlightCount: number
  actualHighlightCount: number
  highlightMissingRate: number
} {
  const expectedHighlightCount = HIGHLIGHT_TYPES.reduce(
    (total, type) => total + (highlightData.answer[type]?.length ?? 0),
    0,
  )
  const actualHighlightCount = locateHighlightRanges(studentContent, highlightData).length

  return {
    expectedHighlightCount,
    actualHighlightCount,
    highlightMissingRate:
      expectedHighlightCount === 0
        ? 0
        : (expectedHighlightCount - actualHighlightCount) / expectedHighlightCount,
  }
}

export function calcHighlightMissingRate(
  studentContent: string,
  highlightData: HighlightData,
): number {
  return getHighlightStatistics(studentContent, highlightData).highlightMissingRate
}

export function calcHighlightOverlapRate(
  studentContent: string,
  highlightData: HighlightData,
): number {
  const ranges = locateHighlightRanges(studentContent, highlightData)
  const totalPairs = (ranges.length * (ranges.length - 1)) / 2
  if (totalPairs === 0) return 0

  let overlaps = 0
  for (let left = 0; left < ranges.length; left += 1) {
    for (let right = left + 1; right < ranges.length; right += 1) {
      if (ranges[left].start < ranges[right].end && ranges[right].start < ranges[left].end) {
        overlaps += 1
      }
    }
  }

  return overlaps / totalPairs
}

function filterLocatedItems(studentContent: string, items: HighlightItem[]): HighlightItem[] {
  const occurrences = new Map<string, number>()
  return items.filter((item) => {
    const text = item['Student answer']
    const occurrence = occurrences.get(text) ?? 0
    occurrences.set(text, occurrence + 1)
    return findTextOccurrence(studentContent, text, occurrence) !== -1
  })
}

const normalizeText = (text: string) => text.replace(/[\s\p{P}]/gu, '').toLowerCase()

function removeInvisibleReferenceMatches(
  items: HighlightItem[],
  normalizedReference: string | null,
): HighlightItem[] {
  if (normalizedReference === null) return items

  return items.map((item) => {
    const matchedText = normalizeText(item['matched reference answer'] || '')
    if (matchedText && normalizedReference.includes(matchedText)) return item
    return { ...item, 'matched reference answer': '' }
  })
}

export function sanitizeHighlightData(
  studentContent: string,
  highlightData: HighlightData,
  options?: { referenceContent?: string },
): HighlightData {
  const normalizedReference =
    options?.referenceContent === undefined ? null : normalizeText(options.referenceContent)

  return {
    ...highlightData,
    answer: {
      correct: removeInvisibleReferenceMatches(
        filterLocatedItems(studentContent, highlightData.answer.correct ?? []),
        normalizedReference,
      ),
      wrong: removeInvisibleReferenceMatches(
        filterLocatedItems(studentContent, highlightData.answer.wrong ?? []),
        normalizedReference,
      ),
      unclear: removeInvisibleReferenceMatches(
        filterLocatedItems(studentContent, highlightData.answer.unclear ?? []),
        normalizedReference,
      ),
    },
  }
}

function overlapsText(left: string, right: string): boolean {
  if (!left || !right) return false
  if (left === right) return true
  return left.length >= 2 && right.length >= 2 && (left.includes(right) || right.includes(left))
}

export function computeScoreFromReferences(
  highlightData: HighlightData,
  options?: { eachPoint?: number; maxScore?: number },
): number {
  const uniqueReferences: string[] = []

  for (const item of highlightData.answer.correct ?? []) {
    const reference = normalizeText(item['matched reference answer'] || '')
    if (reference && !uniqueReferences.some((existing) => overlapsText(existing, reference))) {
      uniqueReferences.push(reference)
    }
  }

  const score = uniqueReferences.length * (options?.eachPoint ?? 1)
  return options?.maxScore === undefined
    ? Math.max(0, score)
    : Math.max(0, Math.min(score, options.maxScore))
}
