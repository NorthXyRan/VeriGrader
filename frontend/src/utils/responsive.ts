// Styles are authored in px and converted to rem by postcss-pxtorem (1rem = 16px), so text
// follows the browser's default font size and never rescales while the window is resized.
// Layout adapts through breakpoints and the measured width of the content area instead.

export type ContentLayout = 'wide' | 'compact' | 'narrow'

/** Viewport widths (px) at which the app shell changes shape. */
export const VIEWPORT_BREAKPOINTS = {
  /** At or below: navigation becomes a bar above the content. */
  phone: 760,
  /** Below: the sidebar starts collapsed to an icon rail. */
  desktop: 1440,
} as const

/** Maps the width (px) of the main content area to the layout its pages should use. */
export function getContentLayout(width: number): ContentLayout {
  if (width <= 760) return 'narrow'
  if (width <= 1080) return 'compact'
  return 'wide'
}
