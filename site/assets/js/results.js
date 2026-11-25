// Results section: study numbers, charts and participant quotes.
// Every value below is taken from Section 7 of the paper (Tables 1–3, Figs. 10–13, Section 7.4).
;(() => {
  const DATA = {
    // Table 1. Participants in table order: OSQ1 (U2…U12), then OSQ2 (U1…U11).
    rq1: {
      participants: ['U2', 'U4', 'U6', 'U8', 'U10', 'U12', 'U1', 'U3', 'U5', 'U7', 'U9', 'U11'],
      time: {
        title: 'Minutes per response',
        hint: 'lower is better',
        domain: [0, 7],
        ticks: [0, 2, 4, 6],
        manual: [3.4, 6.0, 4.6, 4.8, 3.0, 3.6, 2.0, 2.4, 2.2, 6.4, 4.4, 3.0],
        verigrader: [1.0, 1.6, 1.6, 1.7, 1.2, 1.6, 1.6, 1.4, 1.4, 3.0, 2.2, 1.7],
        mean: [3.82, 1.67],
        sd: [1.4, 0.5],
        format: (v) => v.toFixed(2),
      },
      f1: {
        title: 'Accuracy (F1, %)',
        hint: 'higher is better',
        domain: [60, 100],
        ticks: [60, 70, 80, 90, 100],
        manual: [90.6, 62.2, 94.5, 84.0, 85.7, 92.6, 71.8, 97.9, 82.6, 89.8, 89.8, 93.6],
        verigrader: [95.7, 94.8, 93.2, 94.3, 88.2, 95.7, 79.5, 86.3, 90.3, 93.8, 94.6, 95.9],
        mean: [86.26, 91.86],
        sd: [10.2, 5.0],
        format: (v) => v.toFixed(2),
      },
    },
    // RQ3, Setting S3: means over the 12 participants' values in Fig. 11
    // (text: +2.7% after exemplars, ~5.6% after final review, final ≈ 95%).
    ladder: {
      domain: [85, 99],
      ticks: [85, 90, 95],
      steps: [
        { label: 'LLM first pass', sub: 'no exemplars', value: 89.4 },
        { label: '+ your exemplars', sub: 'few-shot regrading', value: 92.1, delta: '+2.7 pts' },
        { label: '+ your review', sub: 'confirmed results', value: 95.0, delta: '+5.6 pts' },
      ],
    },
    // RQ4 text: κw and ICC(2,1) for human only (S1 reference), LLM only and VeriGrader.
    consistency: {
      conditions: [
        { key: 'human', label: 'Human only' },
        { key: 'llm', label: 'LLM only' },
        { key: 'vg', label: 'VeriGrader' },
      ],
      questions: [
        { key: 'osq1', label: 'OSQ1', topic: 'Data structures' },
        { key: 'osq2', label: 'OSQ2', topic: 'Numerical methods' },
      ],
      metrics: {
        kappa: {
          name: 'Weighted Fleiss’ κ',
          values: { osq1: { human: 0.485, llm: 0.645, vg: 0.771 }, osq2: { human: 0.812, llm: 0.912, vg: 0.916 } },
          bands: [0.6, 0.8],
          guide: 'Dashed lines: 0.6 and 0.8, the thresholds for “substantial” and “almost perfect” agreement (Landis &amp; Koch).',
          note: 'Most consistent of the three on both questions. On OSQ1, κ<sub>w</sub> rises from 0.485 (humans alone) and 0.645 (LLM alone) to <b>0.771</b>.',
        },
        icc: {
          name: 'ICC(2,1)',
          values: { osq1: { human: 0.559, llm: 0.67, vg: 0.79 }, osq2: { human: 0.846, llm: 0.92, vg: 0.924 } },
          bands: [0.75, 0.9],
          guide: 'Dashed lines: 0.75 and 0.9, the thresholds for “good” and “excellent” reliability.',
          note: 'Most consistent of the three on both questions: ICC(2,1) reaches <b>0.790</b> on OSQ1 (good) and <b>0.924</b> on OSQ2 (excellent).',
        },
      },
    },
    // Table 3: scoring-point-level Gwet's AC1 (Avg and SD as printed in the table).
    heat: {
      title: 'Agreement on every scoring point (Gwet’s AC1)',
      groups: [
        {
          label: 'OSQ1',
          topic: 'Data structures',
          rows: [
            { label: 'LLM only', values: [0.927, 0.705, 0.755, 0.794, 0.746, 0.822, 0.654, 0.61], avg: 0.752 },
            { label: 'VeriGrader', values: [0.985, 0.911, 0.719, 0.805, 0.83, 0.962, 0.924, 0.877], avg: 0.877 },
          ],
        },
        {
          label: 'OSQ2',
          topic: 'Numerical methods',
          rows: [
            { label: 'LLM only', values: [0.977, 0.791, 0.879, 0.62, 1.0, 0.786, 0.684, 0.881], avg: 0.827 },
            { label: 'VeriGrader', values: [0.92, 0.772, 0.749, 0.636, 1.0, 0.61, 0.779, 0.941], avg: 0.801 },
          ],
        },
      ],
      notes: [
        '<b>OSQ1:</b> the two weakest points climb from 0.654 and 0.610 to 0.924 and 0.877, lifting the average from 0.752 to <b>0.877</b>.',
        '<b>OSQ2:</b> the model alone already agreed strongly, and agreement stays high (average 0.827 alone, 0.801 with VeriGrader). Its two weakest points still rise, 0.620 → 0.636 and 0.684 → 0.779.',
      ],
    },
    // Fig. 12 (SUS items, 7-point scale): manual vs VeriGrader means.
    sus: [
      { q: 'Q1', text: 'I would like to use this system frequently.', manual: 3.25, vg: 6.58 },
      { q: 'Q3', text: 'I thought the system was easy to use.', manual: 4.33, vg: 6.42 },
      { q: 'Q5', text: 'The functions in this system were well integrated.', manual: 3.58, vg: 6.5 },
      { q: 'Q9', text: 'I felt very confident using the system.', manual: 4.25, vg: 5.83 },
    ],
    // Section 7.4, quoted verbatim.
    quotes: [
      { who: 'U11', topic: 'Collaboration', text: 'It felt like co-grading, I provide expertise, the model applies it systematically.' },
      { who: 'U1', topic: 'Traceability', text: 'I clearly knew where the score came from.' },
      {
        who: 'U7',
        topic: 'Unclear pieces',
        text: 'The model did a great job of explaining why it thought this was ambiguous, which was very helpful for me to make a further judgment.',
      },
      { who: 'U11', topic: 'Confidence', text: 'When I saw the LLM’s reasoning was the same as mine, it strongly boosted my confidence.' },
      { who: 'U10', topic: 'Rationales', text: 'The reason panel helped me know why the model gave this score.' },
      {
        who: 'U5',
        topic: 'Teaching the model',
        text: 'I felt like I was teaching the model how to grade. By continuously adding high-quality exemplars, my own subjective trust in the model’s ability to perform better also increased.',
      },
      { who: 'U9', topic: 'Calibrated trust', text: 'I trust its first pass, but I still want to verify them.' },
    ],
    quoteInterval: 7000,
  }

  const root = document.getElementById('results')
  if (!root) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const SVG = 'http://www.w3.org/2000/svg'
  const el = (tag, attrs = {}, html) => {
    const node = document.createElement(tag)
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
    if (html != null) node.innerHTML = html
    return node
  }
  const svg = (tag, attrs = {}) => {
    const node = document.createElementNS(SVG, tag)
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
    return node
  }
  const fmt2 = (v) => v.toFixed(2)
  const fmt3 = (v) => v.toFixed(3)
  const pct = (v, [lo, hi]) => ((v - lo) / (hi - lo)) * 100

  // ---------- Count-up numbers ----------

  function countUp(node, target, decimals, sign = '') {
    const final = `${target < 0 ? '−' : sign}${Math.abs(target).toFixed(decimals)}`
    if (reduceMotion.matches) {
      node.textContent = final
      return
    }
    const start = performance.now()
    const duration = 1100
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const v = target * eased
      node.textContent = `${v < 0 ? '−' : sign}${Math.abs(v).toFixed(decimals)}`
      if (t < 1) requestAnimationFrame(tick)
      else node.textContent = final
    }
    requestAnimationFrame(tick)
  }

  // ---------- RQ1 slope charts ----------

  function buildSlope(figure, spec) {
    const W = 280
    const H = 236
    const m = { top: 14, right: 46, bottom: 30, left: 46 }
    const xL = m.left + 46
    const xR = W - m.right - 30
    const y = (v) => m.top + (1 - (v - spec.domain[0]) / (spec.domain[1] - spec.domain[0])) * (H - m.top - m.bottom)

    const caption = el('figcaption', { class: 'results-slope__cap' }, `<b>${spec.title}</b><span>${spec.hint}</span>`)
    const chart = svg('svg', {
      viewBox: `0 0 ${W} ${H}`,
      class: 'results-slope__svg',
      role: 'img',
      'aria-label': `${spec.title}: manual grading mean ${spec.format(spec.mean[0])} (SD ${spec.sd[0]}), VeriGrader mean ${spec.format(
        spec.mean[1],
      )} (SD ${spec.sd[1]}). Per participant, manual to VeriGrader: ${DATA.rq1.participants
        .map((p, i) => `${p} ${spec.manual[i]} to ${spec.verigrader[i]}`)
        .join('; ')}.`,
    })

    // Grid and tick labels
    for (const t of spec.ticks) {
      chart.append(svg('line', { x1: m.left, x2: W - m.right + 10, y1: y(t), y2: y(t), class: 'results-slope__grid' }))
      const label = svg('text', { x: m.left - 8, y: y(t) + 4, class: 'results-slope__tick', 'text-anchor': 'end' })
      label.textContent = t
      chart.append(label)
    }
    // Column labels
    ;[
      [xL, 'Manual'],
      [xR, 'VeriGrader'],
    ].forEach(([x, text], i) => {
      const label = svg('text', { x, y: H - 8, class: `results-slope__col${i ? ' is-vg' : ''}`, 'text-anchor': 'middle' })
      label.textContent = text
      chart.append(label)
    })

    // SD bands
    spec.mean.forEach((mean, i) => {
      const x = i ? xR : xL
      const top = y(Math.min(spec.domain[1], mean + spec.sd[i]))
      const bottom = y(Math.max(spec.domain[0], mean - spec.sd[i]))
      chart.append(
        svg('rect', {
          x: x - 7,
          y: top,
          width: 14,
          height: bottom - top,
          rx: 7,
          class: `results-slope__sd${i ? ' is-vg' : ''}`,
          style: `--d:${i ? 900 : 100}ms`,
        }),
      )
    })

    // Participants
    const people = svg('g', { class: 'results-slope__people' })
    spec.manual.forEach((a, i) => {
      const b = spec.verigrader[i]
      people.append(
        svg('line', {
          x1: xL,
          y1: y(a),
          x2: xR,
          y2: y(b),
          pathLength: 1,
          class: 'results-slope__person',
          style: `--d:${150 + i * 45}ms`,
        }),
        svg('circle', { cx: xL, cy: y(a), r: 2.6, class: 'results-slope__pdot', style: `--d:${100 + i * 45}ms` }),
        svg('circle', { cx: xR, cy: y(b), r: 2.6, class: 'results-slope__pdot is-vg', style: `--d:${700 + i * 45}ms` }),
      )
    })
    chart.append(people)

    // Mean line
    const gradId = `results-grad-${figure.dataset.resultsSlope}`
    const defs = svg('defs')
    const grad = svg('linearGradient', { id: gradId, x1: 0, x2: 1, y1: 0, y2: 0 })
    grad.append(svg('stop', { offset: '0', 'stop-color': 'var(--results-manual)' }), svg('stop', { offset: '1', 'stop-color': 'var(--accent)' }))
    defs.append(grad)
    chart.prepend(defs)
    chart.append(
      svg('line', {
        x1: xL,
        y1: y(spec.mean[0]),
        x2: xR,
        y2: y(spec.mean[1]),
        pathLength: 1,
        stroke: `url(#${gradId})`,
        class: 'results-slope__mean',
        style: '--d:1000ms',
      }),
      svg('circle', { cx: xL, cy: y(spec.mean[0]), r: 6, class: 'results-slope__mdot', style: '--d:900ms' }),
      svg('circle', { cx: xR, cy: y(spec.mean[1]), r: 6, class: 'results-slope__mdot is-vg', style: '--d:1500ms' }),
    )
    const lv = svg('text', { x: xL - 14, y: y(spec.mean[0]) + 4, 'text-anchor': 'end', class: 'results-slope__val', style: '--d:900ms' })
    lv.textContent = spec.format(spec.mean[0])
    const rv = svg('text', { x: xR + 14, y: y(spec.mean[1]) + 4, class: 'results-slope__val is-vg', style: '--d:1500ms' })
    rv.textContent = spec.format(spec.mean[1])
    chart.append(lv, rv)

    figure.append(caption, chart)
  }

  // ---------- RQ3 ladder ----------

  function buildLadder(figure) {
    const { domain, ticks, steps } = DATA.ladder
    const base = steps[0].value
    figure.setAttribute('role', 'img')
    figure.setAttribute(
      'aria-label',
      `F1 accuracy in Setting S3: LLM first pass ${base}%, with the instructor's exemplars ${steps[1].value}% (plus 2.7 points), after the instructor's review ${steps[2].value}% (plus 5.6 points over the first pass).`,
    )
    const plot = el('div', { class: 'results-ladder__plot', 'aria-hidden': 'true' })
    for (const t of ticks) {
      const line = el('div', { class: 'results-ladder__grid', style: `bottom:${pct(t, domain)}%` })
      line.append(el('span', {}, `${t}`))
      plot.append(line)
    }
    const cols = el('div', { class: 'results-ladder__cols' })
    steps.forEach((s, i) => {
      const col = el('div', { class: `results-ladder__col results-ladder__col--${i}`, style: `--d:${i * 260}ms` })
      const bar = el('div', { class: 'results-ladder__bar', style: `height:${pct(s.value, domain)}%` })
      bar.append(el('div', { class: 'results-ladder__base', style: `height:${(pct(base, domain) / pct(s.value, domain)) * 100}%` }))
      const head = el('div', { class: 'results-ladder__head' })
      if (s.delta) head.append(el('span', { class: 'results-ladder__delta' }, s.delta))
      head.append(el('span', { class: 'results-ladder__value' }, `${s.value.toFixed(1)}<small>%</small>`))
      bar.append(head)
      col.append(bar)
      cols.append(col)
    })
    plot.append(cols)
    const labels = el('div', { class: 'results-ladder__labels', 'aria-hidden': 'true' })
    steps.forEach((s) => labels.append(el('div', {}, `<b>${s.label}</b><span>${s.sub}</span>`)))
    figure.append(el('figcaption', { class: 'results-ladder__cap' }, 'F1 accuracy, % <span>(axis starts at 85)</span>'), plot, labels)
  }

  // ---------- RQ4 consistency bars ----------

  function buildConsistency(figure, note) {
    const { conditions, questions, metrics } = DATA.consistency
    const bars = []
    const valueNodes = []
    const bandNodes = []
    const groups = el('div', { class: 'results-cons', 'aria-hidden': 'true' })
    for (const q of questions) {
      const group = el('div', { class: 'results-cons__group' })
      group.append(el('p', { class: 'results-cons__q' }, `<b>${q.label}</b> ${q.topic}`))
      const rows = el('div', { class: 'results-cons__rows' })
      const bandLayer = el('div', { class: 'results-cons__bands' })
      for (let b = 0; b < 2; b++) {
        const band = el('div', { class: 'results-cons__band' })
        bandLayer.append(band)
        bandNodes.push(band)
      }
      rows.append(bandLayer)
      conditions.forEach((c, i) => {
        const row = el('div', { class: `results-cons__row results-cons__row--${c.key}` })
        row.append(el('span', { class: 'results-cons__label' }, c.label))
        const track = el('div', { class: 'results-cons__track' })
        const bar = el('div', { class: 'results-cons__bar', style: `--d:${i * 140}ms` })
        track.append(bar)
        const value = el('span', { class: 'results-cons__value' })
        row.append(track, value)
        rows.append(row)
        bars.push({ bar, q: q.key, c: c.key })
        valueNodes.push({ node: value, q: q.key, c: c.key })
      })
      group.append(rows)
      groups.append(group)
    }
    // Screen-reader table, inside an sr-only wrapper: a <table> ignores width: 1px and would widen phones.
    const table = el('table')
    const tableBox = el('div', { class: 'results-sr' })
    tableBox.append(table)
    const guide = el('p', { class: 'results-cons__guide' })
    figure.append(groups, guide, tableBox)

    let current = 'kappa'
    const render = () => {
      const metric = metrics[current]
      for (const b of bars) b.bar.style.setProperty('--w', metric.values[b.q][b.c])
      for (const v of valueNodes) v.node.textContent = fmt3(metric.values[v.q][v.c])
      bandNodes.forEach((band, i) => (band.style.left = `${metric.bands[i % 2] * 100}%`))
      guide.innerHTML = metric.guide
      note.innerHTML = metric.note
      table.innerHTML =
        `<caption>${metric.name} by condition</caption><tr><th>Question</th>${conditions.map((c) => `<th>${c.label}</th>`).join('')}</tr>` +
        questions.map((q) => `<tr><th>${q.label} (${q.topic})</th>${conditions.map((c) => `<td>${fmt3(metric.values[q.key][c.key])}</td>`).join('')}</tr>`).join('')
    }
    render()

    root.querySelectorAll('[data-results-metric]').forEach((button) => {
      button.addEventListener('click', () => {
        current = button.dataset.resultsMetric
        root.querySelectorAll('[data-results-metric]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)))
        figure.classList.add('is-switching')
        render()
        setTimeout(() => figure.classList.remove('is-switching'), 50)
      })
    })
  }

  // ---------- AC1 heat strip ----------

  function buildHeat(figure) {
    const { groups, title, notes } = DATA.heat
    const shade = (v) => Math.round(Math.max(0, Math.min(1, (v - 0.55) / 0.45)) * 100)
    const points = groups[0].rows[0].values.length
    figure.append(el('figcaption', { class: 'results-heat__cap' }, title))
    const grid = el('div', { class: 'results-heat__grid', role: 'table', 'aria-label': title })
    const head = el('div', { class: 'results-heat__row results-heat__row--head', role: 'row' })
    head.append(el('span', { role: 'columnheader', class: 'results-heat__rl' }, '<span class="results-sr">Question and condition</span>'))
    for (let i = 0; i < points; i++) {
      head.append(el('span', { role: 'columnheader' }, `<span aria-hidden="true">P${i + 1}</span><span class="results-sr">Scoring point ${i + 1}</span>`))
    }
    head.append(el('span', { role: 'columnheader', class: 'results-heat__avg' }, 'Avg'))
    grid.append(head)
    let ri = 0
    for (const g of groups) {
      const sub = el('div', { class: 'results-heat__group', role: 'row' })
      sub.append(el('span', { role: 'rowheader' }, `<b>${g.label}</b> ${g.topic}`))
      grid.append(sub)
      for (const r of g.rows) {
        const row = el('div', { class: `results-heat__row${r.label === 'VeriGrader' ? ' is-vg' : ''}`, role: 'row' })
        row.append(el('span', { role: 'rowheader', class: 'results-heat__rl' }, `${r.label}<span class="results-sr">, ${g.label}</span>`))
        ;[...r.values, r.avg].forEach((v, i) => {
          const s = shade(v)
          const isAvg = i === r.values.length
          row.append(
            el(
              'span',
              {
                role: 'cell',
                class: `results-heat__cell${s > 55 ? ' is-dark' : ''}${isAvg ? ' results-heat__avg' : ''}`,
                style: `--s:${s}%;--d:${ri * 200 + i * 45}ms`,
                title: `${g.label}, ${r.label}, ${isAvg ? 'average' : `scoring point ${i + 1}`}: ${fmt3(v)}`,
              },
              v.toFixed(2).replace(/^0/, ''),
            ),
          )
        })
        grid.append(row)
        ri++
      }
    }
    const list = el('div', { class: 'results-heat__notes' })
    for (const n of notes) list.append(el('p', { class: 'results-heat__note' }, n))
    figure.append(grid, list)
  }

  // ---------- Usability paired bars ----------

  function buildSus(figure) {
    const list = el('div', { class: 'results-sus__list' })
    DATA.sus.forEach((item, i) => {
      const row = el('div', { class: 'results-sus__item', style: `--d:${i * 120}ms` })
      row.append(el('p', { class: 'results-sus__q' }, `<span class="results-sus__qn">${item.q}</span>${item.text}`))
      for (const [key, label, v] of [
        ['manual', 'Manual', item.manual],
        ['vg', 'VeriGrader', item.vg],
      ]) {
        const line = el('div', { class: `results-sus__line results-sus__line--${key}` })
        line.append(el('span', { class: 'results-sr' }, `${label}:`))
        const track = el('div', { class: 'results-sus__track', 'aria-hidden': 'true' })
        track.append(el('div', { class: 'results-sus__bar', style: `--w:${v / 7}` }))
        line.append(track, el('span', { class: 'results-sus__val' }, fmt2(v)))
        row.append(line)
      }
      list.append(row)
    })
    figure.append(list)
  }

  // ---------- Quotes carousel ----------

  function buildVoices(box) {
    const stage = box.querySelector('[data-results-voice-stage]')
    const dots = box.querySelector('[data-results-voice-dots]')
    const pauseBtn = box.querySelector('[data-results-voice-pause]')
    const quotes = DATA.quotes
    const slides = []
    const dotButtons = []
    quotes.forEach((q, i) => {
      const fig = el('figure', {
        class: `results-quote${q.text.length > 110 ? ' results-quote--long' : ''}`,
        role: 'group',
        'aria-roledescription': 'slide',
        'aria-label': `${i + 1} of ${quotes.length}`,
      })
      fig.append(
        el('span', { class: 'results-quote__topic' }, q.topic),
        el('blockquote', { class: 'results-quote__text' }, `<p>“${q.text}”</p>`),
        el(
          'figcaption',
          { class: 'results-quote__who' },
          `<span class="results-quote__avatar" aria-hidden="true">${q.who}</span><span><b>Participant ${q.who}</b><br />Teaching assistant, user study</span>`,
        ),
      )
      stage.append(fig)
      slides.push(fig)
      const dot = el('button', { type: 'button', class: 'results-voices__dot', 'aria-label': `Quote ${i + 1}, ${q.who}: ${q.topic}` })
      dot.append(el('span', { class: 'results-voices__pip' }))
      dot.addEventListener('click', () => go(i, true))
      dots.append(dot)
      dotButtons.push(dot)
    })

    let index = 0
    let timer = 0
    let userPaused = reduceMotion.matches
    let hovering = false
    let inView = false

    function show(i) {
      slides.forEach((s, k) => {
        const on = k === i
        s.classList.toggle('is-active', on)
        s.setAttribute('aria-hidden', String(!on))
        s.inert = !on
      })
      dotButtons.forEach((d, k) => {
        d.classList.toggle('is-active', k === i)
        if (k === i) d.setAttribute('aria-current', 'true')
        else d.removeAttribute('aria-current')
      })
    }
    function go(i, byUser) {
      index = (i + quotes.length) % quotes.length
      stage.setAttribute('aria-live', byUser ? 'polite' : 'off')
      show(index)
      schedule()
    }
    function running() {
      return !userPaused && !hovering && inView
    }
    function schedule() {
      clearTimeout(timer)
      box.classList.toggle('is-running', running())
      // Restart the progress animation on the active pip.
      const pip = dotButtons[index].firstChild
      pip.style.animation = 'none'
      void pip.offsetWidth
      pip.style.animation = ''
      if (running()) timer = setTimeout(() => go(index + 1, false), DATA.quoteInterval)
    }
    function setPaused(p) {
      userPaused = p
      pauseBtn.setAttribute('aria-pressed', String(p))
      pauseBtn.setAttribute('aria-label', p ? 'Play quotes' : 'Pause quotes')
      box.classList.toggle('is-paused', p)
      schedule()
    }

    box.style.setProperty('--results-interval', `${DATA.quoteInterval}ms`)
    box.querySelectorAll('[data-results-voice-step]').forEach((b) =>
      b.addEventListener('click', () => go(index + Number(b.dataset.resultsVoiceStep), true)),
    )
    pauseBtn.addEventListener('click', () => setPaused(!userPaused))
    box.addEventListener('mouseenter', () => {
      hovering = true
      schedule()
    })
    box.addEventListener('mouseleave', () => {
      hovering = false
      schedule()
    })
    box.addEventListener('focusin', () => {
      hovering = true
      schedule()
    })
    box.addEventListener('focusout', (e) => {
      if (box.contains(e.relatedTarget)) return
      hovering = false
      schedule()
    })
    // Swipe on touch screens.
    let startX = null
    stage.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX), { passive: true })
    stage.addEventListener('touchend', (e) => {
      if (startX == null) return
      const dx = e.changedTouches[0].clientX - startX
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1), true)
      startX = null
    })
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        (entries) => {
          inView = entries[0].isIntersecting
          schedule()
        },
        { threshold: 0.4 },
      ).observe(box)
    }
    setPaused(userPaused)
    show(0)
  }

  // ---------- Build and animate in ----------

  root.querySelectorAll('[data-results-slope]').forEach((fig) => buildSlope(fig, DATA.rq1[fig.dataset.resultsSlope]))
  const ladder = root.querySelector('[data-results-ladder]')
  if (ladder) buildLadder(ladder)
  const cons = root.querySelector('[data-results-consistency]')
  if (cons) buildConsistency(cons, root.querySelector('[data-results-consistency-note]'))
  const heat = root.querySelector('[data-results-heat]')
  if (heat) buildHeat(heat)
  const sus = root.querySelector('[data-results-sus]')
  if (sus) buildSus(sus)
  const voices = root.querySelector('[data-results-voices]')
  if (voices) buildVoices(voices)

  const play = (target) => {
    if (target.classList.contains('results-is-on')) return
    target.classList.add('results-is-on')
    target.querySelectorAll('[data-results-count]').forEach((n) => countUp(n, Number(n.dataset.resultsCount), 0))
    target.querySelectorAll('[data-results-num]').forEach((n) =>
      countUp(n, Number(n.dataset.resultsNum), Number(n.dataset.resultsDec || 0), n.dataset.resultsSign || ''),
    )
  }
  const targets = root.querySelectorAll('[data-results-card], [data-results-glance]')
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    root.classList.add('results-static')
    targets.forEach(play)
    return
  }
  root.classList.add('results-animate')
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        play(entry.target)
        io.unobserve(entry.target)
      }
    },
    { threshold: 0.2 },
  )
  targets.forEach((t) => io.observe(t))
})()
