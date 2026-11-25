// Assemble the project page into site/dist: inline site/sections/*.html into index.html
// at <!-- @include sections/<name>.html --> markers and copy site/assets.
// The demo app is built separately into site/dist/demo (see scripts/build-pages.sh).
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const site = join(dirname(fileURLToPath(import.meta.url)), '..', 'site')
const out = join(site, 'dist')
const keepDemo = process.argv.includes('--keep-demo')

if (existsSync(out)) {
  if (keepDemo) {
    for (const entry of ['index.html', 'assets']) await rm(join(out, entry), { recursive: true, force: true })
  } else {
    await rm(out, { recursive: true, force: true })
  }
}
await mkdir(out, { recursive: true })

let html = await readFile(join(site, 'index.html'), 'utf8')
html = await replaceAsync(html, /<!-- @include (sections\/[\w-]+\.html) -->/g, async (_, path) => {
  const file = join(site, path)
  return existsSync(file) ? (await readFile(file, 'utf8')).trim() : `<!-- ${path} not written yet -->`
})
await writeFile(join(out, 'index.html'), html)
await cp(join(site, 'assets'), join(out, 'assets'), { recursive: true })
await writeFile(join(out, '.nojekyll'), '')
console.log(`site assembled in ${out}`)

async function replaceAsync(text, pattern, replacer) {
  const parts = []
  let last = 0
  for (const match of text.matchAll(pattern)) {
    parts.push(text.slice(last, match.index), await replacer(...match))
    last = match.index + match[0].length
  }
  parts.push(text.slice(last))
  return parts.join('')
}
