import type { DemoCase } from '../caseTypes'

const modules = import.meta.glob<DemoCase>('./q*.ts', { eager: true, import: 'default' })

export const demoCases: DemoCase[] = Object.values(modules).sort(
  (left, right) => left.question.question_id - right.question.question_id,
)
