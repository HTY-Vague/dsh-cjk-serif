# Changelog

Notable changes to this plugin, following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and semantic versioning.

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
