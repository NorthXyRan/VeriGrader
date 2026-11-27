import { describe, expect, it } from 'vitest'

import type { HighlightData } from '@/stores/useExamDataStore'

import {
  escapeHtml,
  generateHighlightedHTML,
  generateReferenceHighlightedHTML,
  parseHighlightElement,
} from './highlightUtils'
import { getHighlightItemIndex } from './highlightRanges'

function makeData(text = 'answer', reason = 'reason'): HighlightData {
  return {
    student_id: 1,
    question_id: 2,
    answer: {
      correct: [
        {
          'Student answer': text,
          'matched reference answer': 'reference',
          reason,
        },
      ],
      wrong: [],
      unclear: [],
    },
    total_score: 1,
  }
}

describe('highlight HTML', () => {
  it('finds repeated annotations by occurrence without mutation', () => {
    const data = makeData('same')
    data.answer.correct.push({ ...data.answer.correct[0] })

    expect(getHighlightItemIndex(data, 'correct', 'same', 1)).toBe(1)
    expect(getHighlightItemIndex(data, 'correct', 'same', 2)).toBe(-1)
    expect(data.answer.correct.every((item) => !('__occurrenceIndex' in item))).toBe(true)
  })

  it('escapes text for HTML content and attributes', () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;',
    )
  })

  it('does not allow highlight text or reasons to create attributes', () => {
    const injection = 'answer" autofocus onfocus="alert(1)'
    const root = document.createElement('div')
    root.innerHTML = generateHighlightedHTML(injection, makeData(injection, injection))

    const highlight = root.querySelector<HTMLElement>('.text-highlight')
    expect(highlight).not.toBeNull()
    expect(highlight?.getAttribute('data-text')).toBe(injection)
    expect(highlight?.getAttribute('data-reason')).toBe(injection)
    expect(highlight?.hasAttribute('autofocus')).toBe(false)
    expect(highlight?.hasAttribute('onfocus')).toBe(false)
    expect(highlight?.hasAttribute('onmouseover')).toBe(false)
    expect(highlight?.hasAttribute('onmouseout')).toBe(false)
  })

  it('does not mutate highlight data while assigning occurrences', () => {
    const data = makeData('same')
    data.answer.correct.push({ ...data.answer.correct[0] })
    const before = structuredClone(data)

    generateHighlightedHTML('same same', data)

    expect(data).toEqual(before)
  })

  it('round-trips literal entities and rejects invalid types', () => {
    const text = 'literal &quot; text'
    const data = makeData(text)
    const root = document.createElement('div')
    root.innerHTML = generateHighlightedHTML(text, data)
    const element = root.querySelector<HTMLElement>('.text-highlight')
    if (!element) throw new Error('Expected a rendered highlight')

    expect(parseHighlightElement(element, data)?.text).toBe(text)
    element.dataset.type = 'unsafe'
    expect(parseHighlightElement(element, data)).toBeNull()
  })

  it('escapes reference highlight attributes', () => {
    const injection = 'answer" autofocus onfocus="alert(1)'
    const data = makeData(injection)
    const root = document.createElement('div')
    root.innerHTML = generateReferenceHighlightedHTML('reference', data, {
      text: injection,
      type: 'correct',
      reason: '',
    })

    const highlight = root.querySelector<HTMLElement>('.text-highlight')
    expect(highlight?.hasAttribute('autofocus')).toBe(false)
    expect(highlight?.hasAttribute('onfocus')).toBe(false)
  })

  it('returns escaped source when no highlight is available', () => {
    expect(generateHighlightedHTML('<b>', null)).toBe('&lt;b&gt;')
    expect(generateReferenceHighlightedHTML('<b>', null, null)).toBe('&lt;b&gt;')
  })

  it('ignores missing reference matches and invalid occurrences', () => {
    const data = makeData()
    expect(
      generateReferenceHighlightedHTML('other', data, {
        text: 'answer',
        type: 'correct',
        reason: '',
      }),
    ).toBe('other')

    const element = document.createElement('span')
    element.className = 'text-highlight'
    element.dataset.type = 'correct'
    element.dataset.occurrence = '-1'
    expect(parseHighlightElement(element, data)).toBeNull()
  })
})
