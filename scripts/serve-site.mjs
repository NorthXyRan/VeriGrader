// Preview the built GitHub Pages bundle locally at http://localhost:4173/VeriGrader/
// Build first with scripts/build-pages.sh.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'dist')
const port = Number(process.env.PORT ?? 4173)
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.json': 'application/json', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
}

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  if (path === '/') return res.writeHead(302, { location: '/VeriGrader/' }).end()
  if (!path.startsWith('/VeriGrader/')) return res.writeHead(404).end('Not found')
  let file = normalize(join(dist, path.slice('/VeriGrader/'.length)))
  if (!file.startsWith(dist)) return res.writeHead(403).end()
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(await readFile(file))
  } catch {
    res.writeHead(404).end('Not found')
  }
}).listen(port, () => console.log(`Serving site/dist at http://localhost:${port}/VeriGrader/`))
