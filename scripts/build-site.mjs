// Assemble the project page into site/dist: inline site/sections/*.html into index.html
// at <!-- @include sections/<name>.html --> markers and copy site/assets.
// The demo app is built separately into site/dist/demo (see scripts/build-pages.sh).
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const defaultSite = join(dirname(fileURLToPath(import.meta.url)), '..', 'site')

export async function buildSite({ site = defaultSite, keepDemo = false } = {}) {
  const out = join(site, 'dist')
  // Resolve every required section before touching a previous successful build.
  const template = await readFile(join(site, 'index.html'), 'utf8')
  const html = await replaceAsync(template, /<!-- @include (sections\/[\w-]+\.html) -->/g,
    async (_, path) => (await readFile(join(site, path), 'utf8')).trim())

  if (keepDemo) {
    for (const entry of ['index.html', 'assets']) await rm(join(out, entry), { recursive: true, force: true })
  } else {
    await rm(out, { recursive: true, force: true })
  }
  await mkdir(out, { recursive: true })
  await writeFile(join(out, 'index.html'), html)
  await cp(join(site, 'assets'), join(out, 'assets'), { recursive: true })
  await writeFile(join(out, '.nojekyll'), '')
  return out
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = await buildSite({ keepDemo: process.argv.includes('--keep-demo') })
  console.log(`site assembled in ${out}`)
}

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
