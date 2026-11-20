/**
 * Chinese serif for DeepSeek Harness — one global switch.
 *
 * Chinese text usually ends up on a sans fallback because Western text fonts
 * rarely include CJK glyphs. This module declares a CJK-only font face that
 * resolves to the first installed Chinese serif family and prepends it to the
 * font-family custom properties the running page actually uses, so Chinese
 * text picks up a serif face while Latin text and code keep the theme look.
 *
 * The face is declared with a unicode-range covering CJK only. Font custom
 * properties are read from the live computed style of the document, and a
 * value is rewritten only when it is a plain font-family list, so font size,
 * weight, line-height, and shorthand tokens are never touched.
 *
 * The switch is registered into `settings.general.item` and applies globally;
 * the preference survives reloads in localStorage.
 */
window.__ModuleLoader__.load({
  id: 'dsh-cjk-serif',
  factory(require) {
    const React = require('react')

    const NS = 'dsh-cjk-serif'
    const ENABLED_KEY = 'dsh-cjk-serif:enabled:v1'
    const LEGACY_ENABLED_KEY = 'dsh-cjk-serif:enabled'
    const LEGACY_REGIONS_KEY = 'dsh-cjk-serif:regions'
    const ATTRIBUTE = 'data-dsh-cjk-serif'
    const STYLE_ID = 'dsh-cjk-serif'

    const FACE = '"Dsh CJK Serif"'

    const CRANGE = [
      'U+2E80-2EFF',
      'U+2F00-2FDF',
      'U+3000-303F',
      'U+3040-30FF',
      'U+3100-312F',
      'U+31A0-31BF',
      'U+31C0-31EF',
      'U+3200-33FF',
      'U+3400-4DBF',
      'U+4E00-9FFF',
      'U+A960-A97F',
      'U+F900-FAFF',
      'U+FE10-FE1F',
      'U+FE30-FE4F',
      'U+FF00-FFEF',
      'U+1B000-1B16F',
      'U+20000-2FA1F',
    ].join(',')

    // One weight only: a local() source always resolves to the family's regular
    // face, so declaring a 700 face would silently drop bold. With only 400
    // declared the browser synthesizes bold instead.
    const FONT_FACE =
      '@font-face{font-family:' +
      FACE +
      ';font-style:normal;font-weight:400;' +
      // Family and PostScript names only: Chrome resolves local() against
      // installed family/PostScript names, not "Family Regular" spellings.
      'src:local("Noto Serif CJK SC"),local("NotoSerifCJKsc-Regular"),' +
      'local("Noto Serif CJK TC"),local("NotoSerifCJKtc-Regular"),' +
      'local("Noto Serif CJK JP"),local("NotoSerifCJKjp-Regular"),' +
      'local("Source Han Serif SC"),local("SourceHanSerifSC-Regular"),' +
      'local("Source Han Serif TC"),local("SourceHanSerifTC-Regular"),' +
      'local("Source Han Serif JP"),local("SourceHanSerifJP-Regular"),' +
      'local("Noto Serif SC"),local("NotoSerifSC-Regular"),' +
      'local("Noto Serif TC"),' +
      'local("Songti SC"),local("STSong"),' +
      'local("SimSun"),local("NSimSun");unicode-range:' +
      CRANGE +
      '}'

    // Settings row chrome copied from the host's General-section rows, plus the
    // host switch appearance. Classes stay under this plugin's prefix.
    const UI_STYLES = [
      '.dsh-cjk-serif-row{border-bottom:.5px solid var(--dsw-alias-border-l2);' +
        'justify-content:space-between;align-items:center;gap:24px;padding:16px 0;display:flex}',
      '.dsh-cjk-serif-title{font-size:14px;line-height:20px}',
      '.dsh-cjk-serif-desc{color:var(--dsw-alias-label-secondary);margin-top:4px;font-size:12px;line-height:18px}',
      '.dsh-cjk-serif-switch{box-sizing:border-box;position:relative;flex:0 0 auto;width:36px;height:20px;' +
        'padding:2px;border:0;border-radius:999px;corner-shape:round;' +
        'background:var(--dsw-alias-border-l3);cursor:pointer}',
      '.dsh-cjk-serif-switch[aria-checked=true]{background:var(--dsw-alias-brand-primary)}',
      '.dsh-cjk-serif-switch:disabled{cursor:default;opacity:.5}',
      '.dsh-cjk-serif-switch:focus-visible{outline:var(--dsw-focus-ring-width) solid ' +
        'var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));outline-offset:2px}',
      '.dsh-cjk-serif-thumb{display:block;width:16px;height:16px;border-radius:50%;corner-shape:round;' +
        'background:var(--dsw-alias-label-primary-foreground);transition:transform .12s ease}',
      '.dsh-cjk-serif-switch[aria-checked=false] .dsh-cjk-serif-thumb{background:var(--dsw-alias-switch-thumb)}',
      '.dsh-cjk-serif-switch[aria-checked=true] .dsh-cjk-serif-thumb{transform:translate(16px)}',
    ].join('\n')

    const zh = {
      title: '中文衬线字体',
      description:
        '开启后界面与会话中的中文使用衬线字体，西文保持原有字体，代码保持等宽。全局生效。',
    }
    const en = {
      title: 'Chinese serif text',
      description:
        'When on, Chinese text in the interface and conversation uses a serif face. ' +
        'Latin text keeps the page\u2019s font and code stays monospaced. Applies everywhere.',
    }

    // --- [font-variable filtering] pure helpers, also read by tests/variable-filter.test.mjs ---
    // Custom properties we are willing to edit: font stacks, but never code.
    const VAR_NAME = /(font|serif|prose)/i
    const VAR_SKIP = /(code|mono|terminal)/i

    // A bare family name: letters, digits, spaces, underscores, and hyphens,
    // not starting with a digit (so `14px`, `400`, and `1.5rem` are rejected).
    const BARE_FAMILY = /^-?[A-Za-z_][A-Za-z0-9 _-]*$/u
    const QUOTED_FAMILY = /^(['"]).*\1$/u
    // Font shorthand keywords and CSS-wide keywords that are not family names.
    const RESERVED_WORD =
      /^(?:normal|italic|oblique|small-caps|bold|bolder|lighter|inherit|initial|unset|revert|revert-layer|ultra-condensed|extra-condensed|condensed|semi-condensed|semi-expanded|expanded|extra-expanded|ultra-expanded)$/iu
    // Anything that marks a size, weight, shorthand, function, or injection.
    const NOT_FAMILY = /[\\;{}!]|var\(|calc\(|env\(|\//iu

    /**
     * Whether a custom-property value is a plain CSS font-family list.
     * @param {string} value - computed value of a custom property.
     * @returns {boolean} true only for comma-separated family names.
     */
    function isFontFamilyList(value) {
      if (typeof value !== 'string' || value.length === 0 || value.length > 320) return false
      if (NOT_FAMILY.test(value)) return false
      for (const part of value.split(',')) {
        const name = part.trim()
        if (name === '') return false
        if (QUOTED_FAMILY.test(name)) continue
        if (!BARE_FAMILY.test(name)) return false
        if (RESERVED_WORD.test(name)) return false
      }
      return true
    }
    // --- [/font-variable filtering] ---

    function readEnabled() {
      try {
        const stored = localStorage.getItem(ENABLED_KEY)
        if (stored !== null) return stored !== '0'
        const legacy = localStorage.getItem(LEGACY_ENABLED_KEY)
        return legacy === null ? true : legacy !== '0'
      } catch {
        return true
      }
    }

    function writeEnabled(on) {
      try {
        localStorage.setItem(ENABLED_KEY, on ? '1' : '0')
        localStorage.removeItem(LEGACY_ENABLED_KEY)
        localStorage.removeItem(LEGACY_REGIONS_KEY)
      } catch {
        /* storage can be unavailable; the switch still works for this page */
      }
    }

    let styleEl = null

    function ensureStyle() {
      if (styleEl && styleEl.isConnected) return styleEl
      styleEl = document.getElementById(STYLE_ID)
      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = STYLE_ID
        document.head.appendChild(styleEl)
      }
      // Own the node the way the client module system tags materialized styles,
      // so entry eviction and this plugin's cleanup remove the same element.
      try {
        styleEl.dataset.plugin = NS
      } catch {
        /* a non-HTMLElement style node still works; only the marker is lost */
      }
      return styleEl
    }

    /**
     * Read the font-family custom properties the page currently uses.
     * Callers clear this plugin's own overrides first, so the values are the
     * page's own; non-family values are filtered out by {@link isFontFamilyList}.
     */
    function readFontVars() {
      const seen = new Set()
      const found = []
      for (const el of [document.body, document.documentElement]) {
        if (!el) continue
        let computed
        try {
          computed = window.getComputedStyle(el)
        } catch {
          continue
        }
        for (let i = 0; i < computed.length; i += 1) {
          const name = computed.item(i)
          if (!name || name.slice(0, 2) !== '--') continue
          if (seen.has(name)) continue
          if (!VAR_NAME.test(name) || VAR_SKIP.test(name)) continue
          const value = computed.getPropertyValue(name).trim()
          if (!isFontFamilyList(value)) continue
          seen.add(name)
          found.push([name, value])
        }
      }
      return found
    }

    function buildCSS(vars) {
      const parts = [FONT_FACE]
      if (vars.length > 0) {
        let declarations = ''
        for (const [name, value] of vars) {
          declarations += name + ':' + FACE + ', ' + value + ' !important;'
        }
        parts.push('html[' + ATTRIBUTE + '=on] body{' + declarations + '}')
      }
      parts.push(UI_STYLES)
      return parts.join('\n')
    }

    function refreshFonts() {
      if (typeof document === 'undefined' || !document.body) return
      if (!document.documentElement.hasAttribute(ATTRIBUTE)) return
      const style = ensureStyle()
      // Drop this plugin's declarations before reading, so the values always
      // come from the page and repeated refreshes cannot stack the face.
      style.textContent = FONT_FACE
      style.textContent = buildCSS(readFontVars())
    }

    function apply(on) {
      if (typeof document === 'undefined') return
      const root = document.documentElement
      if (on) {
        root.setAttribute(ATTRIBUTE, 'on')
        refreshFonts()
      } else {
        root.removeAttribute(ATTRIBUTE)
      }
    }

    let enabled = readEnabled()
    const listeners = new Set()

    function subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    }

    function getEnabled() {
      return enabled
    }

    function setEnabled(next) {
      const value = next === true
      if (value === enabled) return
      enabled = value
      writeEnabled(value)
      apply(value)
      for (const listener of listeners) listener()
    }

    // Host switch appearance and semantics (button[role=switch] + thumb), kept
    // local so this bundle never imports a Harness Client package.
    function Switch({ checked, label, onChange }) {
      return React.createElement(
        'button',
        {
          type: 'button',
          role: 'switch',
          'aria-checked': checked,
          'aria-label': label,
          className: 'dsh-cjk-serif-switch',
          onClick: () => onChange(!checked),
        },
        React.createElement('span', { className: 'dsh-cjk-serif-thumb', 'aria-hidden': 'true' }),
      )
    }

    function SerifRow({ t }) {
      const on = React.useSyncExternalStore(subscribe, getEnabled)
      return React.createElement(
        'div',
        { className: 'dsh-cjk-serif-row' },
        React.createElement(
          'div',
          null,
          React.createElement('div', { className: 'dsh-cjk-serif-title' }, t('title')),
          React.createElement('div', { className: 'dsh-cjk-serif-desc' }, t('description')),
        ),
        React.createElement(Switch, { checked: on, label: t('title'), onChange: setEnabled }),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-cjk-serif: dictionaries')

        // The override belongs to the plugin, not to the settings row: the row
        // unmounts whenever Settings closes, while the font must stay applied.
        ctx.effect(() => {
          apply(enabled)
          let scheduled
          const schedule = (records) => {
            // This plugin's own root attribute does not change any font stack.
            if (records && records.every((record) => record.attributeName === ATTRIBUTE)) return
            clearTimeout(scheduled)
            scheduled = setTimeout(refreshFonts, 120)
          }
          const observer =
            typeof MutationObserver !== 'undefined' && document.body
              ? new MutationObserver(schedule)
              : undefined
          if (observer) {
            observer.observe(document.body, { attributes: true })
            observer.observe(document.documentElement, { attributes: true })
          }
          return () => {
            clearTimeout(scheduled)
            observer?.disconnect()
            apply(false)
            styleEl?.remove()
            styleEl = null
          }
        }, 'dsh-cjk-serif: font override')

        ctx.slots.inject('settings.general.item', () =>
          ctx.slots.register(
            { name: 'settings.general.item', id: 'dsh-cjk-serif', order: 12, locale: NS },
            SerifRow,
          ),
        )
      },
    }
  },
})
