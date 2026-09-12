import { describe, expect, it, vi } from 'vitest'

import { abortableDelay, mapWithConcurrency, withTimeout } from './asyncUtils'

describe('abortableDelay', () => {
  it('stops immediately when aborted', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    const delay = abortableDelay(1_000, controller.signal)
    const assertion = expect(delay).rejects.toThrow(/aborted/i)

    controller.abort()
    await assertion
    expect(vi.getTimerCount()).toBe(0)
    vi.useRealTimers()
  })
})

describe('mapWithConcurrency', () => {
  it('preserves order and respects the concurrency limit', async () => {
    let active = 0
    let peak = 0
    const result = await mapWithConcurrency([1, 2, 3, 4], 2, async (value) => {
      active += 1
      peak = Math.max(peak, active)
      await Promise.resolve()
      active -= 1
      return value * 2
    })

    expect(result).toEqual([2, 4, 6, 8])
    expect(peak).toBe(2)
  })

  it('rejects invalid concurrency', async () => {
    await expect(mapWithConcurrency([1], 0, async (value) => value)).rejects.toThrow(/concurrency/i)
  })
})

describe('withTimeout', () => {
  it('returns completed work and clears its timer', async () => {
    vi.useFakeTimers()
    await expect(withTimeout(async () => 'done', 100)).resolves.toBe('done')
    expect(vi.getTimerCount()).toBe(0)
    vi.useRealTimers()
  })

  it('aborts timed-out work', async () => {
    vi.useFakeTimers()
    let signal: AbortSignal | undefined
    const result = withTimeout(async (requestSignal) => {
      signal = requestSignal
      return new Promise<string>(() => undefined)
    }, 100)
    const assertion = expect(result).rejects.toThrow(/timed out/i)

    await vi.advanceTimersByTimeAsync(100)
    await assertion
    expect(signal?.aborted).toBe(true)
    vi.useRealTimers()
  })
})
