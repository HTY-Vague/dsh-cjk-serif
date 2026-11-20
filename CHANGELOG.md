# Changelog

Notable changes to this plugin, following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and semantic versioning.

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
