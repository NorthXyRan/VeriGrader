export const API_CONFIG = {
  LLM: {
    API_KEY: String(import.meta.env.VITE_API_KEY || '').trim(),
    API_URL: String(import.meta.env.VITE_API_URL || '').trim(),

    UPLOAD: {
      MODEL: 'gpt-4o-all',
      MAX_TOKENS: 16384,
      TEMPERATURE: 0.1,
    },

    GRADING: {
      MODEL: 'o3',
      MAX_TOKENS: 16384,
      TEMPERATURE: 0.3,
    },

    REASON_GENERATION: {
      MODEL: 'o3',
      MAX_TOKENS: 5096,
      TEMPERATURE: 0.3,
    },
  },
}

export function isAPIConfigValid(): boolean {
  const { API_KEY: key, API_URL: url } = API_CONFIG.LLM
  if (!key || key.toLowerCase().startsWith('your-api-key') || !url) return false

  try {
    return ['http:', 'https:'].includes(new URL(url).protocol)
  } catch {
    return false
  }
}
