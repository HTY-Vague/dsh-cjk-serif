/**
 * Guards for the pieces of this bundle a browser would otherwise be needed to
 * exercise: the font catalog, list composition, choice recovery, the bundled
 * Chinese sheet the build writes into client.js, and the host route that serves
 * it. Also pins the rules the bundle must keep: no Harness client package
 * import, no CSS override, no per-user storage.
 */
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
const host = readFileSync(new URL('../index.js', import.meta.url), 'utf8')

assert.doesNotMatch(
  client,
  /require\(['"]@deepseek-ai\//u,
  'client.js must not require a Harness client package (dsh-doc practices.md)',
)
assert.doesNotMatch(client, /!important/u, 'the plugin must not override the host CSS')
assert.doesNotMatch(client, /localStorage/u, 'the Host font setting is the only state')
assert.doesNotMatch(client, /data-cjk-region-font/u, 'per-region control has been removed')
assert.doesNotMatch(client, /measureAvailability/u, 'canvas font detection is unreliable and was removed')
assert.doesNotMatch(client, /未安装/u, 'options must not claim a system font is missing')
assert.match(client, /order: 12/u, 'the settings rows must not collide with the theme font rows (order 11)')
assert.match(client, /ctx\.theme\.setFontFamily\('text'/u, 'the rows must edit the Host font setting')
assert.match(client, /font-display:swap/u, 'bundled faces must not hide text while loading')

// A native select paints its popup on a platform surface, so inheriting the
// row's (light-on-dark) text colour made every option invisible until hovered.
const selectRule = client.match(/\.dsh-cjk-serif-select\{[^}]*\}/u)
assert.ok(selectRule !== null, 'select rule not found')
assert.doesNotMatch(selectRule[0], /color:inherit/u, 'the select must not inherit its text colour')
assert.match(
  client,
  /\.dsh-cjk-serif-select option\{[^}]*background-color:[^;}]*[^}]*color:/u,
  'the popup rows need an explicit surface and text colour',
)
assert.match(client, /data-ds-dark-theme/u, 'the popup must follow the dark theme')

// Bundled Latin faces stay inlined; bundled Chinese slices are served by the
// host route, so their sheet references a URL placeholder instead of data.
const embedded = client.match(/data:font\/woff2;base64,/gu) ?? []
assert.ok(embedded.length >= 4, `expected four bundled latin faces, found ${embedded.length}`)
const placeholders = client.match(/__FONT_BASE__/gu) ?? []
assert.ok(placeholders.length >= 200, `expected the bundled CJK slices in the sheet, found ${placeholders.length}`)
assert.match(client, /font-family: 'Noto Serif SC Variable'/u)
assert.match(client, /font-family: 'Noto Sans SC Variable'/u)
assert.doesNotMatch(client, /url\(\.\/files\//u, 'sheet URLs must go through the host route')

// Host half: a read-only whitelist route that serves fonts/cjk. The prefix it
// registers carries no trailing slash — the webserver matches `prefix + '/'`,
// so a trailing slash would never match a slice request.
assert.match(host, /export function apply/u)
assert.match(host, /const ROUTE_PATH = '\/dsh-cjk-serif\/fonts'/u)
assert.doesNotMatch(host, /path: '\/dsh-cjk-serif\/fonts\/'/u, 'the registered prefix must not end in a slash')
assert.match(host, /FONT_URL_PREFIX/u)
assert.match(host, /\.woff2/u)
assert.match(host, /statSync/u)
assert.match(host, /cache-control/u)
assert.doesNotMatch(host, /writeFile|rmSync|unlink/u, 'the font route must stay read-only')

const start = client.indexOf('// --- [fonts]')
const end = client.indexOf('// --- [/fonts]')
assert.ok(start >= 0 && end > start, 'font catalog block not found')

const {
  LATIN_CHOICES,
  CJK_CHOICES,
  splitFamilies,
  familyNameOf,
  quoteFamily,
  composeTextFonts,
  selectionOf,
  cjkFontFaceCss,
  managedFamilyKeys,
  isManagedFamily,
} = new Function(
  `${client.slice(start, end)}\nreturn { LATIN_CHOICES, CJK_CHOICES, splitFamilies, familyNameOf, quoteFamily, composeTextFonts, selectionOf, cjkFontFaceCss, managedFamilyKeys, isManagedFamily }`,
)()

// Catalog: both selects open on the default, ids are unique inside a catalog,
// every choice names at least one family, and the system choices carry the
// local() names their CJK-only face resolves through.
assert.equal(LATIN_CHOICES[0].id, 'default')
assert.equal(CJK_CHOICES[0].id, 'default')
for (const choices of [LATIN_CHOICES, CJK_CHOICES]) {
  const ids = choices.map((choice) => choice.id)
  assert.equal(new Set(ids).size, ids.length, 'choice ids must be unique inside one catalog')
}
for (const choice of LATIN_CHOICES.concat(CJK_CHOICES)) {
  if (choice.id === 'default') continue
  assert.ok(Array.isArray(choice.families) && choice.families.length > 0, `${choice.id} needs a family`)
}
for (const choice of CJK_CHOICES) {
  if (choice.local === undefined) continue
  assert.ok(choice.local.length > 0, `${choice.id} needs local() names`)
  assert.match(choice.families[0], /^Dsh CJK /u, `${choice.id} family must stay in the plugin namespace`)
}

// The deduplicated Chinese list: bundled serif, bundled sans, then the three
// distinct system styles.
assert.deepEqual(
  CJK_CHOICES.map((choice) => choice.id),
  ['default', 'noto-serif-sc', 'noto-sans-sc', 'kaiti', 'fangsong'],
)
assert.deepEqual(CJK_CHOICES[1].families, ['Noto Serif SC Variable'])
assert.deepEqual(CJK_CHOICES[2].families, ['Noto Sans SC Variable'])

// Option labels are the font names themselves: no "(bundled)", no "(serif)",
// and no availability hint.
const labels = [...client.matchAll(/'font\.([a-z0-9-]+)': '([^']*)'/gu)].map((match) => match[2])
assert.ok(labels.length >= 20, `expected both dictionaries, found ${labels.length} labels`)
for (const label of labels) {
  assert.doesNotMatch(label, /[（(]/u, `option labels carry no annotation: ${label}`)
}

// One family belongs to one choice, so an existing list maps back without
// ambiguity.
const owners = new Map()
for (const choice of LATIN_CHOICES.concat(CJK_CHOICES)) {
  for (const family of choice.families) {
    const key = family.toLowerCase()
    assert.ok(!owners.has(key), `${family} is claimed by both ${owners.get(key)} and ${choice.id}`)
    owners.set(key, choice.id)
  }
}

// List helpers.
assert.deepEqual(splitFamilies('a, b ,c'), ['a', 'b', 'c'])
assert.deepEqual(splitFamilies(''), [])
assert.deepEqual(splitFamilies('"Foo, Bar", baz'), ['"Foo, Bar"', 'baz'])
assert.equal(familyNameOf('"Noto Serif SC Variable"'), 'Noto Serif SC Variable')
assert.equal(quoteFamily('serif'), 'serif')
assert.equal(quoteFamily('Georgia'), '"Georgia"')

// Composition: our two choices lead, foreign entries survive verbatim, stale
// families from either catalog are dropped, and defaults write nothing.
assert.equal(composeTextFonts('', 'inter', 'kaiti'), '"Inter", "Dsh CJK KaiTi"')
assert.equal(
  composeTextFonts('"Inter", "Source Serif 4", "Comic Sans MS"', 'source-serif-4', 'noto-serif-sc'),
  '"Source Serif 4", "Noto Serif SC Variable", "Comic Sans MS"',
)
assert.equal(composeTextFonts('"Foo, Bar", "Inter"', 'default', 'default'), '"Foo, Bar"')
assert.equal(composeTextFonts('', 'default', 'default'), '')
// A family the user typed by hand is not ours to remove, even when it is the
// same typeface behind one of our choices.
assert.equal(composeTextFonts('"SimSun"', 'default', 'noto-serif-sc'), '"Noto Serif SC Variable", "SimSun"')

// Recovery: the selects show what the Host list already says, including a list
// typed by hand (installed family names resolve to their choice).
assert.equal(selectionOf('"Inter", "Dsh CJK KaiTi"', LATIN_CHOICES), 'inter')
assert.equal(selectionOf('"Dsh CJK KaiTi", "Inter"', CJK_CHOICES), 'kaiti')
assert.equal(selectionOf('"KaiTi"', CJK_CHOICES), 'kaiti')
assert.equal(selectionOf('"Noto Serif SC Variable"', CJK_CHOICES), 'noto-serif-sc')
assert.equal(selectionOf('"Consolas"', LATIN_CHOICES), 'consolas')
assert.equal(selectionOf('"Cascadia Mono"', LATIN_CHOICES), 'cascadia-code')
assert.equal(selectionOf('"Times New Roman"', LATIN_CHOICES), 'times-new-roman')
assert.equal(selectionOf('', LATIN_CHOICES), 'default')
assert.equal(selectionOf('"Comic Sans MS"', CJK_CHOICES), 'default')
assert.ok(!LATIN_CHOICES.some((choice) => choice.id === 'georgia'), 'Georgia is not offered')

// Managed keys are exactly what the dropdowns write, so hand-typed families and
// the installed names behind a choice are never removed by a later change.
const managed = managedFamilyKeys()
for (const key of [
  'inter',
  'source serif 4',
  'times new roman',
  'consolas',
  'cascadia code',
  'cascadia mono',
  'noto serif sc variable',
  'noto sans sc variable',
  'dsh cjk kaiti',
]) {
  assert.ok(managed.has(key), `${key} must be managed`)
}
assert.ok(!managed.has('kaiti'), 'the installed name alone is not ours')
assert.ok(!managed.has('comic sans ms'))

// Families written by earlier catalog versions are cleaned up on the next
// change: every synthetic face carried the `Dsh CJK ` prefix.
assert.equal(isManagedFamily('Dsh CJK SimSun'), true)
assert.equal(isManagedFamily('Dsh CJK PingFang SC'), true)
assert.equal(isManagedFamily('SimSun'), false)
assert.equal(isManagedFamily('Comic Sans MS'), false)
assert.equal(
  composeTextFonts('"Dsh CJK PingFang SC", "Georgia", "Inter"', 'default', 'default'),
  '"Georgia"',
  'legacy plugin families go, a user family stays',
)

// System CJK faces: local() only, CJK-only, one weight, one rule per choice.
const face = cjkFontFaceCss()
assert.match(face, /font-family:"Dsh CJK KaiTi"/u)
assert.match(face, /local\("KaiTi"\)/u)
assert.match(face, /unicode-range:[^;}]*U\+4E00-9FFF/u)
assert.doesNotMatch(face, /unicode-range:[^;}]*U\+0041/u, 'CJK faces must not claim Latin')
assert.doesNotMatch(face, /font-weight:7/u, 'declaring bold would silently drop it')
assert.equal(face.split('@font-face').length - 1, 2, 'KaiTi and FangSong only')

console.log(
  'client.js guards OK (%d latin / %d cjk choices, %d embedded latin faces, %d CJK slices)',
  LATIN_CHOICES.length,
  CJK_CHOICES.length,
  embedded.length,
  placeholders.length,
)
