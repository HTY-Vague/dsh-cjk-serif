/**
 * Guards for the host half's font route: it serves the bundled Chinese slices
 * from fonts/cjk and nothing else.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { Writable } from 'node:stream'
import assert from 'node:assert/strict'

const { serveFont } = await import('../index.js')

/** Minimal ServerResponse stand-in that records what a handler writes. */
class Capture extends Writable {
  constructor() {
    super()
    this.status = 0
    this.headers = {}
    this.chunks = []
  }

  writeHead(status, headers) {
    this.status = status
    this.headers = { ...(headers ?? {}) }
  }

  _write(chunk, _encoding, callback) {
    this.chunks.push(Buffer.from(chunk))
    callback()
  }

  get body() {
    return Buffer.concat(this.chunks)
  }
}

/**
 * @param {{url?: string, method?: string, headers?: Record<string, string>}} options - request shape.
 * @returns {Promise<{status: number, headers: Record<string, string>, body: Buffer}>} response.
 */
async function request(options) {
  const response = new Capture()
  serveFont(
    { url: options.url ?? '/', method: options.method ?? 'GET', headers: options.headers ?? {} },
    response,
  )
  if (response.status === 200 && options.method !== 'HEAD') {
    await new Promise((resolve) => response.on('finish', resolve).on('error', resolve))
  } else {
    await new Promise((resolve) => setImmediate(resolve))
  }
  return { status: response.status, headers: response.headers, body: response.body }
}

const slice = readdirSync(new URL('../fonts/cjk/', import.meta.url))
  .filter((name) => name.endsWith('.woff2'))
  .sort()[0]
assert.ok(slice !== undefined, 'fonts/cjk must contain slices; run: node scripts/embed-cjk-fonts.mjs')
const source = readFileSync(new URL(`../fonts/cjk/${slice}`, import.meta.url))

// A real slice streams with a long-lived cache header and a WOFF2 magic number.
const ok = await request({ url: `/dsh-cjk-serif/fonts/${slice}` })
assert.equal(ok.status, 200)
assert.equal(ok.headers['content-type'], 'font/woff2')
assert.match(ok.headers['cache-control'], /immutable/u)
assert.equal(ok.body.length, source.length)
assert.equal(ok.body.subarray(0, 4).toString('latin1'), 'wOF2')
assert.ok(ok.headers.etag !== undefined)

// Revalidation answers 304 without a body.
const cached = await request({ url: `/dsh-cjk-serif/fonts/${slice}`, headers: { 'if-none-match': ok.headers.etag } })
assert.equal(cached.status, 304)
assert.equal(cached.body.length, 0)

// HEAD carries the headers and no body.
const head = await request({ url: `/dsh-cjk-serif/fonts/${slice}`, method: 'HEAD' })
assert.equal(head.status, 200)
assert.equal(head.body.length, 0)
assert.equal(head.headers['content-length'], String(source.length))

// Anything outside the whitelist is refused: missing file, other extensions,
// traversal, and methods the route does not answer.
assert.equal((await request({ url: '/dsh-cjk-serif/fonts/nope.woff2' })).status, 404)
assert.equal((await request({ url: '/dsh-cjk-serif/fonts' })).status, 404, 'the bare route path names no file')
assert.equal((await request({ url: '/dsh-cjk-serif/fonts/../../client.js' })).status, 404)
assert.equal((await request({ url: '/dsh-cjk-serif/fonts/%2e%2e%2fclient.js' })).status, 404)
assert.equal((await request({ url: '/dsh-cjk-serif/fonts/client.js' })).status, 404)
assert.equal((await request({ url: `/dsh-cjk-serif/fonts/${slice}`, method: 'POST' })).status, 405)

console.log('font route guards OK (%s, %d bytes)', slice, source.length)
