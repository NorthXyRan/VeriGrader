// Component styles are authored in px against a large-desktop design and converted to rem by
// postcss-pxtorem (1rem = 16px of design). The root font size below therefore acts as a zoom
// factor for the whole interface: phones get a slightly larger scale for legible text and
// comfortable touch targets, and desktops scale up smoothly with the viewport width.

export type ContentLayout = 'wide' | 'compact' | 'narrow'

/** Viewport widths (px) at which the app shell changes shape. */
export const VIEWPORT_BREAKPOINTS = {
  /** At or below: navigation becomes a bar above the content. */
  phone: 760,
  /** Below: the sidebar starts collapsed to an icon rail. */
  desktop: 1440,
} as const

const PHONE_FONT_SIZE = 14
const TABLET_FONT_SIZE = 13
const MAX_FONT_SIZE = 17.6

/** Width-to-root-font-size stops used on desktop; linearly interpolated between stops. */
const DESKTOP_SCALE: ReadonlyArray<readonly [width: number, fontSize: number]> = [
  [1280, TABLET_FONT_SIZE],
  [1920, 15],
  [2560, MAX_FONT_SIZE],
]

export function getContentLayout(width: number): ContentLayout {
  if (width <= 760) return 'narrow'
  if (width <= 1080) return 'compact'
  return 'wide'
}

export function getRootFontSize(viewportWidth: number): number {
  if (viewportWidth <= VIEWPORT_BREAKPOINTS.phone) return PHONE_FONT_SIZE

  if (viewportWidth <= DESKTOP_SCALE[0][0]) return TABLET_FONT_SIZE

  for (let index = 1; index < DESKTOP_SCALE.length; index++) {
    const [fromWidth, fromSize] = DESKTOP_SCALE[index - 1]
    const [toWidth, toSize] = DESKTOP_SCALE[index]
    if (viewportWidth <= toWidth) {
      const progress = (viewportWidth - fromWidth) / (toWidth - fromWidth)
      return Math.round((fromSize + (toSize - fromSize) * progress) * 100) / 100
    }
  }

  return MAX_FONT_SIZE
}

function updateRootFontSize(): void {
  document.documentElement.style.fontSize = `${getRootFontSize(window.innerWidth)}px`
}

export function initResponsive(): () => void {
  let frame: number | undefined
  const handleResize = () => {
    if (frame !== undefined) cancelAnimationFrame(frame)
    frame = requestAnimationFrame(updateRootFontSize)
  }

  updateRootFontSize()
  window.addEventListener('resize', handleResize)
  return () => {
    if (frame !== undefined) cancelAnimationFrame(frame)
    window.removeEventListener('resize', handleResize)
  }
}
