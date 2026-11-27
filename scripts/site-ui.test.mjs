import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import { initDemo } from '../site/assets/js/demo.js'
import { initWorkflow } from '../site/assets/js/workflow.js'

const require = createRequire(new URL('../frontend/package.json', import.meta.url))
const { JSDOM } = require('jsdom')
const html = await readFile(new URL('../site/sections/workflow.html', import.meta.url), 'utf8')

function setup(t, { phone = false, reduced = false } = {}) {
  const dom = new JSDOM(html, { url: 'https://example.test/VeriGrader/', pretendToBeVisual: true })
  const { window } = dom
  const media = []
  const intersections = []
  const frames = new Map()
  let frameId = 0
  const matchMedia = (query) => {
    const listeners = []
    const entry = {
      matches: query.includes('reduced-motion') ? reduced : phone,
      addEventListener: (_, listener) => listeners.push(listener),
      change(matches) {
        this.matches = matches
        listeners.forEach((listener) => listener(this))
      },
    }
    media.push(entry)
    return entry
  }
  window.matchMedia = matchMedia
  const globals = {
    window, document: window.document, matchMedia,
    ResizeObserver: class { observe() {} },
    IntersectionObserver: class {
      constructor(callback) { intersections.push(callback) }
      observe() {}
    },
    requestAnimationFrame: (callback) => { frames.set(++frameId, callback); return frameId },
    cancelAnimationFrame: (id) => frames.delete(id),
  }
  for (const [key, value] of Object.entries(globals)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
    t.after(() => previous ? Object.defineProperty(globalThis, key, previous) : delete globalThis[key])
  }
  t.after(() => window.close())
  const document = window.document
  const iframe = document.querySelector('iframe')
  const canvas = document.querySelector('.workflow-canvas')
  Object.defineProperty(canvas, 'clientWidth', { value: 680 })
  return {
    document, iframe, media, frames,
    initialize() {
      initWorkflow()
      const messages = []
      iframe.contentWindow.postMessage = (data) => messages.push(data)
      window.dispatchEvent(new window.MessageEvent('message', {
        origin: window.location.origin, source: iframe.contentWindow,
        data: { type: 'verigrader:workflow-ready' },
      }))
      intersections[0]([
        { target: iframe, intersectionRatio: phone ? 0 : 1 },
        { target: document.querySelector('.workflow-loop'), intersectionRatio: 1 },
      ])
      return messages
    },
    tick(now) {
      const callbacks = [...frames.values()]
      frames.clear()
      callbacks.forEach((callback) => callback(now))
    },
  }
}

test('phone tour stays interactive and respects reduced motion without loading the hidden app', (t) => {
  const fixture = setup(t, { phone: true })
  const messages = fixture.initialize()
  const { document, iframe, frames } = fixture
  assert.equal(iframe.hasAttribute('src'), false)
  assert.equal(document.querySelector('.workflow-loop__tabs').getAttribute('role'), 'group')
  const verify = document.querySelector('#workflow-tab-verify')
  verify.click()
  assert.equal(verify.getAttribute('aria-pressed'), 'true')
  assert.equal(verify.classList.contains('is-active'), true)
  assert.equal(messages.at(-1).playing, false)
  const sent = messages.length
  fixture.tick(100)
  fixture.tick(200)
  assert.equal(messages.length, sent, 'phone animation must not publish hidden iframe frames')
  fixture.media[0].change(true)
  assert.equal(frames.size, 0)
  verify.click()
  assert.equal(frames.size, 0, 'selecting a stage must not override reduced motion')
  fixture.media[0].change(false)
  assert.equal(frames.size, 1)
})

for (const phone of [true, false]) {
  test(`${phone ? 'phone' : 'desktop'} tour advances after ${phone ? 1100 : 3300}ms`, (t) => {
    const fixture = setup(t, { phone })
    fixture.initialize()
    const firstStepDuration = phone ? 1100 : 3300
    const steps = [...fixture.document.querySelectorAll('.workflow-step')]
    for (let elapsed = 0; elapsed < firstStepDuration; elapsed += 100) fixture.tick(1 + elapsed)
    assert.equal(steps[0].getAttribute('aria-current'), 'step')
    fixture.tick(1 + firstStepDuration)
    assert.equal(steps[1].getAttribute('aria-current'), 'step')
  })
}

test('desktop-to-phone change stops the embedded app and resumes a paused ring', (t) => {
  const fixture = setup(t)
  const messages = fixture.initialize()
  assert.equal(messages.at(-1).playing, true)
  assert.equal(fixture.iframe.getAttribute('src'), 'demo/#/workflow-review')
  fixture.document.querySelector('.workflow-play').click()
  assert.equal(messages.at(-1).playing, false)
  assert.equal(fixture.frames.size, 0)
  fixture.media[1].change(true)
  assert.equal(messages.at(-1).playing, false)
  assert.equal(fixture.frames.size, 1)
  fixture.media[1].change(false)
  assert.equal(messages.at(-1).playing, true)
  assert.equal(fixture.document.querySelector('.workflow-node').hasAttribute('aria-pressed'), false)
})

test('desktop keyboard navigation follows focus and reduced motion disables autoplay', (t) => {
  const fixture = setup(t, { reduced: true })
  const messages = fixture.initialize()
  const tabs = [...fixture.document.querySelectorAll('.workflow-node')]
  tabs[1].focus()
  tabs[1].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
  assert.equal(fixture.document.activeElement, tabs[2])
  assert.equal(tabs[2].getAttribute('aria-selected'), 'true')
  assert.equal(messages.at(-1).step, 6)
  assert.equal(messages.at(-1).playing, false)
  assert.equal(fixture.frames.size, 0)
})

test('demo initialization tolerates an omitted demo section', (t) => {
  setup(t)
  assert.doesNotThrow(initDemo)
})
