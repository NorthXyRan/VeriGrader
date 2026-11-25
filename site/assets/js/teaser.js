// Teaser: "how a grade is born". Plays the five grading stages (segment, align, judge, explain, verify)
// on one answer from the demo dataset once the section is in view, loops, and supports linked
// highlighting: hovering, focusing or tapping a piece lights up its scoring point and shows its rationale.
;(() => {
  const stage = document.querySelector('[data-teaser-stage]')
  if (!stage) return

  const body = stage.querySelector('[data-teaser-body]')
  const answer = stage.querySelector('.teaser-answer')
  const pieces = [...stage.querySelectorAll('.teaser-piece')]
  const items = new Map([...stage.querySelectorAll('.teaser-sp')].map((li) => [li.dataset.sp, li]))
  const stepButtons = [...stage.querySelectorAll('[data-teaser-step]')]
  const playButton = stage.querySelector('[data-teaser-play]')
  const narration = stage.querySelector('[data-teaser-narration]')
  const svg = stage.querySelector('[data-teaser-links]')
  const pop = stage.querySelector('[data-teaser-pop]')
  const cursor = stage.querySelector('[data-teaser-cursor]')
  const scoreEl = stage.querySelector('[data-teaser-score]')
  const statusEl = stage.querySelector('[data-teaser-status]')
  const countEls = Object.fromEntries(
    [...stage.querySelectorAll('[data-teaser-count]')].map((el) => [el.dataset.teaserCount, el]),
  )
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const wide = window.matchMedia('(min-width: 961px)')
  const SVG_NS = 'http://www.w3.org/2000/svg'

  const STEPS = {
    0: { text: 'A free-form answer comes in, written as plain prose with no structure to grade against.' },
    1: { dur: 3400, text: 'Segment: the model cuts the answer into self-contained pieces. Filler stays unmarked.' },
    2: { dur: 3600, text: 'Align: every piece is matched with the scoring point it answers.' },
    3: { dur: 3800, text: 'Judge: each piece is labelled correct, wrong, or unclear against its scoring point.' },
    4: {
      dur: 7000,
      text: 'Explain: every label comes with a rationale. Here, a wrong claim buried in a sentence that starts out right.',
    },
    5: { dur: 7600, text: 'Verify: the instructor settles what the model flagged. Only then does the score count.' },
  }
  const LABEL_TEXT = { correct: 'Correct', wrong: 'Wrong', unclear: 'Unclear' }
  const POINTS_TEXT = { correct: '+1 point', wrong: '0 points', unclear: 'needs review' }

  pieces.forEach((piece, i) => piece.style.setProperty('--i', i))
  ;[...items.values()].forEach((li, i) => li.style.setProperty('--i', i))
  const runge = pieces.find((p) => p.dataset.sp === '7')
  const flagged = pieces.find((p) => p.dataset.initial)

  let step = 5
  let playing = false
  let inView = false
  let started = false
  let holding = false
  let hoverPiece = null
  let stickyPiece = null
  let pinned = null
  let shownScore = Number(scoreEl.textContent) || 0
  const timer = { id: 0, start: 0, remaining: 0 }
  let subTimers = []
  let tickId = 0

  const later = (fn, ms) => subTimers.push(setTimeout(fn, ms))
  const isVerified = () => stage.classList.contains('is-verified')
  const shownLabel = (piece) => (piece.dataset.initial && !isVerified() ? piece.dataset.initial : piece.dataset.label)

  // ---------- Score and counts ----------

  function counts() {
    if (step < 3) return { correct: 0, wrong: 0, unclear: 0 }
    const c = { correct: 0, wrong: 0, unclear: 0 }
    for (const piece of pieces) c[shownLabel(piece)]++
    return c
  }

  function updateTally(animate) {
    const c = counts()
    for (const [label, el] of Object.entries(countEls)) el.textContent = c[label]
    if (step < 3) {
      statusEl.textContent = 'Not graded yet'
      statusEl.classList.remove('is-done')
      clearInterval(tickId)
      shownScore = 0
      scoreEl.textContent = '–'
      return
    }
    if (c.unclear) {
      statusEl.textContent = `${c.unclear} piece awaiting review`
      statusEl.classList.remove('is-done')
    } else {
      statusEl.textContent = 'Verified by the instructor'
      statusEl.classList.add('is-done')
    }
    tickTo(c.correct, animate)
  }

  function tickTo(target, animate) {
    clearInterval(tickId)
    if (!animate || reduceMotion.matches) {
      shownScore = target
      scoreEl.textContent = target
      return
    }
    tickId = setInterval(() => {
      if (shownScore === target) return clearInterval(tickId)
      shownScore += shownScore < target ? 1 : -1
      scoreEl.textContent = shownScore
      scoreEl.classList.remove('is-bump')
      void scoreEl.offsetWidth
      scoreEl.classList.add('is-bump')
    }, 150)
  }

  // ---------- Connectors (wide layout only) ----------

  function buildLinks() {
    svg.replaceChildren()
    if (!wide.matches) return
    const b = body.getBoundingClientRect()
    const r = answer.getBoundingClientRect()
    const x0 = r.right - b.left + 14
    svg.setAttribute('viewBox', `0 0 ${b.width} ${b.height}`)

    // Vertical extent of each piece; pieces sharing a line split it at the middle.
    const spans = pieces.map((piece) => {
      const rects = [...piece.getClientRects()]
      return {
        top: Math.min(...rects.map((x) => x.top)) - b.top,
        bottom: Math.max(...rects.map((x) => x.bottom)) - b.top,
      }
    })
    for (let i = 1; i < spans.length; i++) {
      if (spans[i].top < spans[i - 1].bottom) {
        const mid = (spans[i].top + spans[i - 1].bottom) / 2
        spans[i - 1].bottom = mid
        spans[i].top = mid
      }
    }

    pieces.forEach((piece, i) => {
      const li = items.get(piece.dataset.sp)
      const ir = li.getBoundingClientRect()
      const top = spans[i].top + 3
      const bottom = spans[i].bottom - 3
      const ym = (top + bottom) / 2
      const x1 = ir.left - b.left - 6
      const yi = ir.top - b.top + Math.min(22, ir.height / 2)
      const bend = (x1 - x0) * 0.55
      const path = document.createElementNS(SVG_NS, 'path')
      path.setAttribute(
        'd',
        `M${x0 - 6} ${top}H${x0}V${bottom}H${x0 - 6}M${x0} ${ym}C${x0 + bend} ${ym} ${x1 - bend} ${yi} ${x1} ${yi}`,
      )
      path.setAttribute('pathLength', '1')
      const dot = document.createElementNS(SVG_NS, 'circle')
      dot.setAttribute('cx', x1)
      dot.setAttribute('cy', yi)
      dot.setAttribute('r', 3)
      for (const el of [path, dot]) {
        el.dataset.sp = piece.dataset.sp
        el.dataset.label = piece.dataset.label
        if (piece.dataset.initial) el.dataset.initial = piece.dataset.initial
        el.style.setProperty('--i', i)
      }
      path.setAttribute('class', 'teaser-link')
      dot.setAttribute('class', 'teaser-link-dot')
      svg.append(path, dot)
    })
    renderFocus()
  }

  // ---------- Linked highlighting and the rationale card ----------

  function renderFocus() {
    const piece = hoverPiece || stickyPiece || pinned
    const sp = piece?.dataset.sp
    stage.classList.toggle('has-focus', Boolean(piece))
    for (const p of pieces) p.classList.toggle('is-focus', p === piece)
    for (const [key, li] of items) li.classList.toggle('is-focus', key === sp)
    for (const el of svg.children) el.classList.toggle('is-focus', el.dataset.sp === sp)
    if (!piece) {
      pop.hidden = true
      pieces.forEach((p) => p.removeAttribute('aria-describedby'))
      return
    }
    fillPop(piece)
    piece.setAttribute('aria-describedby', pop.id)
    placePop(piece)
  }

  function fillPop(piece) {
    const label = shownLabel(piece)
    const li = items.get(piece.dataset.sp)
    const verifiedNow = piece.dataset.initial && isVerified()
    const why = piece.dataset.initial && !isVerified() ? piece.dataset.whyInitial : piece.dataset.why

    const head = document.createElement('div')
    head.className = 'teaser-pop-head'
    const tag = document.createElement('span')
    tag.className = `tag tag--${label}`
    tag.textContent = `${LABEL_TEXT[label]} · ${POINTS_TEXT[label]}`
    const kicker = document.createElement('span')
    kicker.className = 'teaser-pop-kicker'
    kicker.textContent = piece === runge && pinned === runge && step === 4 ? 'The catch' : `Scoring point ${piece.dataset.sp}`
    head.append(tag, kicker)

    const title = document.createElement('strong')
    title.className = 'teaser-pop-sp'
    title.textContent = `${piece.dataset.sp} · ${li.querySelector('.teaser-sp-title').textContent}`
    const text = document.createElement('p')
    text.textContent = why
    pop.replaceChildren(head, title, text)

    if (verifiedNow) {
      const note = document.createElement('span')
      note.className = 'teaser-pop-verified'
      note.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'
      note.append('Flagged as unclear, confirmed correct by the instructor')
      pop.append(note)
    }
    pop.dataset.label = label
  }

  function placePop(piece) {
    const wasHidden = pop.hidden
    pop.hidden = false
    if (wasHidden) {
      pop.style.animation = 'none'
      void pop.offsetWidth
      pop.style.animation = ''
    }
    const b = body.getBoundingClientRect()
    const r = answer.getBoundingClientRect()
    const rects = [...piece.getClientRects()]
    const first = rects[0]
    const last = rects[rects.length - 1]
    const w = pop.offsetWidth
    const h = pop.offsetHeight
    const anchor = (last.left + last.right) / 2 - b.left
    const minLeft = r.left - b.left - (wide.matches ? 12 : 0)
    const maxLeft = r.right - b.left - w + (wide.matches ? 24 : 0)
    const left = Math.max(minLeft, Math.min(anchor - w * 0.3, maxLeft))

    let top = last.bottom - b.top + 12
    let below = true
    if (top + h > b.height - 8) {
      const above = first.top - b.top - 12 - h
      if (above > 0) {
        top = above
        below = false
      }
    }
    const ax = (below ? anchor : (first.left + first.right) / 2 - b.left) - left
    pop.classList.toggle('is-below', below)
    pop.classList.toggle('is-above', !below)
    pop.style.setProperty('--pop-from', below ? '6px' : '-6px')
    pop.style.setProperty('--ax', `${Math.max(20, Math.min(ax, w - 20))}px`)
    pop.style.left = `${left}px`
    pop.style.top = `${top}px`
  }

  // ---------- Instructor cursor ----------

  function cursorTarget() {
    const b = body.getBoundingClientRect()
    const first = flagged.getClientRects()[0]
    return {
      x: first.left - b.left + Math.min(first.width * 0.55, 150),
      y: first.top - b.top + first.height * 0.55,
    }
  }

  function placeCursor(x, y, instant) {
    if (instant) cursor.style.transition = 'none'
    cursor.style.setProperty('--cx', `${x}px`)
    cursor.style.setProperty('--cy', `${y}px`)
    if (instant) {
      void cursor.offsetWidth
      cursor.style.transition = ''
    }
  }

  // ---------- Stages ----------

  function setClasses(n) {
    for (let k = 1; k <= 5; k++) stage.classList.toggle(`is-s${k}`, n >= k)
  }

  function applyStep(n) {
    subTimers.forEach(clearTimeout)
    subTimers = []
    step = n
    stage.classList.remove('is-verified')
    cursor.classList.remove('is-on', 'is-click')
    stickyPiece = null
    pinned = null

    stepButtons.forEach((button) => {
      const k = Number(button.dataset.teaserStep)
      if (k === n) button.setAttribute('aria-current', 'step')
      else button.removeAttribute('aria-current')
      button.classList.toggle('is-done', k < n)
      button.classList.remove('is-running')
    })
    narration.textContent = (STEPS[n] ?? STEPS[0]).text
    narration.style.animation = 'none'
    void narration.offsetWidth
    narration.style.animation = ''

    const motion = !reduceMotion.matches
    if (n === 1 && motion) {
      // The raw answer first, then the cut.
      setClasses(0)
      narration.textContent = STEPS[0].text
      later(() => {
        setClasses(1)
        narration.textContent = STEPS[1].text
      }, 900)
    } else {
      setClasses(n)
    }
    updateTally(motion && n === 3)

    if (n === 4) pinned = runge
    if (n === 5) {
      pinned = flagged
      if (motion) {
        const b = body.getBoundingClientRect()
        const r = answer.getBoundingClientRect()
        placeCursor(r.right - b.left - 30, Math.min(r.bottom - b.top, b.height - 40), true)
        later(() => {
          cursor.classList.add('is-on')
          const t = cursorTarget()
          placeCursor(t.x, t.y)
        }, 350)
        later(() => {
          cursor.classList.add('is-click')
          verify(true)
        }, 1650)
      } else {
        verify(false)
      }
    }
    renderFocus()
  }

  function verify(animate) {
    stage.classList.add('is-verified')
    updateTally(animate)
    renderFocus()
  }

  // ---------- Timeline ----------

  function schedule() {
    clearTimeout(timer.id)
    timer.id = 0
    const running = playing && inView && !holding && step >= 1
    stage.classList.toggle('is-paused', !running)
    if (!running) return
    timer.start = performance.now()
    timer.id = setTimeout(() => go(step === 5 ? 1 : step + 1), Math.max(0, timer.remaining))
  }

  function suspend() {
    if (timer.id) {
      clearTimeout(timer.id)
      timer.id = 0
      timer.remaining -= performance.now() - timer.start
    }
    stage.classList.add('is-paused')
  }

  function go(n) {
    applyStep(n)
    timer.remaining = STEPS[n].dur
    const button = stepButtons.find((b) => Number(b.dataset.teaserStep) === n)
    if (playing && button) {
      stage.style.setProperty('--teaser-dur', `${STEPS[n].dur}ms`)
      void button.offsetWidth
      button.classList.add('is-running')
    }
    schedule()
  }

  function setPlaying(value) {
    playing = value
    playButton.classList.toggle('is-playing', playing)
    playButton.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation')
    if (!playing) {
      suspend()
      return
    }
    if (step < 1) return go(1)
    const button = stepButtons.find((b) => Number(b.dataset.teaserStep) === step)
    if (button && !button.classList.contains('is-running')) {
      // Resumed after a manual jump: run this stage's full timer from the start.
      timer.remaining = STEPS[step].dur
      stage.style.setProperty('--teaser-dur', `${STEPS[step].dur}ms`)
      button.classList.add('is-running')
    }
    schedule()
  }

  // ---------- Interaction ----------

  stepButtons.forEach((button) =>
    button.addEventListener('click', () => {
      playing = false
      playButton.classList.remove('is-playing')
      playButton.setAttribute('aria-label', 'Play animation')
      suspend()
      started = true
      go(Number(button.dataset.teaserStep))
    }),
  )

  playButton.addEventListener('click', () => {
    started = true
    setPlaying(!playing)
  })

  const hold = (piece) => {
    hoverPiece = piece
    if (!holding) {
      holding = true
      suspend()
    }
    renderFocus()
  }
  const release = () => {
    hoverPiece = null
    holding = false
    renderFocus()
    schedule()
  }

  for (const piece of pieces) {
    piece.addEventListener('pointerenter', (e) => e.pointerType !== 'touch' && hold(piece))
    piece.addEventListener('pointerleave', (e) => e.pointerType !== 'touch' && release())
    piece.addEventListener('focus', () => hold(piece))
    piece.addEventListener('blur', release)
    piece.addEventListener('click', (e) => {
      e.stopPropagation()
      stickyPiece = stickyPiece === piece ? null : piece
      if (playing) setPlaying(false)
      cursor.classList.remove('is-on')
      renderFocus()
    })
    piece.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        piece.click()
      }
    })
  }
  for (const [sp, li] of items) {
    const piece = pieces.find((p) => p.dataset.sp === sp)
    li.addEventListener('pointerenter', (e) => e.pointerType !== 'touch' && hold(piece))
    li.addEventListener('pointerleave', (e) => e.pointerType !== 'touch' && release())
    li.addEventListener('click', (e) => {
      e.stopPropagation()
      stickyPiece = stickyPiece === piece ? null : piece
      if (playing) setPlaying(false)
      cursor.classList.remove('is-on')
      renderFocus()
    })
  }
  body.addEventListener('click', () => {
    if (!stickyPiece) return
    stickyPiece = null
    renderFocus()
  })
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && stickyPiece) {
      stickyPiece = null
      renderFocus()
    }
  })

  // ---------- Layout ----------

  let frame = 0
  function layout() {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      buildLinks()
      if (cursor.classList.contains('is-on')) {
        const t = cursorTarget()
        placeCursor(t.x, t.y, true)
      }
    })
  }
  new ResizeObserver(layout).observe(body)
  document.fonts?.ready.then(layout)

  // ---------- Start ----------

  function init() {
    if (reduceMotion.matches) {
      // Final, fully annotated state; the stepper still shows each stage, without movement.
      playButton.hidden = true
      applyStep(5)
      pinned = null
      renderFocus()
      layout()
      return
    }
    playButton.hidden = false
    playing = true
    playButton.classList.add('is-playing')
    playButton.setAttribute('aria-label', 'Pause animation')
    step = 0
    setClasses(0)
    stage.classList.remove('is-verified')
    stepButtons.forEach((b) => {
      b.removeAttribute('aria-current')
      b.classList.remove('is-done')
    })
    narration.textContent = STEPS[0].text
    updateTally(false)
    renderFocus()
    layout()
  }
  init()

  new IntersectionObserver(
    (entries) => {
      inView = entries.some((e) => e.isIntersecting)
      if (!inView) return suspend()
      if (!started && !reduceMotion.matches) {
        started = true
        if (playing) return go(1)
      }
      schedule()
    },
    { rootMargin: '0px 0px -30% 0px' },
  ).observe(stage)
})()
