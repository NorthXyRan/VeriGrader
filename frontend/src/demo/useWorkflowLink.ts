import type { HighlightSelection } from '@/types/exam'
import { onMounted, onUnmounted, shallowRef, watch, type Ref } from 'vue'

interface WorkflowLink {
  d: string
  x2: number
  y2: number
  type: string
}

function visibleRect(element: Element | null, scroll: Element | null, last = false) {
  if (!element || !scroll) return null
  const rects = [...element.getClientRects()]
  const rect = last ? rects[rects.length - 1] : rects[0]
  const view = scroll.getBoundingClientRect()
  if (!rect || rect.bottom < view.top + 4 || rect.top > view.bottom - 4) return null
  return rect
}

/** Connect the selected response piece to its scoring point when their layout changes. */
export function useWorkflowLink(
  workspace: Readonly<Ref<HTMLElement | null>>,
  step: Readonly<Ref<number>>,
  selection: Readonly<Ref<HighlightSelection | null>>,
) {
  const link = shallowRef<WorkflowLink | null>(null)
  const linkKey = shallowRef('')
  let root: HTMLElement | null = null
  let resize: ResizeObserver | undefined
  let frame = 0

  function drawLink() {
    frame = 0
    const highlight = selection.value
    if (!root || step.value < 2 || !highlight) {
      link.value = null
      return
    }
    const preview = root.querySelector('.preview-content')
    const reference = root.querySelector('.reference-content')
    const from = visibleRect(root.querySelector('[data-workflow-selected]'), preview, true)
    const to = visibleRect(reference?.querySelector('.reference-highlight') ?? null, reference)
    if (!from || !to) {
      link.value = null
      return
    }
    const box = root.getBoundingClientRect()
    // Leave from the response panel's edge so the curve never crosses the text.
    const x1 =
      Math.min(from.right, (preview?.getBoundingClientRect().right ?? from.right) - 10) - box.left
    const y1 = from.top + from.height / 2 - box.top
    const x2 = to.left - box.left - 4
    const y2 = to.top + Math.min(to.height / 2, 11) - box.top
    if (x2 - x1 < 8) {
      link.value = null
      return
    }
    const bend = (x2 - x1) * 0.5
    const d = `M${x1.toFixed(1)} ${y1.toFixed(1)}C${(x1 + bend).toFixed(1)} ${y1.toFixed(1)} ${(x2 - bend).toFixed(1)} ${y2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
    const type = step.value >= 3 ? highlight.type : 'segment'
    linkKey.value = `${highlight.text}|${type}`
    const previous = link.value
    if (previous?.d !== d || previous.x2 !== x2 || previous.y2 !== y2 || previous.type !== type) {
      link.value = { d, x2, y2, type }
    }
  }

  function scheduleDraw() {
    if (root && !frame) frame = requestAnimationFrame(drawLink)
  }

  // Run after Vue has updated the highlights; coalesce all layout changes into one frame.
  watch([step, selection], scheduleDraw, { flush: 'post' })

  onMounted(() => {
    root = workspace.value?.parentElement ?? null
    if (!root) return
    root.addEventListener('scroll', scheduleDraw, { capture: true, passive: true })
    window.addEventListener('resize', scheduleDraw)
    resize = new ResizeObserver(scheduleDraw)
    for (const element of [
      root,
      workspace.value!,
      ...root.querySelectorAll('.preview-content, .reference-content'),
    ]) {
      resize.observe(element)
    }
    scheduleDraw()
  })

  onUnmounted(() => {
    root?.removeEventListener('scroll', scheduleDraw, true)
    window.removeEventListener('resize', scheduleDraw)
    resize?.disconnect()
    cancelAnimationFrame(frame)
    root = null
  })

  return { link, linkKey }
}
