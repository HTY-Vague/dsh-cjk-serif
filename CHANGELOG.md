# Changelog

Notable changes to this plugin, following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and semantic versioning.

## 4.0.3 — 2026-11-20

### Changed

- Microsoft YaHei is no longer offered: on Windows it is the system's own Chinese
  fallback, so choosing it was indistinguishable from 跟随默认. The Chinese list is
  now Host default, Noto Serif SC, Noto Sans SC, KaiTi, FangSong.

## 4.0.2 — 2026-11-20

### Fixed

- The bundled Chinese slices were unreachable, so 思源宋体 silently fell back to
  the system face and looked identical to 跟随默认. The host route registered its
  prefix with a trailing slash (`/dsh-cjk-serif/fonts/`), while the webserver
  matches `pathname === prefix` or `pathname.startsWith(prefix + '/')`; every
  slice request therefore fell through to the SPA 404. It now registers
  `/dsh-cjk-serif/fonts` and keeps the slash only when slicing the file name.
- A text list written by an earlier release kept its `Dsh CJK …` synthetic
  families; the next change drops every `Dsh CJK ` entry, not just the ones the
  current catalog still offers.

### Notes

- The host half changed, so one DSH restart is required for the route to come
  back with the corrected prefix.

## 4.0.1 — 2026-11-20

### Changed

- Georgia is no longer offered in the Latin list.
- Dropdown options show only the font name: the `(bundled)` / `(serif)` /
  `(monospace)` annotations and the Chinese row's bundle note are gone, leaving
  Host default, Inter, Source Serif 4, Times New Roman, Consolas, Cascadia Code
  and 思源宋体 / 思源黑体 / 楷体 / 仿宋 / 微软雅黑.

## 4.0.0 — 2026-11-20

### Added

- Bundled Chinese faces: Noto Serif SC and Noto Sans SC (SIL OFL 1.1), shipped as
  the 101 unicode-range slices the font distribution publishes, so a page only
  downloads the slices its characters need.
- A host half (`index.js`) that serves those slices from `fonts/cjk/` under
  `/dsh-cjk-serif/fonts/`: read-only, whitelisted `.woff2` names, immutable
  cache headers, `HEAD` and 304 revalidation.
- `scripts/embed-cjk-fonts.mjs` to fetch the sheets and slices and rewrite the
  `[cjk font css]` block, with `--check`; `tests/font-route.test.mjs` covering
  the route (slice, 304, `HEAD`, 404, traversal, 405).

### Changed

- The Chinese list is deduplicated to the distinct styles the plugin can carry:
  Host default, Noto Serif SC (bundled), Noto Sans SC (bundled), KaiTi, FangSong,
  Microsoft YaHei. SimSun, SimHei, PingFang SC, Songti SC and the automatic
  serif chain were removed as duplicates of those styles, or as macOS-only faces
  that cannot be redistributed.
- The `(not installed)` labels are gone: the canvas width probe marked installed
  Windows families as missing, so the rows now list names only.

### Notes

- The host route registers when the bundle activates, so a DSH restart is
  required once after upgrading from 3.x.
- `fonts/cjk/` adds ~10 MiB to the package; the browser downloads slices on
  demand and caches them for a year.

## 3.1.1 — 2026-11-20

### Fixed

- The dropdown options were invisible until hovered: the closed control
  inherited the row's text colour while a native select paints its popup on a
  platform surface, leaving light text on white. The control and every option
  now carry explicit theme colours, and the popup follows the dark theme
  (`color-scheme` keyed on `data-ds-dark-theme`).

## 3.1.0 — 2026-11-20

### Added

- Latin choices Times New Roman, Georgia, Consolas and Cascadia Code (with
  Cascadia Mono as its fallback), so the text role can use the system serif and
  monospace faces without typing family names.
- A catalog guard: one family may belong to only one choice, so an existing
  font list always maps back to a single option.

### Changed

- The former System serif choice declares Georgia alone now; Times New Roman
  became its own option instead of being folded into that choice.

## 3.0.0 — 2026-11-20

### Added

- Two dropdowns in Settings → General: the Latin font and the Chinese font are
  chosen separately instead of the single serif switch.
- Bundled Latin faces: Inter (sans) and Source Serif 4 (serif), latin variable
  subsets with normal and italic, inlined into `client.js` as WOFF2 data URLs
  (SIL OFL 1.1; sources and license texts stay in `fonts/`).
- Chinese choices as CJK-only faces: Noto Serif SC, Noto Sans SC, SimSun,
  SimHei, KaiTi, FangSong, Microsoft YaHei, PingFang SC, Songti SC, plus the
  automatic installed-serif chain from 2.0 (`Dsh CJK Serif`).
- Availability detection: a Chinese choice whose font is not installed is
  marked in the dropdown, so an empty result is explained instead of silent.
- `scripts/embed-fonts.mjs` to fetch the latin subsets and rewrite the
  `[font binaries]` block, with a `--check` mode for CI.

### Changed

- The two choices compose the Host text font list as `Latin, Chinese, …rest`:
  only the families the dropdowns write are replaced, every other entry the
  user or another plugin added is kept verbatim.
- Bundled faces declare `font-display: swap` and a Latin `unicode-range`;
  Chinese faces stay `local()`-only with a single 400 weight.
- The catalog, composition, and recovery helpers moved into one tested block;
  the row labels are localized zh/en.

### Removed

- The single switch and its `Dsh CJK Serif`-only model; the family is still
  available as the automatic Chinese choice, so a list written by 2.0 keeps
  resolving to the same typeface.

## 2.0.0 — 2026-11-20

### Breaking

- The plugin no longer overrides CSS font variables. It contributes the
  `Dsh CJK Serif` family and its switch writes the Host's own text-font setting
  through `ctx.theme.setFontFamily('text', …)`; disabling removes only that one
  entry and leaves the rest of the list alone.
- The switch is off by default: installing the plugin changes nothing until the
  family is added to the text font list. Users who relied on the implicit
  override must turn it on once.
- `localStorage` keys (`dsh-cjk-serif:enabled*`, `dsh-cjk-serif:regions`) are no
  longer read or written.

### Fixed

- Font conflicts with other plugins and with the user's own font choice: the
  Host font setting is the single source of truth, so there is no
  `!important`/specificity/insertion-order race any more.
- The family is declared whenever the plugin is active, including while the
  switch is off, so it can be chosen manually under Settings → Fonts.

### Removed

- The CSS-variable rewriting, the computed-style scan, the `!important`
  declarations, the `MutationObserver`, and the `data-dsh-cjk-serif` root
  attribute.

### Added

- Font-list editing helpers with tests (`split` / `has` / `add` / `remove`) that
  preserve other families verbatim, including quoted names containing commas.
- `@deepseek-ai/dsh-client-ui-theme` in `dsh.client.inject`.
- A bilingual README explaining the cooperative model.

## 1.4.0 — 2026-11-20

### Breaking

- Per-region controls were removed. The plugin is a single global switch now, and
  stored region preferences (`dsh-cjk-serif:regions`) are discarded.

### Changed

- The settings row registers at `order: 12`, directly after the theme's font rows.
- The font face and its override are owned by the plugin, so closing Settings no
  longer reverts Chinese text to the theme's sans fallback.

### Fixed

- Font custom properties are only rewritten when their value is a plain
  font-family list. Font sizes, weights, styles, line heights, deltas, and
  shorthand tokens (`--dsh-content-font-size`, `--dsw-font-s-14`, …) stay intact.
- Refreshes clear the plugin's own declarations before reading, so the face is
  never stacked onto an already-prefixed value.

### Removed

- The `@deepseek-ai/dsh-client-ui-primitives` import: the switch is inlined with the
  host's markup, CSS, and `role="switch"` semantics (dsh-doc authoring rule).
- Per-region DOM writes, slot-tree scans, and `[data-slot]` attribute mutation.
- The unused `assets/icon.png` and its `files` entry.

### Added

- `engines.dsh`, a `react` peer dependency, and `@deepseek-ai/dsh-client-ui-settings-general`
  in `dsh.client.inject`, so installers and the plugin market can check compatibility.
- Versioned preference keys with migration from `dsh-cjk-serif:enabled`.
- A regression test pinning the host typography tokens the filter must leave alone.
- A bilingual README and accurate locale metadata.

## 1.3.0 — 2026-11-20

- Previous release: global switch plus coarse per-region controls.
