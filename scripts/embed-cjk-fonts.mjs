/**
 * Fetch the bundled Chinese faces (Noto Serif SC, Noto Sans SC) and inline their
 * @font-face sheet into client.js.
 *
 * Both packages are chunked the way Google Fonts ships them: one WOFF2 per
 * unicode-range slice (101 per family), so a page only downloads the slices its
 * characters need. That is why the files are not inlined: they total ~10 MiB.
 * The host half (index.js) serves them under `/dsh-cjk-serif/fonts/`, and this
 * script writes each rule's url() with a `__FONT_BASE__` placeholder that the
 * client resolves against the document base at run time.
 *
 *   node scripts/embed-cjk-fonts.mjs          # fetch (cached), write fonts/cjk and client.js
 *   node scripts/embed-cjk-fonts.mjs --check  # fail when client.js is out of date
 *
 * Both families are SIL Open Font License 1.1; their license texts are copied
 * next to the files.
 */
import { gunzipSync } from 'node:zlib'
import { mkdirSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const outDir = join(root, 'fonts', 'cjk')
const cacheDir = join(root, '.font-cache')
const clientPath = join(root, 'client.js')

const SOURCES = [
  {
    pkg: '@fontsource-variable/noto-serif-sc',
    version: '5.3.1',
    tarName: 'noto-serif-sc',
    outName: 'NotoSerifSC',
    license: 'package/LICENSE',
  },
  {
    pkg: '@fontsource-variable/noto-sans-sc',
    version: '5.3.1',
    tarName: 'noto-sans-sc',
    outName: 'NotoSansSC',
    license: 'package/LICENSE',
  },
]

const MARK_START = '// --- [cjk font css] ---'
const MARK_END = '// --- [/cjk font css] ---'
const BASE_TOKEN = '__FONT_BASE__'
const FILES_RE = /url\(\.\/files\/([^)]+)\)/gu

/**
 * Read the entries of a tar archive held in memory.
 * @param {Buffer} buffer - uncompressed tar bytes.
 * @returns {Map<string, Buffer>} path to file contents.
 */
function readTar(buffer) {
  const files = new Map()
  let offset = 0
  while (offset + 512 <= buffer.length) {
    const header = buffer.subarray(offset, offset + 512)
    if (header[0] === 0) break
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/u, '')
    const prefix = header.subarray(345, 500).toString('utf8').replace(/\0.*$/u, '')
    const size = Number.parseInt(header.subarray(124, 136).toString('utf8').replace(/\0.*$/u, '').trim(), 8) || 0
    offset += 512
    files.set(prefix === '' ? name : `${prefix}/${name}`, buffer.subarray(offset, offset + size))
    offset += Math.ceil(size / 512) * 512
  }
  return files
}

/**
 * Download one package tarball, reusing the cache directory.
 * @param {{pkg: string, version: string, tarName: string}} source - package coordinates.
 * @returns {Promise<Map<string, Buffer>>} archive contents.
 */
async function fetchPackage(source) {
  mkdirSync(cacheDir, { recursive: true })
  const cached = join(cacheDir, `${source.tarName}-${source.version}.tgz`)
  if (!existsSync(cached)) {
    const url = `https://registry.npmmirror.com/${source.pkg}/-/${source.tarName}-${source.version}.tgz`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`${url} answered ${response.status}`)
    writeFileSync(cached, Buffer.from(await response.arrayBuffer()))
    console.log(`downloaded ${source.pkg}@${source.version}`)
  }
  return readTar(gunzipSync(readFileSync(cached)))
}

/**
 * Turn one package's sheet into plugin CSS and write its slices to fonts/cjk.
 * @param {Map<string, Buffer>} archive - package contents.
 * @param {object} source - entry from SOURCES.
 * @returns {string} minified CSS with placeholder URLs.
 */
function buildSheet(archive, source) {
  const raw = archive.get('package/index.css')
  if (raw === undefined) throw new Error(`${source.pkg} ships no package/index.css`)
  const css = raw.toString('utf8')
  const names = new Set()
  for (const match of css.matchAll(FILES_RE)) names.add(match[1])
  if (names.size === 0) throw new Error(`${source.pkg} sheet references no font files`)
  for (const name of names) {
    const bytes = archive.get(`package/files/${name}`)
    if (bytes === undefined) throw new Error(`package/files/${name} is missing from ${source.pkg}`)
    writeFileSync(join(outDir, name), bytes)
  }
  console.log(`  ${source.outName}: ${names.size} slices`)
  return css
    .replace(/\/\*[\s\S]*?\*\//gu, '')
    .replace(FILES_RE, `url("${BASE_TOKEN}$1")`)
    // The legacy variable-font keyword is not needed once the container is woff2.
    .replace(/format\('woff2-variations'\)/gu, "format('woff2')")
    .replace(/\s+/gu, ' ')
    .trim()
}

mkdirSync(outDir, { recursive: true })
for (const stale of readdirSync(outDir)) rmSync(join(outDir, stale), { force: true })

const sheets = []
for (const source of SOURCES) {
  const archive = await fetchPackage(source)
  sheets.push(buildSheet(archive, source))
  const license = archive.get(source.license)
  if (license !== undefined) writeFileSync(join(outDir, `LICENSE-${source.outName}.txt`), license)
}

const css = sheets.join(' ')
const literal = JSON.stringify(css)
const block = `${MARK_START}
    // Generated by scripts/embed-cjk-fonts.mjs from @fontsource-variable (OFL-1.1). Do not edit.
    const CJK_FONT_CSS = ${literal}
    ${MARK_END}`

const client = readFileSync(clientPath, 'utf8')
const start = client.indexOf(MARK_START)
const end = client.indexOf(MARK_END)
if (start < 0 || end < start) throw new Error('cjk font css markers not found in client.js')
const updated = client.slice(0, start) + block + client.slice(end + MARK_END.length)

if (process.argv.includes('--check')) {
  if (updated !== client) {
    console.error('client.js is out of date; run: node scripts/embed-cjk-fonts.mjs')
    process.exit(1)
  }
  console.log('client.js cjk sheet is up to date')
} else if (updated !== client) {
  writeFileSync(clientPath, updated)
  console.log(`client.js updated (${updated.length} bytes)`)
} else {
  console.log('client.js cjk sheet already up to date')
}
