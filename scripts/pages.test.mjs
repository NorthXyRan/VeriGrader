import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { get } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { buildSite } from './build-site.mjs'
import { createSiteServer } from './serve-site.mjs'

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'verigrader-pages-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  return directory
}

async function preview(t, directory) {
  const server = createSiteServer(directory).listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  }))
  return (path) => new Promise((resolve, reject) => {
    get({ hostname: '127.0.0.1', port: server.address().port, path }, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => { body += chunk })
      response.on('end', () => resolve({ status: response.statusCode, body }))
      response.on('error', reject)
    }).on('error', reject)
  })
}

test('missing sections fail the build without erasing the previous page', async (t) => {
  const site = await fixture(t)
  await mkdir(join(site, 'dist'))
  await writeFile(join(site, 'dist/index.html'), 'previous page')
  await writeFile(join(site, 'index.html'), '<!-- @include sections/missing.html -->')

  await assert.rejects(buildSite({ site }), { code: 'ENOENT' })
  assert.equal(await readFile(join(site, 'dist/index.html'), 'utf8'), 'previous page')
})

test('site assembly includes sections and preserves the demo when requested', async (t) => {
  const site = await fixture(t)
  for (const folder of ['sections', 'assets', 'dist/demo']) {
    await mkdir(join(site, folder), { recursive: true })
  }
  await writeFile(join(site, 'index.html'), '<main><!-- @include sections/demo.html --></main>')
  await writeFile(join(site, 'sections/demo.html'), ' <p>Demo</p>\n')
  await writeFile(join(site, 'assets/main.js'), 'export {}')
  await writeFile(join(site, 'dist/demo/index.html'), 'demo app')

  const out = await buildSite({ site, keepDemo: true })
  assert.equal(await readFile(join(out, 'index.html'), 'utf8'), '<main><p>Demo</p></main>')
  assert.equal(await readFile(join(out, 'demo/index.html'), 'utf8'), 'demo app')
  assert.equal(await readFile(join(out, 'assets/main.js'), 'utf8'), 'export {}')
  assert.equal(await readFile(join(out, '.nojekyll'), 'utf8'), '')
})

test('malformed URL returns 400 and the preview keeps serving requests', async (t) => {
  const directory = await fixture(t)
  await writeFile(join(directory, 'index.html'), 'project page')
  const request = await preview(t, directory)

  assert.equal((await request('/VeriGrader/%zz')).status, 400)
  assert.deepEqual(await request('/VeriGrader/'), { status: 200, body: 'project page' })
})

test('encoded traversal cannot read a sibling with the same directory prefix', async (t) => {
  const directory = await fixture(t)
  await mkdir(join(directory, 'dist'))
  await mkdir(join(directory, 'dist-private'))
  await writeFile(join(directory, 'dist-private/secret.txt'), 'private content')
  const request = await preview(t, join(directory, 'dist'))

  const response = await request('/VeriGrader/%2e%2e%2fdist-private/secret.txt')
  assert.equal(response.status, 403)
  assert.equal(response.body, 'Forbidden')
})
