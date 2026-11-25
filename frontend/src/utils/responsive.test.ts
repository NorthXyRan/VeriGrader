import { describe, expect, it } from 'vitest'

import { getContentLayout, getRootFontSize } from './responsive'

describe('getContentLayout', () => {
  it.each([
    [1600, 'wide'],
    [1081, 'wide'],
    [1080, 'compact'],
    [761, 'compact'],
    [760, 'narrow'],
    [320, 'narrow'],
  ] as const)('maps a %dpx content area to %s layout', (width, expected) => {
    expect(getContentLayout(width)).toBe(expected)
  })
})

describe('getRootFontSize', () => {
  it.each([
    [320, 14],
    [760, 14],
    [768, 13],
    [1280, 13],
    [1600, 14],
    [1920, 15],
    [2560, 17.6],
    [3840, 17.6],
  ] as const)('uses a %dpx viewport root font size of %dpx', (width, expected) => {
    expect(getRootFontSize(width)).toBe(expected)
  })

  it('grows monotonically across desktop widths', () => {
    const sizes = [1024, 1280, 1366, 1440, 1680, 1920, 2240, 2560].map(getRootFontSize)
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b))
  })
})
