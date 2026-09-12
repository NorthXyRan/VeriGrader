export function abortableDelay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new DOMException('Request aborted', 'AbortError'))

  return new Promise((resolve, reject) => {
    const handleAbort = () => {
      clearTimeout(timeout)
      reject(new DOMException('Request aborted', 'AbortError'))
    }
    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort)
      resolve()
    }, milliseconds)
    signal?.addEventListener('abort', handleAbort, { once: true })
  })
}

export async function mapWithConcurrency<Input, Output>(
  items: readonly Input[],
  concurrency: number,
  worker: (item: Input, index: number) => Promise<Output>,
): Promise<Output[]> {
  if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
    throw new Error('Concurrency must be a positive integer')
  }

  const results = Array.from<Output>({ length: items.length })
  let nextIndex = 0

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await worker(items[index], index)
    }
  }

  const workerCount = Math.min(concurrency, items.length)
  await Promise.all(Array.from({ length: workerCount }, runWorker))
  return results
}

export async function withTimeout<Result>(
  operation: (signal: AbortSignal) => Promise<Result>,
  milliseconds: number,
): Promise<Result> {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    throw new Error('Timeout must be a positive number')
  }

  const controller = new AbortController()
  let timeout: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort()
      reject(new Error(`Operation timed out after ${milliseconds} ms`))
    }, milliseconds)
  })

  try {
    return await Promise.race([operation(controller.signal), timeoutPromise])
  } finally {
    if (timeout !== undefined) clearTimeout(timeout)
  }
}
