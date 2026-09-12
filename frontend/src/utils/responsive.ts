const DESIGN_WIDTH = 2560
const MIN_WIDTH = 1366
const DEFAULT_FONT_SIZE = 16
const USER_FONT_BOOST = 1.1
const MIN_FONT_SIZE = 12
const MAX_FONT_SIZE = 18

export type ContentLayout = 'wide' | 'compact' | 'narrow'

export function getContentLayout(width: number): ContentLayout {
  if (width <= 760) return 'narrow'
  if (width <= 1200) return 'compact'
  return 'wide'
}

function updateRootFontSize(): void {
  const scale = Math.max(window.innerWidth / DESIGN_WIDTH, MIN_WIDTH / DESIGN_WIDTH)
  const fontSize = Math.min(
    Math.max(DEFAULT_FONT_SIZE * scale * USER_FONT_BOOST, MIN_FONT_SIZE),
    MAX_FONT_SIZE,
  )
  document.documentElement.style.fontSize = `${fontSize}px`
}

export function initResponsive(): () => void {
  let resizeTimer: ReturnType<typeof setTimeout> | undefined
  const handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(updateRootFontSize, 300)
  }

  updateRootFontSize()
  window.addEventListener('resize', handleResize)
  return () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    window.removeEventListener('resize', handleResize)
  }
}
