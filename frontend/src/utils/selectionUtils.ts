export interface SelectionOptions {
  seed?: number
}

function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
}

function clampCount(count: number, available: number): number {
  if (!Number.isFinite(count)) return 0
  return Math.min(Math.max(Math.trunc(count), 0), available)
}

export function selectStudents(
  studentIds: number[],
  count: number,
  options: SelectionOptions = {},
): number[] {
  const students = [...new Set(studentIds)]
  const random = options.seed === undefined ? Math.random : seededRandom(options.seed)

  for (let index = students.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[students[index], students[target]] = [students[target], students[index]]
  }

  return students.slice(0, clampCount(count, students.length))
}

export function validateSelection(
  originalIds: number[],
  selectedIds: number[],
  expectedCount: number,
): { valid: boolean; errors: string[] } {
  const availableIds = [...new Set(originalIds)]
  const expected = clampCount(expectedCount, availableIds.length)
  const errors: string[] = []

  if (selectedIds.length !== expected) {
    errors.push(`Expected ${expected} students, got ${selectedIds.length}`)
  }
  if (new Set(selectedIds).size !== selectedIds.length) {
    errors.push('Selected students contain duplicates')
  }
  for (const id of selectedIds) {
    if (!availableIds.includes(id)) errors.push(`Selected student ID ${id} not in original list`)
  }

  return { valid: errors.length === 0, errors }
}

export function getSelectionStats(
  originalIds: number[],
  selectedIds: number[],
): {
  totalCount: number
  selectedCount: number
  selectionRate: number
  selectedIds: number[]
  unselectedIds: number[]
} {
  const selected = new Set(selectedIds)
  return {
    totalCount: originalIds.length,
    selectedCount: selectedIds.length,
    selectionRate: originalIds.length === 0 ? 0 : selectedIds.length / originalIds.length,
    selectedIds: [...selectedIds],
    unselectedIds: originalIds.filter((id) => !selected.has(id)),
  }
}
