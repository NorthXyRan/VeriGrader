// Drive the loop and the shared grading canvas from one six-step timeline.
;(() => {
  const root = document.getElementById('workflow')
  if (!root) return

  const tabs = [...root.querySelectorAll('.workflow-node')]
  const canvas = root.querySelector('.workflow-canvas')
  const iframe = canvas.querySelector('iframe')
  const buttons = [...root.querySelectorAll('.workflow-step')]
  // The step track sits outside the canvas, so look it up from the section.
  const note = root.querySelector('.workflow-track__note')
  const stageLabel = root.querySelector('[data-workflow-stage]')
  const narration = root.querySelector('[data-workflow-narration]')
  const STAGE_NAMES = ['LLM grades', 'You verify', 'Feedback steers']
  const playButton = root.querySelector('.workflow-play')
  const playLabel = root.querySelector('.workflow-play__label')
  const token = root.querySelector('.workflow-loop__token')
  const trail = root.querySelector('.workflow-loop__trail')
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const phone = window.matchMedia('(max-width: 640px)')
  const origin = window.location.origin

  const order = [0, 4, 5, 6] // First step index of each stage, followed by the end of the tour.
  const steps = [
    { stage: 0, duration: 3300, text: 'Split the student response into pieces that can be graded separately.' },
    { stage: 0, duration: 3000, text: 'Match each piece with the scoring point it addresses.' },
    { stage: 0, duration: 3200, text: 'Label each piece Correct, Wrong or Unclear, then tally the marks.' },
    { stage: 0, duration: 4500, text: 'Show the reason for the label alongside the response and scoring point.' },
    { stage: 1, duration: 10800, text: 'Settle each unclear piece: see why the model hesitated, choose the label, and the rationale follows your verdict.' },
    { stage: 2, duration: 12500, text: 'Rewrite the rationale as a rule the model should follow, set it as the standard, then regrade one, flagged or all responses.' },
  ]

  let index = 0
  let elapsed = 0
  let paused = false
  let visible = false
  let ready = false
  let frameId = 0
  let lastFrame = 0

  const playing = () => ready && visible && !paused && !reducedMotion.matches && !document.hidden
  const progress = () => elapsed / steps[index].duration

  function showStep() {
    const { stage } = steps[index]
    if (!phone.matches) {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === stage))
        tab.tabIndex = i === stage ? 0 : -1
      })
    }
    canvas.setAttribute('aria-labelledby', tabs[stage].id)
    canvas.dataset.stage = String(stage)
    buttons.forEach((button, i) => {
      if (i === index) button.setAttribute('aria-current', 'step')
      else button.removeAttribute('aria-current')
    })
    if (narration && narration.textContent !== steps[index].text) {
      stageLabel.textContent = STAGE_NAMES[stage]
      narration.textContent = steps[index].text
      note.classList.remove('is-new')
      void note.offsetWidth
      note.classList.add('is-new')
    }
  }

  function drawRing() {
    const { stage } = steps[index]
    const fraction = (index - order[stage] + progress()) / (order[stage + 1] - order[stage])
    const angle = ((stage + fraction) / 3) * 2 * Math.PI - Math.PI / 2
    const radius = 165
    const circumference = 2 * Math.PI * radius
    const x = 240 + radius * Math.cos(angle)
    const y = 236 + radius * Math.sin(angle)
    token.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`)
    trail.style.strokeDasharray = `${((fraction / 3) * circumference).toFixed(2)} ${circumference}`
    trail.style.strokeDashoffset = (-(stage / 3) * circumference).toFixed(2)
    root.style.setProperty('--workflow-progress', fraction.toFixed(4))
    // The step track above the canvas: one rail across all six steps.
    root.style.setProperty('--track-progress', ((index + progress()) / steps.length).toFixed(4))
    buttons.forEach((button, i) => button.classList.toggle('is-reached', i <= index))
  }

  function publish() {
    if (!ready) return
    iframe.contentWindow?.postMessage(
      {
        type: 'verigrader:workflow-state',
        step: index + 1,
        progress: progress(),
        playing: playing(),
      },
      origin,
    )
  }

  function tick(now) {
    frameId = 0
    if (!playing()) return
    const dt = lastFrame ? Math.min(100, now - lastFrame) : 0
    lastFrame = now
    elapsed += dt
    if (elapsed >= steps[index].duration) {
      // The tour loops: after Regrade it starts again from Segment.
      index = (index + 1) % steps.length
      elapsed = 0
      showStep()
      publish()
    } else {
      // Every frame, so typing, the cursor and the step track move smoothly.
      publish()
    }
    drawRing()
    frameId = requestAnimationFrame(tick)
  }

  function syncPlayback() {
    playButton.hidden = reducedMotion.matches
    playButton.dataset.paused = String(paused)
    playLabel.textContent = paused ? 'Play tour' : 'Pause tour'
    publish()
    if (playing()) {
      if (!frameId) frameId = requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(frameId)
      frameId = 0
      lastFrame = 0
    }
  }

  function selectStep(next) {
    index = next
    elapsed = 0
    // Jump there and keep the tour running from that step.
    paused = reducedMotion.matches
    showStep()
    drawRing()
    syncPlayback()
  }

  tabs.forEach((tab, i) => tab.addEventListener('click', () => selectStep(order[i])))
  buttons.forEach((button, i) => button.addEventListener('click', () => selectStep(i)))

  root.querySelector('.workflow-loop__tabs').addEventListener('keydown', (event) => {
    const stage = steps[index].stage
    const offsets = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    let next
    if (event.key in offsets) next = (stage + offsets[event.key] + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    else return
    event.preventDefault()
    selectStep(order[next])
    tabs[next].focus()
  })

  playButton.addEventListener('click', () => {
    paused = !paused
    syncPlayback()
  })

  window.addEventListener('message', (event) => {
    if (event.origin !== origin || event.source !== iframe.contentWindow) return
    if (event.data?.type === 'verigrader:workflow-ready') {
      ready = true
      syncPlayback()
    } else if (event.data?.type === 'verigrader:workflow-interact') {
      paused = true
      syncPlayback()
    }
  })

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.intersectionRatio >= 0.15
    syncPlayback()
  }, { threshold: 0.15 })
  observer.observe(iframe)

  // Phones hide the canvas and show the loop as a plain list, so its stages stop being tabs.
  const tabList = root.querySelector('.workflow-loop__tabs')
  function applyLayout() {
    const listOnly = phone.matches
    if (listOnly) tabList.removeAttribute('role')
    else tabList.setAttribute('role', 'tablist')
    tabs.forEach((tab) => {
      if (listOnly) {
        tab.removeAttribute('role')
        tab.removeAttribute('aria-selected')
        tab.removeAttribute('aria-controls')
        tab.setAttribute('aria-disabled', 'true')
        tab.tabIndex = -1
      } else {
        tab.setAttribute('role', 'tab')
        tab.setAttribute('aria-controls', canvas.id)
        tab.removeAttribute('aria-disabled')
      }
    })
    if (!listOnly) showStep()
  }
  phone.addEventListener('change', applyLayout)

  document.addEventListener('visibilitychange', syncPlayback)
  reducedMotion.addEventListener('change', syncPlayback)
  applyLayout()
  showStep()
  drawRing()
  syncPlayback()
  iframe.contentWindow?.postMessage({ type: 'verigrader:workflow-probe' }, origin)
})()
