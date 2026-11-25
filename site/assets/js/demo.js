// Live demo section.
// Desktop/tablet with a fine pointer: mount the real app (demo/) in an iframe as the section nears
// the viewport. Phones and touch screens: play a muted screen recording while it is on screen.
;(() => {
  const section = document.getElementById('demo')
  if (!section) return

  const APP_URL = 'demo/#/grading'
  const STORAGE_PREFIX = 'verigrader:demo:'
  const liveQuery = window.matchMedia('(min-width: 768px) and (pointer: fine)')
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  section.classList.add('demo-js')

  // ---- Guided tour: staggered entrance ----
  const steps = section.querySelector('.demo-steps')
  if (steps) {
    steps.querySelectorAll('.demo-step').forEach((step, i) => step.style.setProperty('--demo-i', i))
    const stepObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        steps.classList.add('demo-in')
        stepObserver.disconnect()
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    stepObserver.observe(steps)
  }

  // ---- Live app ----
  const stage = section.querySelector('[data-demo-stage]')
  const loading = section.querySelector('[data-demo-loading]')
  let frame = null
  let wantLive = false

  const mount = () => {
    if (frame || !stage) return
    frame = document.createElement('iframe')
    frame.className = 'demo-frame'
    frame.title = 'VeriGrader live demo'
    frame.src = APP_URL
    frame.addEventListener('load', () => stage.classList.add('is-ready'), { once: true })
    stage.appendChild(frame)
  }

  const unmount = () => {
    if (!frame) return
    frame.remove()
    frame = null
    stage.classList.remove('is-ready')
  }

  const stageObserver = new IntersectionObserver(
    (entries) => {
      if (wantLive && entries.some((entry) => entry.isIntersecting)) mount()
    },
    { rootMargin: '700px 0px' },
  )
  if (stage) stageObserver.observe(stage)

  section.querySelector('[data-demo-reset]')?.addEventListener('click', () => {
    // Drop the iframe first so the app cannot write its state back while unloading.
    unmount()
    if (loading) loading.lastChild.textContent = 'Resetting the demo…'
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && key.startsWith(STORAGE_PREFIX)) localStorage.removeItem(key)
      }
    } catch {
      // Storage blocked: the fresh iframe still loads the prepared data.
    }
    mount()
    frame?.addEventListener('load', () => {
      if (loading) loading.lastChild.textContent = 'Loading the live demo…'
    }, { once: true })
  })

  // ---- Phone clip ----
  const clip = section.querySelector('[data-demo-clip]')
  let clipVisible = false
  const syncClip = () => {
    if (!clip) return
    const shouldPlay = !wantLive && clipVisible && !reducedMotion.matches
    if (shouldPlay && clip.paused) {
      if (clip.preload === 'none') clip.preload = 'auto'
      clip.play().catch(() => {
        clip.controls = true // autoplay refused: let the visitor start it
      })
    } else if (!shouldPlay && !clip.paused) {
      clip.pause()
    }
  }
  if (clip) {
    // Autoplaying clip needs no controls; reduced-motion visitors keep them and start it themselves.
    if (!reducedMotion.matches) clip.controls = false
    new IntersectionObserver(
      (entries) => {
        clipVisible = entries.some((entry) => entry.isIntersecting)
        syncClip()
      },
      { threshold: 0.25 },
    ).observe(clip)
    reducedMotion.addEventListener?.('change', () => {
      clip.controls = reducedMotion.matches
      syncClip()
    })
  }

  // ---- Mode switch ----
  const applyMode = () => {
    wantLive = liveQuery.matches
    section.classList.toggle('is-live', wantLive)
    if (wantLive && stage) {
      // Re-check visibility now that the stage is displayed.
      stageObserver.unobserve(stage)
      stageObserver.observe(stage)
    }
    syncClip()
  }
  applyMode()
  liveQuery.addEventListener?.('change', applyMode)
})()
