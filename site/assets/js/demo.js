import { fitEmbeddedFrame, loadFrameWhenShown } from './embedded-frame.js'

export function initDemo() {
  const frame = document.querySelector('.demo-frame[data-src]')
  const viewport = frame?.closest('.demo-viewport')
  if (!viewport) return

  // Keep in sync with the screenshot layout in demo.css.
  const compact = matchMedia('(max-width: 900px), (max-height: 500px) and (pointer: coarse)')
  fitEmbeddedFrame(viewport, { width: 1920, height: 1080, prefix: 'demo' })
  loadFrameWhenShown(frame, compact)
}
