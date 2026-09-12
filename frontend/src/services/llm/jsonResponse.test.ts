import { describe, expect, it } from 'vitest'

import { parseJsonObject } from './jsonResponse'

describe('parseJsonObject', () => {
  it('parses a plain JSON object', () => {
    expect(parseJsonObject('{"score": 2}')).toEqual({ score: 2 })
  })

  it('parses JSON from a fenced code block', () => {
    expect(parseJsonObject('```json\n{"ok": true}\n```')).toEqual({ ok: true })
  })

  it('extracts an object from surrounding prose', () => {
    expect(parseJsonObject('Here is the result: {"answer":"yes"} done.')).toEqual({
      answer: 'yes',
    })
  })

  it.each(['[]', 'null', '"text"'])('rejects non-object JSON: %s', (content) => {
    expect(() => parseJsonObject(content)).toThrow('LLM response is not a JSON object')
  })

  it('rejects malformed embedded JSON', () => {
    expect(() => parseJsonObject('Result: {broken}')).toThrow(
      'LLM response is not a valid JSON object',
    )
  })

  it('rejects content without a JSON object', () => {
    expect(() => parseJsonObject('No structured result')).toThrow(
      'LLM response is not a JSON object',
    )
  })
})
