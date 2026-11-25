// How it works: the grading loop. A token travels the ring while the section is in view,
// each stage swaps the detail panel, and the verify mock links pieces, scoring points and reasons.
;(() => {
  const root = document.getElementById('workflow')
  if (!root) return

  const stage = root.querySelector('.workflow-stage')
  const tabs = [...root.querySelectorAll('.workflow-node')]
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')))
  const panelBox = root.querySelector('.workflow-panels')
  const playBtn = root.querySelector('.workflow-play')
  const playLabel = root.querySelector('.workflow-play__label')
  const token = root.querySelector('.workflow-loop__token')
  const trail = root.querySelector('.workflow-loop__trail')
  const principles = [...root.querySelectorAll('.workflow-principle')]
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

  // Ring geometry (matches the SVG): centre (240, 236), radius 165, start at the top, clockwise.
  const CX = 240
  const CY = 236
  const R = 165
  const LOOP = 2 * Math.PI * R
  const DWELL = [8500, 10500, 9500] // ms per stage while touring
  const PIECE_STEP = 2300 // ms per highlighted piece in stage 2

  let active = 0
  let progress = 0 // 0..1 through the current stage's dwell
  let tokenF = 0 // token position as a fraction of the loop
  let paused = false
  let hold = false // pointer or focus inside the detail panel
  let inView = false
  let started = false
  let tween = null
  let last = 0
  let raf = 0

  const running = () => inView && !paused && !hold && !reduced.matches && !document.hidden
  const easeOut = (t) => 1 - Math.pow(1 - t, 3)

  function render() {
    const angle = -Math.PI / 2 + tokenF * 2 * Math.PI
    const x = CX + R * Math.cos(angle)
    const y = CY + R * Math.sin(angle)
    token.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`)
    const start = (active / 3) * LOOP
    const length = tween ? 0 : Math.max(0, ((((tokenF - active / 3) % 1) + 1) % 1) * LOOP)
    trail.style.strokeDasharray = `${length.toFixed(2)} ${LOOP}`
    trail.style.strokeDashoffset = `${(-start).toFixed(2)}`
    root.style.setProperty('--workflow-progress', progress.toFixed(4))
  }

  function replay(el, cls) {
    el.classList.remove(cls)
    void el.offsetWidth
    el.classList.add(cls)
  }

  function showStage(index) {
    active = index
    tabs.forEach((tab, i) => {
      const on = i === index
      tab.setAttribute('aria-selected', String(on))
      tab.tabIndex = on ? 0 : -1
    })
    panels.forEach((panel, i) => {
      panel.hidden = i !== index
      panel.classList.remove('is-playing')
    })
    if (started && !reduced.matches) replay(panels[index], 'is-playing')
    principles.forEach((item) => {
      const stages = item.dataset.stages.split(' ').map(Number)
      item.classList.toggle('is-active', stages.includes(index))
    })
    if (index === 1) {
      pieceClock = 0
      selectPiece(reduced.matches || paused ? DEFAULT_PIECE : 0)
    }
  }

  function goTo(index, { user = false } = {}) {
    if (user) setPaused(true)
    const from = tokenF
    let to = index / 3
    if (index !== active && to <= from + 1e-6) to += 1 // always travel forward around the loop
    progress = 0
    showStage(index)
    if (reduced.matches || !inView) {
      tween = null
      tokenF = index / 3
      render()
      return
    }
    tween = { from, to, start: performance.now(), dur: Math.min(900, 300 + Math.abs(to - from) * 1200) }
    kick()
  }

  function frame(now) {
    raf = 0
    const dt = Math.min(100, now - (last || now))
    last = now
    if (tween) {
      const p = Math.min(1, (now - tween.start) / tween.dur)
      tokenF = tween.from + (tween.to - tween.from) * easeOut(p)
      if (p >= 1) {
        tokenF = tween.to % 1
        tween = null
      }
    } else if (running()) {
      progress += dt / DWELL[active]
      if (progress >= 1) {
        progress = 0
        showStage((active + 1) % 3)
      }
      tokenF = (active + progress) / 3
      if (active === 1) {
        pieceClock += dt
        if (pieceClock >= PIECE_STEP) {
          pieceClock = 0
          selectPiece((pieceIndex + 1) % pieces.length)
        }
      }
    }
    render()
    if (inView && (tween || running())) kick()
  }

  function kick() {
    if (!raf) {
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
  }

  function setPaused(value) {
    paused = value
    playBtn.dataset.paused = String(value)
    playLabel.textContent = value ? 'Play tour' : 'Pause tour'
    if (!value) kick()
  }

  // ---------- Stage 2: linked pieces, scoring points and reasons ----------

  const verify = root.querySelector('.workflow-verify')
  const text = verify.querySelector('.workflow-verify__text')
  const pieces = [...verify.querySelectorAll('.workflow-piece')]
  const points = [...verify.querySelectorAll('.workflow-verify__points li')]
  const reasonPane = verify.querySelector('.workflow-verify__pane--reason')
  const verdict = verify.querySelector('.workflow-verify__verdict')
  const reason = verify.querySelector('.workflow-verify__reason')
  const LABELS = { correct: 'Correct', wrong: 'Wrong', unclear: 'Unclear' }
  const DEFAULT_PIECE = 3
  let pieceIndex = -1
  let pieceClock = 0

  function selectPiece(index) {
    if (index === pieceIndex) return
    pieceIndex = index
    const piece = pieces[index]
    const kind = Object.keys(LABELS).find((k) => piece.classList.contains(`hl--${k}`))
    pieces.forEach((p, i) => {
      p.classList.toggle('is-active', i === index)
      p.setAttribute('aria-pressed', String(i === index))
    })
    text.classList.add('has-active')
    points.forEach((li) => li.classList.toggle('is-active', li.dataset.sp === piece.dataset.sp))
    verdict.innerHTML = `<span class="tag tag--${kind}">${LABELS[kind]}</span> <span class="workflow-steer__sp">SP${piece.dataset.sp}</span>`
    reason.textContent = piece.dataset.reason
    if (!reduced.matches) replay(reasonPane, 'is-swapping')
  }

  pieces.forEach((piece, i) => {
    const pick = () => {
      pieceClock = 0
      selectPiece(i)
    }
    piece.addEventListener('pointerenter', pick)
    piece.addEventListener('focus', pick)
    piece.addEventListener('click', pick)
    piece.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        pick()
      }
    })
  })
  selectPiece(DEFAULT_PIECE)

  // ---------- Wiring ----------

  tabs.forEach((tab, i) => tab.addEventListener('click', () => goTo(i, { user: true })))

  root.querySelector('.workflow-loop__tabs').addEventListener('keydown', (event) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    let next = null
    if (event.key in keys) next = (active + keys[event.key] + 3) % 3
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = 2
    if (next === null) return
    event.preventDefault()
    goTo(next, { user: true })
    tabs[next].focus()
  })

  playBtn.addEventListener('click', () => {
    if (paused && tween === null) tokenF = (active + progress) / 3
    setPaused(!paused)
  })

  const setHold = (value) => {
    hold = value
    if (!value) kick()
  }
  panelBox.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && setHold(true))
  panelBox.addEventListener('pointerleave', () => setHold(false))
  panelBox.addEventListener('focusin', () => setHold(true))
  panelBox.addEventListener('focusout', (event) => {
    if (!panelBox.contains(event.relatedTarget)) setHold(false)
  })

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) kick()
  })

  function applyMotionPreference() {
    playBtn.hidden = reduced.matches
    if (reduced.matches) {
      tween = null
      progress = 0
      tokenF = active / 3
      panels.forEach((p) => p.classList.remove('is-playing'))
      render()
    } else {
      kick()
    }
  }
  reduced.addEventListener?.('change', applyMotionPreference)

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        inView = entry.isIntersecting
        if (inView && !started) {
          started = true
          root.classList.add('is-running')
          showStage(active)
        }
        if (inView) kick()
      }
    },
    { rootMargin: '-25% 0px -25% 0px' },
  )

  showStage(0)
  setPaused(false)
  applyMotionPreference()
  render()
  observer.observe(stage)
})()
