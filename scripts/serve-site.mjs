// Preview the built GitHub Pages bundle locally at http://localhost:4173/VeriGrader/
// Build first with scripts/build-pages.sh.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'dist')
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.json': 'application/json', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
}

export function createSiteServer(directory = dist) {
  return createServer(async (req, res) => {
    let path
    try {
      path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    } catch {
      return res.writeHead(400).end('Bad request')
    }
    if (path === '/') return res.writeHead(302, { location: '/VeriGrader/' }).end()
    if (!path.startsWith('/VeriGrader/')) return res.writeHead(404).end('Not found')
    let file = join(directory, path.slice('/VeriGrader/'.length))
    const fromRoot = relative(directory, file)
    if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
      return res.writeHead(403).end('Forbidden')
    }
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
      const body = await readFile(file)
      res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(body)
    } catch {
      res.writeHead(404).end('Not found')
    }
  })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 4173)
  createSiteServer().listen(port, '127.0.0.1', () => {
    console.log(`Serving site/dist at http://localhost:${port}/VeriGrader/`)
  })
}
