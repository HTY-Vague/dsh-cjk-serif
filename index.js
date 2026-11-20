/**
 * Host half: serve the bundled Chinese font slices.
 *
 * The Chinese faces ship as ~100 unicode-range slices per family (the way Google
 * Fonts serves CJK), so they stay out of the client bundle: the browser requests
 * only the slices its characters need, from `/dsh-cjk-serif/fonts/<file>`. The
 * route is read-only, serves a whitelist of `.woff2` names inside `fonts/cjk/`,
 * and answers `HEAD`/`GET` with an immutable cache header.
 */
import { createReadStream, statSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROUTE_PATH = '/dsh-cjk-serif/fonts'
const FONT_URL_PREFIX = `${ROUTE_PATH}/`
const FONT_DIR = fileURLToPath(new URL('./fonts/cjk/', import.meta.url))
const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.woff2$/u

/**
 * Answer one font request from the route's directory.
 * @param {import('node:http').IncomingMessage} req - request.
 * @param {import('node:http').ServerResponse} res - response.
 */
export function serveFont(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' })
    res.end()
    return
  }
  const pathname = new URL(req.url ?? '/', 'http://local').pathname
  let name = ''
  try {
    name = decodeURIComponent(pathname.startsWith(FONT_URL_PREFIX) ? pathname.slice(FONT_URL_PREFIX.length) : '')
  } catch {
    name = ''
  }
  if (!NAME_RE.test(name)) {
    res.writeHead(404)
    res.end()
    return
  }
  const file = resolve(FONT_DIR, name)
  const inside = FONT_DIR.endsWith(sep) ? FONT_DIR : FONT_DIR + sep
  if (!file.startsWith(inside)) {
    res.writeHead(403)
    res.end()
    return
  }
  let stat
  try {
    stat = statSync(file)
  } catch {
    res.writeHead(404)
    res.end()
    return
  }
  const etag = `"${stat.size.toString(16)}-${Math.trunc(stat.mtimeMs).toString(16)}"`
  const headers = {
    'content-type': 'font/woff2',
    'content-length': String(stat.size),
    'cache-control': 'public, max-age=31536000, immutable',
    etag,
    'x-content-type-options': 'nosniff',
  }
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, { etag })
    res.end()
    return
  }
  res.writeHead(200, headers)
  if (req.method === 'HEAD') {
    res.end()
    return
  }
  const stream = createReadStream(file)
  stream.on('error', () => res.destroy())
  stream.pipe(res)
}

/**
 * Register the font route against the Host's web server.
 * @param {object} ctx - host plugin context.
 */
export function apply(ctx) {
  const install = (scope) => {
    scope.effect(() => {
      const server = scope.webServer
      if (typeof server?.register !== 'function') {
        ctx.logger?.warn?.('dsh-cjk-serif: no web server, bundled Chinese fonts are unavailable until a reload')
        return undefined
      }
      // The webserver's prefix match compares `pathname === prefix` or
      // `pathname.startsWith(prefix + '/')`, so the registered path carries no
      // trailing slash; FONT_URL_PREFIX keeps the slash for slicing names.
      const dispose = server.register({ kind: 'prefix', path: ROUTE_PATH, handler: serveFont })
      return () => {
        if (typeof dispose === 'function') dispose()
      }
    })
  }
  if (typeof ctx.inject === 'function') ctx.inject(['webServer'], install)
  else install(ctx)
}

export const name = 'dsh-cjk-serif'
