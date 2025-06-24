/**
 * 学生选择算法工具集
 * 用于批量批改时的随机学生选择
 */

// ============== 类型定义 ==============

export interface SelectionOptions {
  seed?: number  // 随机种子，用于可重现的随机选择
}

// ============== 随机选择算法 ==============

/**
 * 随机选择学生
 * @param studentIds 所有学生ID数组
 * @param count 需要选择的数量
 * @param options 选择选项
 * @returns 选中的学生ID数组
 */
export function selectStudents(
  studentIds: number[], 
  count: number, 
  options: SelectionOptions = {}
): number[] {
  const { seed } = options
  
  // 如果有种子，使用伪随机数生成器
  let random = Math.random
  if (seed !== undefined) {
    random = seededRandom(seed)
  }
  
  const shuffled = [...studentIds].sort(() => 0.5 - random())
  return shuffled.slice(0, Math.min(count, studentIds.length))
}

// ============== 辅助函数 ==============

/**
 * 基于种子的伪随机数生成器
 * @param seed 随机种子
 * @returns 伪随机数生成函数
 */
function seededRandom(seed: number): () => number {
  let currentSeed = seed
  return function() {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    return currentSeed / 233280
  }
}

// ============== 工具函数 ==============

/**
 * 验证选择结果
 * @param originalIds 原始学生ID数组
 * @param selectedIds 选中的学生ID数组
 * @param expectedCount 期望的选择数量
 * @returns 验证结果
 */
export function validateSelection(
  originalIds: number[], 
  selectedIds: number[], 
  expectedCount: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // 检查数量
  if (selectedIds.length !== Math.min(expectedCount, originalIds.length)) {
    errors.push(`Expected ${Math.min(expectedCount, originalIds.length)} students, got ${selectedIds.length}`)
  }
  
  // 检查重复
  const uniqueIds = new Set(selectedIds)
  if (uniqueIds.size !== selectedIds.length) {
    errors.push('Selected students contain duplicates')
  }
  
  // 检查有效性
  for (const id of selectedIds) {
    if (!originalIds.includes(id)) {
      errors.push(`Selected student ID ${id} not in original list`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 获取选择统计信息
 * @param originalIds 原始学生ID数组
 * @param selectedIds 选中的学生ID数组
 * @returns 统计信息
 */
export function getSelectionStats(
  originalIds: number[], 
  selectedIds: number[]
): {
  totalCount: number
  selectedCount: number
  selectionRate: number
  selectedIds: number[]
  unselectedIds: number[]
} {
  const unselectedIds = originalIds.filter(id => !selectedIds.includes(id))
  
  return {
    totalCount: originalIds.length,
    selectedCount: selectedIds.length,
    selectionRate: originalIds.length > 0 ? selectedIds.length / originalIds.length : 0,
    selectedIds: [...selectedIds],
    unselectedIds
  }
}