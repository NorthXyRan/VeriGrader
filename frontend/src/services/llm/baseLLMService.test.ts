import { beforeEach, describe, expect, it, vi } from 'vitest'

const { isAPIConfigValid } = vi.hoisted(() => ({
  isAPIConfigValid: vi.fn(() => true),
}))

vi.mock('../../config/api', () => ({
  API_CONFIG: {
    LLM: {
      API_KEY: 'test-key',
      API_URL: 'https://example.test/v1/chat/completions',
      UPLOAD: { MODEL: 'upload-model', MAX_TOKENS: 100, TEMPERATURE: 0.1 },
      GRADING: { MODEL: 'grading-model', MAX_TOKENS: 200, TEMPERATURE: 0.2 },
      REASON_GENERATION: { MODEL: 'reason-model', MAX_TOKENS: 300, TEMPERATURE: 0.3 },
    },
  },
  isAPIConfigValid,
}))

import {
  callLLMAPI,
  checkLLMServiceStatus,
  getGradingConfig,
  getReasonGenerationConfig,
  getUploadConfig,
} from './baseLLMService'

describe('baseLLMService', () => {
  beforeEach(() => {
    isAPIConfigValid.mockReturnValue(true)
    vi.unstubAllGlobals()
  })

  it('sends a compatible JSON request and returns trimmed content', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '  {"ok":true}  ' } }] }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()

    await expect(
      callLLMAPI('grade this', getGradingConfig(), { signal: controller.signal }),
    ).resolves.toEqual({ success: true, content: '{"ok":true}' })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.test/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-key',
        },
        signal: controller.signal,
      }),
    )
    const request = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(request).toMatchObject({
      model: 'grading-model',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: 'grade this' }],
    })
  })

  it('omits JSON response formatting for text requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'answer' } }] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await callLLMAPI('prompt', {
      model: 'model',
      maxTokens: 10,
      temperature: 0,
      responseFormat: 'text',
    })

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty('response_format')
  })

  it('returns safe errors for failed or malformed responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }))
    await expect(callLLMAPI('prompt', getUploadConfig())).resolves.toEqual({
      success: false,
      error: 'LLM request failed with status 429',
    })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }))
    await expect(callLLMAPI('prompt', getUploadConfig())).resolves.toEqual({
      success: false,
      error: 'API response format error: missing required fields',
    })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: ' ' } }] }),
      }),
    )
    await expect(callLLMAPI('prompt', getUploadConfig())).resolves.toEqual({
      success: false,
      error: 'LLM returned empty content',
    })
  })

  it('does not send a request with invalid configuration', async () => {
    isAPIConfigValid.mockReturnValue(false)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(callLLMAPI('prompt', getUploadConfig())).resolves.toEqual({
      success: false,
      error: 'Invalid API configuration. Check VITE_API_KEY and VITE_API_URL.',
    })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(checkLLMServiceStatus()).toEqual({
      available: false,
      message: 'Invalid API configuration. Set VITE_API_KEY and VITE_API_URL in frontend/.env.',
    })
  })

  it('provides the configured request profiles', () => {
    expect(getUploadConfig()).toMatchObject({ model: 'upload-model', responseFormat: 'json' })
    expect(getGradingConfig()).toMatchObject({ model: 'grading-model', responseFormat: 'json' })
    expect(getReasonGenerationConfig()).toMatchObject({
      model: 'reason-model',
      responseFormat: 'json',
    })
    expect(checkLLMServiceStatus()).toEqual({
      available: true,
      message: 'LLM service available',
    })
  })
})
