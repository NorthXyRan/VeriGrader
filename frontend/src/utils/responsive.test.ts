import { describe, expect, it } from 'vitest'

import { getContentLayout } from './responsive'

describe('getContentLayout', () => {
  it.each([
    [1600, 'wide'],
    [1201, 'wide'],
    [1200, 'compact'],
    [761, 'compact'],
    [760, 'narrow'],
    [320, 'narrow'],
  ] as const)('maps a %dpx content area to %s layout', (width, expected) => {
    expect(getContentLayout(width)).toBe(expected)
  })
})
