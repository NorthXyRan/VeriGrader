export const SCORE_BANDS = [
  { range: '90-100%', minimum: 0.9 },
  { range: '80-89%', minimum: 0.8 },
  { range: '70-79%', minimum: 0.7 },
  { range: '60-69%', minimum: 0.6 },
  { range: '0-59%', minimum: 0 },
] as const

export function getScoreBand(rate: number): (typeof SCORE_BANDS)[number] {
  const normalized = Number.isFinite(rate) ? Math.max(0, Math.min(rate, 1)) : 0
  return SCORE_BANDS.find((band) => normalized >= band.minimum) ?? SCORE_BANDS[4]
}
