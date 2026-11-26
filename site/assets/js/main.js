// Shared page behaviour: navigation, scroll reveal, video players and copy buttons.
;(() => {
  const nav = document.querySelector('.nav')
  const onScroll = () => nav?.classList.toggle('is-scrolled', window.scrollY > 8)
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })

  // Highlight the nav link of the section in view.
  const links = new Map(
    [...document.querySelectorAll('.nav__links a[href^="#"]')].map((a) => [a.hash.slice(1), a]),
  )
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        for (const a of links.values()) a.classList.remove('is-active')
        links.get(entry.target.id)?.classList.add('is-active')
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  )
  for (const id of links.keys()) {
    const section = document.getElementById(id)
    if (section) sectionObserver.observe(section)
  }

  // Reveal elements once as they scroll into view.
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        revealObserver.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  )
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el))

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

  // Live demo: load the app only where it is shown (phones see a screenshot instead).
  const demoFrame = document.querySelector('.demo-frame[data-src]')
  const wideEnough = matchMedia('(min-width: 721px)')
  const loadDemo = () => {
    if (!demoFrame || !wideEnough.matches || demoFrame.getAttribute('src')) return
    demoFrame.src = demoFrame.dataset.src
  }
  loadDemo()
  wideEnough.addEventListener('change', loadDemo)

  // On desktop the app lays out at least 1280 wide (its three-panel view, 15:8) and is
  // scaled to the display, so the frame always shows the whole workspace without scrolling.
  const demoViewport = demoFrame?.closest('.demo-viewport')
  const desktop = matchMedia('(min-width: 1101px)')
  const fitDemo = () => {
    if (!demoViewport) return
    demoViewport.classList.toggle('is-scaled', desktop.matches)
    if (!desktop.matches) return
    const width = demoViewport.clientWidth
    const layoutWidth = Math.max(width, 1280)
    demoViewport.style.setProperty('--demo-w', `${layoutWidth}px`)
    demoViewport.style.setProperty('--demo-h', `${(layoutWidth * 8) / 15}px`)
    demoViewport.style.setProperty('--demo-scale', String(width / layoutWidth))
  }
  if (demoViewport) {
    new ResizeObserver(fitDemo).observe(demoViewport)
    desktop.addEventListener('change', fitDemo)
  }

  // Copy buttons: data-copy="<selector of the element to copy>".
  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const text = document.querySelector(button.dataset.copy)?.textContent ?? ''
      try {
        await navigator.clipboard.writeText(text)
        button.textContent = 'Copied'
      } catch {
        button.textContent = 'Select and copy'
      }
      setTimeout(() => (button.textContent = 'Copy'), 1600)
    })
  })
})()
