function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseJsonObject(content: string): Record<string, unknown> {
  const trimmed = content.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  const candidate = fenced?.[1] ?? trimmed

  try {
    const parsed: unknown = JSON.parse(candidate)
    if (!isJsonObject(parsed)) throw new Error()
    return parsed
  } catch {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start === -1 || end <= start) throw new Error('LLM response is not a JSON object')

    try {
      const parsed: unknown = JSON.parse(candidate.slice(start, end + 1))
      if (!isJsonObject(parsed)) throw new Error()
      return parsed
    } catch {
      throw new Error('LLM response is not a valid JSON object')
    }
  }
}
