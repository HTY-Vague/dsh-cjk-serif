/**
 * Guards for the pure pieces of client.js that a browser would otherwise be
 * needed to exercise: the text-font list editing the settings row performs, plus
 * the rules the bundle must keep (no Harness client package import, no CSS
 * override, no per-user storage).
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
assert.doesNotMatch(source, /!important/u, 'the plugin must not override the host CSS')
assert.doesNotMatch(source, /localStorage/u, 'the Host font setting is the only state')
assert.doesNotMatch(source, /data-cjk-region-font/u, 'per-region control has been removed')
assert.match(source, /order: 12/u, 'the settings row must not collide with the theme font rows (order 11)')
assert.match(source, /ctx\.theme\.setFontFamily\('text'/u, 'the row must edit the Host font setting')

const start = source.indexOf('// --- [font list editing]')
const end = source.indexOf('// --- [/font list editing]')
assert.ok(start >= 0 && end > start, 'font list editing block not found')

const { FONT_FAMILY, splitFamilies, familyNameOf, hasFamily, addFamily, removeFamily } = new Function(
  `${source.slice(start, end)}\nreturn { FONT_FAMILY, splitFamilies, familyNameOf, hasFamily, addFamily, removeFamily }`,
)()

assert.equal(FONT_FAMILY, 'Dsh CJK Serif')

// splitFamilies / familyNameOf
assert.deepEqual(splitFamilies('a, b ,c'), ['a', 'b', 'c'])
assert.deepEqual(splitFamilies(''), [])
assert.deepEqual(splitFamilies('"Foo, Bar", baz'), ['"Foo, Bar"', 'baz'])
assert.equal(familyNameOf('"Dsh CJK Serif"'), 'Dsh CJK Serif')
assert.equal(familyNameOf("'Segoe UI'"), 'Segoe UI')
assert.equal(familyNameOf('sans-serif'), 'sans-serif')

// hasFamily: quoted, unquoted, single-quoted, and case-insensitive forms.
const present = [
  '"Dsh CJK Serif"',
  'Dsh CJK Serif',
  "'Dsh CJK Serif'",
  '"dsh cjk serif"',
  '"PingFang SC", "Dsh CJK Serif"',
]
const absent = ['', '"PingFang SC"', 'system-ui, sans-serif', '"Dsh CJK Serif Display"']
for (const value of present) assert.equal(hasFamily(value), true, `expected present: ${value}`)
for (const value of absent) assert.equal(hasFamily(value), false, `expected absent: ${value}`)

// addFamily: first position, de-duplicated, other entries preserved verbatim.
assert.equal(addFamily(''), '"Dsh CJK Serif"')
assert.equal(addFamily('"PingFang SC"'), '"Dsh CJK Serif", "PingFang SC"')
assert.equal(
  addFamily('"PingFang SC", "Dsh CJK Serif", "Microsoft YaHei"'),
  '"Dsh CJK Serif", "PingFang SC", "Microsoft YaHei"',
)
assert.equal(addFamily('"Dsh CJK Serif"'), '"Dsh CJK Serif"')
assert.equal(addFamily('system-ui, sans-serif'), '"Dsh CJK Serif", system-ui, sans-serif')

// removeFamily: only this family goes; quoted commas and the rest survive.
assert.equal(removeFamily('"Dsh CJK Serif", "PingFang SC"'), '"PingFang SC"')
assert.equal(removeFamily('"Dsh CJK Serif"'), '')
assert.equal(
  removeFamily('"PingFang SC", "Dsh CJK Serif", "Microsoft YaHei"'),
  '"PingFang SC", "Microsoft YaHei"',
)
assert.equal(removeFamily('"PingFang SC"'), '"PingFang SC"')
assert.equal(removeFamily(''), '')
assert.equal(removeFamily('"Foo, Bar", "Dsh CJK Serif"'), '"Foo, Bar"')

// Round trips keep the list consistent.
for (const value of ['', '"PingFang SC"', '"Dsh CJK Serif"', 'system-ui']) {
  assert.equal(hasFamily(addFamily(value)), true, `addFamily then hasFamily: ${value}`)
  assert.equal(hasFamily(removeFamily(value)), false, `removeFamily then hasFamily: ${value}`)
}

console.log('client.js guards OK (%d present / %d absent samples)', present.length, absent.length)
