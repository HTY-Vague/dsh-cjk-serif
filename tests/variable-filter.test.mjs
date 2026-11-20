/**
 * Guards for the pure pieces of client.js that a browser would otherwise be
 * needed to exercise: the font-family value filter and the compliance rules the
 * bundle must keep (no Harness client package import, no per-region DOM writes).
 */
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const sourcePath = new URL('../client.js', import.meta.url)
const source = readFileSync(sourcePath, 'utf8')

assert.doesNotMatch(
  source,
  /require\(['"]@deepseek-ai\//u,
  'client.js must not require a Harness client package (dsh-doc practices.md)',
)
assert.doesNotMatch(source, /data-cjk-region-font/u, 'per-region control has been removed')
assert.match(source, /order: 12/u, 'the settings row must not collide with the theme font rows (order 11)')

const start = source.indexOf('// --- [font-variable filtering]')
const end = source.indexOf('// --- [/font-variable filtering]')
assert.ok(start >= 0 && end > start, 'font-variable filtering block not found')

const isFontFamilyList = new Function(`${source.slice(start, end)}\nreturn isFontFamilyList`)()
assert.equal(typeof isFontFamilyList, 'function')

const accepted = [
  // The host's built-in text stack.
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  '"Noto Serif CJK SC", serif',
  "'Montserrat', 'Noto Sans'",
  'SimSun',
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI"',
  'serif',
  // Host values with the theme's brand stack in front.
  "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
]
const rejected = [
  // Font sizes, weights, styles, and shorthands from the host typography tokens.
  '14px',
  '13px',
  '1.5rem',
  '22px',
  '400',
  'bold',
  'normal',
  'italic',
  'inherit',
  '14px/22px "Dsh CJK Serif"',
  'italic 600 var(--dsh-content-font-size, 14px)',
  // Functions, colors, malformed lists, and injection attempts.
  'var(--dsw-font-family)',
  'calc(21px + 1px)',
  'rgba(0,0,0,.5)',
  '#ffffff',
  '"Dsh CJK Serif", 14px',
  'Arial,',
  '',
  'Arial !important',
  'Arial; color: red',
]

for (const value of accepted) assert.equal(isFontFamilyList(value), true, `expected accept: ${value}`)
for (const value of rejected) assert.equal(isFontFamilyList(value), false, `expected reject: ${value}`)

console.log(
  'client.js guards OK (%d accepted, %d rejected sample values)',
  accepted.length,
  rejected.length,
)
