export function initUsage() {
  // Usage Scenario: a poster with one big play button, then native controls once started.
  const startPlayer = (player) => {
    const video = player.querySelector('video')
    const playButton = player.querySelector('.usage__play')
    if (!video || player.classList.contains('is-started')) return
    const moveFocus = document.activeElement === playButton
    player.classList.add('is-started')
    video.controls = true
    if (playButton) playButton.hidden = true
    if (moveFocus) video.focus({ preventScroll: true })
    // Keep native controls available if the media cannot start immediately.
    video.play().catch(() => {})
  }
  document.querySelectorAll('.usage__player').forEach((player) => {
    const video = player.querySelector('video')
    const playButton = player.querySelector('.usage__play')
    if (!video?.canPlayType('video/mp4') || !playButton) return

    video.controls = false
    playButton.hidden = false
    playButton.addEventListener('click', () => startPlayer(player), { once: true })
    video.addEventListener('play', () => startPlayer(player))
  })

  // The chapter cards become tabs that swap the featured clip.
  const usage = document.querySelector('.usage')
  const tablist = usage?.querySelector('.usage__chapters')
  const tabs = tablist ? [...tablist.querySelectorAll('[role="tab"]')] : []
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')))
  if (tabs.length && panels.every(Boolean)) {
    const select = (index, { focus = false } = {}) => {
      tabs.forEach((tab, i) => {
        const selected = i === index
        tab.setAttribute('aria-selected', String(selected))
        tab.tabIndex = selected ? 0 : -1
        panels[i].hidden = !selected
        if (!selected) panels[i].querySelector('video')?.pause()
      })
      if (focus) tabs[index].focus()
    }
    // Crossfade the featured clip where view transitions exist; otherwise CSS fades it in.
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')
    const canTransition = typeof document.startViewTransition === 'function'
    if (canTransition) usage.classList.add('usage--vt')
    const switchTo = (index, options) => {
      if (tabs[index].getAttribute('aria-selected') === 'true') return select(index, options)
      if (!canTransition || reduceMotion.matches) return select(index, options)
      document.startViewTransition(() => select(index, options))
    }
    // Warm the hidden clips' posters so the incoming frame is ready to fade in (phones only show one clip).
    if (!window.matchMedia('(max-width: 640px)').matches) {
      panels.forEach((panel) => {
        const poster = panel.querySelector('video')?.poster
        if (poster) new Image().src = poster
      })
    }

    panels.forEach((panel, i) => {
      panel.setAttribute('role', 'tabpanel')
      panel.setAttribute('aria-labelledby', tabs[i].id)
      const video = panel.querySelector('video')
      if (!video) return
      const setProgress = () =>
        video.duration && tabs[i].style.setProperty('--progress', String(video.currentTime / video.duration))
      video.addEventListener('timeupdate', setProgress)
      video.addEventListener('ended', setProgress)
    })
    tabs.forEach((tab, i) => tab.addEventListener('click', () => switchTo(i)))
    tablist.addEventListener('keydown', (event) => {
      const current = tabs.indexOf(document.activeElement)
      if (current < 0) return
      const last = tabs.length - 1
      const next = {
        ArrowRight: current === last ? 0 : current + 1,
        ArrowDown: current === last ? 0 : current + 1,
        ArrowLeft: current === 0 ? last : current - 1,
        ArrowUp: current === 0 ? last : current - 1,
        Home: 0,
        End: last,
      }[event.key]
      if (next === undefined) return
      event.preventDefault()
      switchTo(next, { focus: true })
    })

    usage.classList.add('usage--tabs')
    tablist.hidden = false
    select(Math.max(0, tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true')))
  }

}
