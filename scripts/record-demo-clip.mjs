// Record the looping screen clip of the demo app that the project page shows on phones.
//
// Output (overwritten on every run):
//   site/assets/media/demo-clip.mp4   H.264, no audio, faststart (primary source)
//   site/assets/media/demo-clip.webm  VP9 fallback
//   site/assets/media/demo-poster.jpg first frame, also the desktop placeholder
//
// Requirements
//   - The demo app built into site/dist/demo (scripts/build-pages.sh, or an earlier build).
//   - `playwright-core` resolvable from the folder this file runs in. The repo does not
//     depend on it, so copy this file into a scratch folder that has it:
//       mkdir -p /tmp/vg-rec && cd /tmp/vg-rec && npm i playwright-core
//       cp <repo>/scripts/record-demo-clip.mjs . && VERIGRADER_ROOT=<repo> node record-demo-clip.mjs
//   - Google Chrome (CHROME=<path to the binary> to override the macOS default).
//   - ffmpeg with libx264 and libvpx-vp9 (FFMPEG=<path> to override `ffmpeg` on PATH).
//     Frames come from Chrome's own screencast (CDP Page.startScreencast), so Playwright's
//     bundled ffmpeg (needed by its recordVideo option) is not required.
//
// The run is deterministic: a fresh browser context (empty localStorage), a fixed viewport,
// fixed waits and fixed cursor paths. The demo's simulated grading delays are fixed too, so
// re-running after a UI change produces the same storyboard at the same output paths.
//
// Storyboard (about 24 s): click an "unclear" highlight in student 1's answer, scroll to the
// matched scoring point and the rationale; pick student 4 (orange "needs review" dot), press
// Problem and watch the three flagged papers settle; relabel a piece as Correct; open the
// Score Report.
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(process.env.VERIGRADER_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), '..'))
const dist = join(root, 'site', 'dist')
const media = join(root, 'site', 'assets', 'media')
const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg'
const W = 1280
const H = 800

if (!existsSync(join(dist, 'demo', 'index.html'))) {
  throw new Error(`No demo build at ${join(dist, 'demo')}. Run scripts/build-pages.sh first.`)
}

// ---- Static server: site/dist at /VeriGrader/ (as on GitHub Pages) ----
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (!path.startsWith('/VeriGrader/')) return res.writeHead(404).end()
  let file = normalize(join(dist, path.slice('/VeriGrader/'.length)))
  if (!file.startsWith(dist)) return res.writeHead(403).end()
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(await readFile(file))
  } catch {
    res.writeHead(404).end()
  }
})
await new Promise((done) => server.listen(0, '127.0.0.1', done))
const url = `http://127.0.0.1:${server.address().port}/VeriGrader/demo/#/grading`

// ---- Fake cursor (headless video has no pointer) ----
const cursorScript = () => {
  const install = () => {
    if (document.getElementById('__rec-cursor')) return
    const style = document.createElement('style')
    style.textContent = `
      #__rec-cursor{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;
        width:26px;height:26px;transform:translate(-100px,-100px);will-change:transform}
      #__rec-cursor svg{width:26px;height:26px;filter:drop-shadow(0 2px 3px rgb(0 0 0 / .35))}
      #__rec-ring{position:fixed;left:0;top:0;z-index:2147483646;pointer-events:none;width:44px;height:44px;
        margin:-22px 0 0 -22px;border-radius:50%;background:rgb(43 89 255 / .28);opacity:0;transform:scale(.3)}
      #__rec-ring.on{animation:__rec-pulse .55s cubic-bezier(.22,1,.36,1)}
      @keyframes __rec-pulse{0%{opacity:.9;transform:scale(.3)}100%{opacity:0;transform:scale(1.25)}}`
    document.head.appendChild(style)
    const cursor = document.createElement('div')
    cursor.id = '__rec-cursor'
    cursor.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M4 2.5v17.2l4.6-4.3 2.9 6.6 3-1.3-2.9-6.5h6.3z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>'
    const ring = document.createElement('div')
    ring.id = '__rec-ring'
    document.body.append(ring, cursor)
    document.addEventListener('mousemove', (e) => {
      cursor.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 2}px)`
      ring.style.left = `${e.clientX}px`
      ring.style.top = `${e.clientY}px`
    }, true)
    document.addEventListener('mousedown', () => {
      ring.classList.remove('on')
      void ring.offsetWidth
      ring.classList.add('on')
    }, true)
  }
  if (document.body) install()
  else document.addEventListener('DOMContentLoaded', install)
}

const work = await mkdtemp(join(tmpdir(), 'vg-clip-'))
const browser = await chromium.launch({ executablePath: chrome, headless: true })
const frames = [] // { t: seconds since epoch, file }
let startAt = 0
let endAt = 0
try {
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  })
  await context.addInitScript(cursorScript)
  const page = await context.newPage()
  const at = () => Date.now() / 1000
  // Screencast: Chrome pushes a JPEG whenever the page repaints.
  const cdp = await context.newCDPSession(page)
  const writes = []
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    const file = join(work, `f${String(frames.length).padStart(5, '0')}.jpg`)
    frames.push({ t: metadata.timestamp ?? at(), file })
    writes.push(writeFile(file, Buffer.from(data, 'base64')))
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  })
  page.setDefaultTimeout(15000)

  const pause = (ms) => page.waitForTimeout(ms)
  let mouse = { x: W * 0.62, y: H * 0.55 }
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  // Glide the pointer along an eased path; time-based so a glide takes `ms` however fast
  // each mouse event round-trips.
  const glide = async (x, y, ms = 700) => {
    const from = { ...mouse }
    const begin = Date.now()
    for (;;) {
      const t = Math.min(1, (Date.now() - begin) / ms)
      const k = ease(t)
      await page.mouse.move(from.x + (x - from.x) * k, from.y + (y - from.y) * k)
      if (t >= 1) break
      await pause(12)
    }
    mouse = { x, y }
  }
  const press = async () => {
    await page.mouse.down()
    await pause(90)
    await page.mouse.up()
  }
  // Centre of the first line box of an element (highlights can wrap).
  const point = async (locator, dx = 0.5) => {
    await locator.waitFor()
    const r = await locator.evaluate((el) => {
      const box = el.getClientRects()[0] ?? el.getBoundingClientRect()
      return { x: box.left, y: box.top, w: box.width, h: box.height }
    })
    return { x: r.x + Math.min(r.w * dx, 260), y: r.y + r.h / 2 }
  }
  const clickOn = async (locator, ms = 700, dx = 0.5) => {
    const p = await point(locator, dx)
    await glide(p.x, p.y, ms)
    await pause(160)
    await press()
  }
  // Eased window scroll driven from the page so it is frame-smooth.
  const scrollTo = (y, ms = 900) =>
    page.evaluate(
      ([target, duration]) =>
        new Promise((done) => {
          const start = window.scrollY
          const end = Math.min(target, document.documentElement.scrollHeight - innerHeight)
          const t0 = performance.now()
          const step = (now) => {
            const t = Math.min(1, (now - t0) / duration)
            const k = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
            window.scrollTo(0, start + (end - start) * k)
            if (t < 1) requestAnimationFrame(step)
            else done()
          }
          requestAnimationFrame(step)
        }),
      [y, ms],
    )

  const toolbar = page.locator('.header-action-section')
  const student = (id) => page.getByTitle(new RegExp(`^Student ID: ${id} \\(`))
  const paper = page.locator('.paper-preview')

  await page.goto(url)
  await page.locator('.grading-layout').waitFor()
  await page.locator('.paper-preview .text-highlight').first().waitFor()
  await page.mouse.move(mouse.x, mouse.y)
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: W, maxHeight: H, everyNthFrame: 1 })
  await pause(1200) // let fonts, layout and entry animations settle
  startAt = at()

  // 1. Click an unclear piece: the matched scoring point and the rationale light up.
  await pause(700)
  await scrollTo(260, 900)
  await clickOn(paper.locator('.text-highlight.highlight-unclear').first(), 800)
  await pause(1100)
  await scrollTo(10000, 1100) // reference answer (scoring point 8 highlighted) + rationale
  await glide(W * 0.55, H - 190, 600)
  await pause(2300)

  // 2. Student 4 carries a "needs review" dot: Problem regrades the flagged papers.
  await scrollTo(0, 1000)
  await clickOn(student(4), 750)
  await pause(1300)
  await clickOn(toolbar.getByRole('button', { name: 'Problem', exact: true }), 650)
  await page.waitForFunction(() => !document.querySelector('.student-list .quality-dot'), null, { timeout: 15000 })
  await pause(1400)

  // 3. Disagree with a call: relabel a piece as Correct.
  await clickOn(paper.locator('.text-highlight.highlight-wrong').last(), 800, 0.35)
  await pause(800)
  await clickOn(page.getByRole('button', { name: 'Correct', exact: true }), 700)
  await pause(1600)

  // 4. Score Report.
  await clickOn(page.getByText('Score Report', { exact: true }).first(), 900)
  await page.waitForURL('**/#/result')
  await pause(1500)
  await scrollTo(420, 1200)
  await pause(1000)
  endAt = at()
  await cdp.send('Page.stopScreencast')
  await Promise.all(writes)
  await context.close()
} finally {
  await browser.close()
  server.close()
}

// ---- Encode ----
// Variable-rate screencast frames -> concat list with per-frame durations -> constant 25 fps.
const shown = frames.filter((f) => f.t > startAt && f.t <= endAt)
const before = frames.filter((f) => f.t <= startAt).at(-1)
if (before) shown.unshift({ ...before, t: startAt })
if (shown.length < 2) throw new Error(`Screencast produced only ${frames.length} frames`)
const lines = ['ffconcat version 1.0']
shown.forEach((f, i) => {
  const next = i + 1 < shown.length ? shown[i + 1].t : endAt
  lines.push(`file '${f.file}'`, `duration ${Math.max(0.001, next - f.t).toFixed(4)}`)
})
lines.push(`file '${shown.at(-1).file}'`)
const list = join(work, 'frames.txt')
await writeFile(list, lines.join('\n'))

await mkdir(media, { recursive: true })
const input = ['-f', 'concat', '-safe', '0', '-i', list, '-t', (endAt - startAt).toFixed(2)]
const scale = `scale='min(${W},iw)':-2:flags=lanczos:out_range=tv,format=yuv420p,fps=25`
const run = (args) => execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
run([...input, '-an', '-vf', scale, '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(media, 'demo-clip.mp4')])
run([...input, '-an', '-vf', scale, '-c:v', 'libvpx-vp9', '-crf', '40', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', join(media, 'demo-clip.webm')])
run(['-i', shown[0].file, '-frames:v', '1', '-vf', `scale='min(${W},iw)':-2:flags=lanczos`, '-q:v', '3', join(media, 'demo-poster.jpg')])
await rm(work, { recursive: true, force: true })

for (const name of ['demo-clip.mp4', 'demo-clip.webm', 'demo-poster.jpg']) {
  const { size } = await stat(join(media, name))
  console.log(`${name.padEnd(16)} ${(size / 1024 / 1024).toFixed(2)} MB`)
}
console.log(`clip length ${(endAt - startAt).toFixed(1)} s`)
