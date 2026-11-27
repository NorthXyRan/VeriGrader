import { describe, expect, it } from 'vitest'

import { getSelectionStats, selectStudents, validateSelection } from './selectionUtils'

describe('selectStudents', () => {
  it('is deterministic with a seed and leaves the input unchanged', () => {
    const students = [1, 2, 3, 4, 5]
    const before = [...students]

    expect(selectStudents(students, 3, { seed: 42 })).toEqual(
      selectStudents(students, 3, { seed: 42 }),
    )
    expect(students).toEqual(before)
  })

  it('clamps invalid counts and removes duplicate IDs', () => {
    expect(selectStudents([1, 2, 3], -1)).toEqual([])
    const selected = selectStudents([1, 1, 2, 2], 10, { seed: 1 })
    expect(new Set(selected).size).toBe(selected.length)
    expect(selected).toHaveLength(2)
  })

  it('validates using a clamped expected count', () => {
    expect(validateSelection([1, 2], [], -2)).toEqual({ valid: true, errors: [] })
  })

  it('reports duplicate and unknown selections', () => {
    const result = validateSelection([1, 2], [1, 1, 3], 2)
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(3)
  })

  it('returns selection statistics for populated and empty inputs', () => {
    expect(getSelectionStats([1, 2, 3], [2])).toEqual({
      totalCount: 3,
      selectedCount: 1,
      selectionRate: 1 / 3,
      selectedIds: [2],
      unselectedIds: [1, 3],
    })
    expect(getSelectionStats([], []).selectionRate).toBe(0)
    expect(selectStudents([1], Number.POSITIVE_INFINITY)).toEqual([])
  })
})
