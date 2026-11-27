import { describe, expect, it } from 'vitest'

import { getScoreBand } from './scoreBands'

describe('getScoreBand', () => {
  it.each([
    [1, '90-100%'],
    [0.9, '90-100%'],
    [0.899, '80-89%'],
    [0.8, '80-89%'],
    [0.799, '70-79%'],
    [0.7, '70-79%'],
    [0.699, '60-69%'],
    [0.6, '60-69%'],
    [0.599, '0-59%'],
    [0, '0-59%'],
  ] as const)('maps %s to %s without gaps', (rate, band) => {
    expect(getScoreBand(rate).range).toBe(band)
  })

  it('clamps invalid and out-of-range rates', () => {
    expect(getScoreBand(Number.NaN).range).toBe('0-59%')
    expect(getScoreBand(-1).range).toBe('0-59%')
    expect(getScoreBand(2).range).toBe('90-100%')
  })
})
