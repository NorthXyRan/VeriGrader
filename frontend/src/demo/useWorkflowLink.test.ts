import type { HighlightSelection } from '@/types/exam'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { useWorkflowLink } from './useWorkflowLink'

describe('workflow response-to-reference link', () => {
  let frames: Map<number, FrameRequestCallback>
  let disconnect: ReturnType<typeof vi.fn>
  let resized: ResizeObserverCallback
  let unmount: (() => void) | undefined

  beforeEach(() => {
    frames = new Map()
    let nextFrame = 0
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(++nextFrame, callback)
      return nextFrame
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
    disconnect = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resized = callback
        }
        observe() {}
        disconnect = disconnect
      },
    )
  })

  afterEach(() => {
    unmount?.()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
  })

  function flushFrame() {
    const queued = [...frames.values()]
    frames.clear()
    for (const callback of queued) callback(0)
  }

  function mountLink() {
    const host = document.createElement('div')
    document.body.append(host)
    const workspace = ref<HTMLElement | null>(null)
    const step = ref(2)
    const selection = ref<HighlightSelection | null>({
      text: 'response piece',
      type: 'correct',
      reason: '',
      matchedReferenceAnswer: 'scoring point',
      occurrence: 0,
    })
    let result!: ReturnType<typeof useWorkflowLink>
    const app = createApp({
      setup() {
        result = useWorkflowLink(workspace, step, selection)
        return () =>
          h('main', [
            h('div', { ref: workspace }, [
              h('div', { class: 'preview-content' }, [h('span', { 'data-workflow-selected': '' })]),
              h('div', { class: 'reference-content' }, [
                h('span', { class: 'reference-highlight' }),
              ]),
            ]),
          ])
      },
    })
    app.mount(host)
    unmount = () => {
      app.unmount()
      unmount = undefined
    }
    const preview = host.querySelector('.preview-content')!
    const reference = host.querySelector('.reference-content')!
    const from = preview.firstElementChild!
    const to = reference.firstElementChild!
    const rect = (x: number, y: number, width: number, height: number) =>
      new DOMRect(x, y, width, height)
    vi.spyOn(host.firstElementChild!, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 600, 400))
    vi.spyOn(preview, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 200, 400))
    vi.spyOn(reference, 'getBoundingClientRect').mockReturnValue(rect(300, 0, 200, 400))
    vi.spyOn(from, 'getClientRects').mockReturnValue([
      rect(10, 20, 100, 20),
    ] as unknown as DOMRectList)
    const targetRects = vi
      .spyOn(to, 'getClientRects')
      .mockReturnValue([rect(310, 80, 100, 20)] as unknown as DOMRectList)
    return { ...result, step, selection, preview, targetRects }
  }

  it('draws once while idle and coalesces scroll/resize updates without replaying the animation', () => {
    const { link, linkKey, preview, targetRects } = mountLink()
    flushFrame()
    expect(link.value).toMatchObject({ x2: 306, y2: 90, type: 'segment' })
    expect(frames.size).toBe(0)
    const key = linkKey.value
    targetRects.mockReturnValue([new DOMRect(310, 120, 100, 20)] as unknown as DOMRectList)
    preview.dispatchEvent(new Event('scroll'))
    preview.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('resize'))
    resized([], {} as ResizeObserver)
    expect(frames.size).toBe(1)
    flushFrame()
    expect(link.value?.y2).toBe(130)
    expect(linkKey.value).toBe(key)
    expect(frames.size).toBe(0)
  })

  it('updates the animation key for a new verdict and removes the link when selection clears', async () => {
    const { link, linkKey, step, selection } = mountLink()
    flushFrame()
    step.value = 3
    await nextTick()
    flushFrame()
    expect(linkKey.value).toBe('response piece|correct')
    expect(link.value?.type).toBe('correct')
    selection.value = null
    await nextTick()
    flushFrame()
    expect(link.value).toBeNull()
    expect(frames.size).toBe(0)
  })

  it('cancels queued rendering and removes layout listeners on unmount', () => {
    const { preview } = mountLink()
    expect(frames.size).toBe(1)
    unmount!()
    expect(frames.size).toBe(0)
    expect(disconnect).toHaveBeenCalledOnce()
    preview.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('resize'))
    resized([], {} as ResizeObserver)
    expect(frames.size).toBe(0)
  })
})
