// Both embedded apps retain a desktop layout while fitting their visible container.
export function fitEmbeddedFrame(viewport, { width, height, prefix, expand = false, resizeHeight = false }) {
  const fit = () => {
    const available = viewport.clientWidth
    if (!available) return
    const layoutWidth = expand ? Math.max(available, width) : width
    const scale = available / layoutWidth
    viewport.style.setProperty(`--${prefix}-w`, `${layoutWidth}px`)
    viewport.style.setProperty(`--${prefix}-h`, `${height}px`)
    viewport.style.setProperty(`--${prefix}-scale`, String(scale))
    if (resizeHeight) viewport.style.height = `${Math.round(height * scale)}px`
  }
  fit()
  const observer = new ResizeObserver(fit)
  observer.observe(viewport)
  return observer
}

// Keep hidden phone embeds unloaded; a wider layout can load them later.
export function loadFrameWhenShown(frame, compact) {
  const load = () => {
    if (!compact.matches && !frame.hasAttribute('src')) frame.src = frame.dataset.src
  }
  load()
  compact.addEventListener('change', load)
}
