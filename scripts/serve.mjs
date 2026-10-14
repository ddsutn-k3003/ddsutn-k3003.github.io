// Servidor local para revisar dist/ (http://localhost:4190).
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
const root = resolve(process.argv[2] ?? 'dist')
const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' }
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x').pathname
  const file = join(root, url.endsWith('/') ? url + 'index.html' : url)
  try {
    const data = await readFile(file)
    res.writeHead(200, { 'content-type': tipos[extname(file)] ?? 'application/octet-stream' })
    res.end(data)
  } catch {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' })
    res.end(await readFile(join(root, '404.html')).catch(() => '404'))
  }
}).listen(4190, () => console.log('http://localhost:4190'))
