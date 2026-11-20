/**
 * Chinese serif for DeepSeek Harness.
 *
 * The plugin contributes one font family, `Dsh CJK Serif`: an @font-face whose
 * local() sources resolve to the first installed Chinese serif family and whose
 * unicode-range covers CJK only, so Latin text and code never hit it.
 *
 * It declares no CSS override. The settings row edits the Host's own text font
 * list — the same value as Settings → Fonts → Text font — by prepending or
 * removing this family, so a serif face for Chinese is a font choice the user
 * makes, and every other font setting (or font plugin) keeps owning the result.
 */
window.__ModuleLoader__.load({
  id: 'dsh-cjk-serif',
  factory(require) {
    const React = require('react')

    const NS = 'dsh-cjk-serif'
    const STYLE_ID = 'dsh-cjk-serif'

    // --- [font list editing] pure helpers, also read by tests/font-list.test.mjs ---
    /** The family this plugin contributes to the text font list. */
    const FONT_FAMILY = 'Dsh CJK Serif'
    /** Case-insensitive CSS family key used to find the family in a list. */
    const FAMILY_KEY = FONT_FAMILY.toLowerCase()

    /**
     * Split a CSS font-family list on commas that are not inside quotes.
     * @param {string} value - comma-separated family list.
     * @returns {string[]} raw entries, trimmed, without empty items.
     */
    function splitFamilies(value) {
      const entries = []
      let current = ''
      let quote = ''
      for (const char of value) {
        if (quote !== '') {
          current += char
          if (char === quote) quote = ''
          continue
        }
        if (char === '"' || char === "'") {
          quote = char
          current += char
          continue
        }
        if (char === ',') {
          entries.push(current)
          current = ''
          continue
        }
        current += char
      }
      entries.push(current)
      return entries.map((entry) => entry.trim()).filter((entry) => entry !== '')
    }

    /**
     * Family name of one raw list entry, without its surrounding quotes.
     * @param {string} entry - one trimmed list entry.
     * @returns {string} unquoted family name.
     */
    function familyNameOf(entry) {
      const first = entry[0]
      if ((first === '"' || first === "'") && entry[entry.length - 1] === first) {
        return entry.slice(1, -1).replace(/\\(["'])/gu, '$1')
      }
      return entry
    }

    /**
     * Whether the text font list already contains this family.
     * @param {string} value - CSS font-family list.
     * @returns {boolean} true when present, compared case-insensitively.
     */
    function hasFamily(value) {
      return splitFamilies(value).some((entry) => familyNameOf(entry).toLowerCase() === FAMILY_KEY)
    }

    /**
     * Put this family first in the list, dropping any other spelling of it.
     * The family's unicode-range is CJK-only, so Latin text still falls through
     * to the families after it.
     * @param {string} value - current CSS font-family list.
     * @returns {string} list with this family first.
     */
    function addFamily(value) {
      const rest = splitFamilies(value).filter((entry) => familyNameOf(entry).toLowerCase() !== FAMILY_KEY)
      return ['"' + FONT_FAMILY + '"'].concat(rest).join(', ')
    }

    /**
     * Remove this family from the list, leaving every other entry untouched.
     * @param {string} value - current CSS font-family list.
     * @returns {string} list without this family; `''` restores the built-in stack.
     */
    function removeFamily(value) {
      return splitFamilies(value)
        .filter((entry) => familyNameOf(entry).toLowerCase() !== FAMILY_KEY)
        .join(', ')
    }
    // --- [/font list editing] ---

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
      '@font-face{font-family:"' +
      FONT_FAMILY +
      '";font-style:normal;font-weight:400;' +
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
        '把「Dsh CJK Serif」加入文本字体，中文即用衬线；西文与代码保持原样。需要系统已安装中文衬线字体。' +
        '该开关修改的就是「字体 → 文本字体」设置，随时可以在那里改回。',
    }
    const en = {
      title: 'Chinese serif text',
      description:
        'Adds "Dsh CJK Serif" to your text font list so Chinese text uses a serif face, ' +
        'while Latin text and code stay as they are. Requires an installed Chinese serif font. ' +
        'This writes the same setting as Fonts → Text font.',
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

    /**
     * Follow the Host's text font list; it is the single source of truth, so a
     * change made in Settings → Fonts is reflected here and the other way round.
     * @param {object} ctx - client plugin context with the theme service.
     * @returns {string} the normalized text font list.
     */
    function useTextFonts(ctx) {
      const [fonts, setFonts] = React.useState(() => ctx.theme.getTheme().fontFamilies.text)
      React.useEffect(() => {
        setFonts(ctx.theme.getTheme().fontFamilies.text)
        return ctx.on('theme/change', (snapshot) => {
          setFonts(snapshot.fontFamilies.text)
        })
      }, [ctx])
      return fonts
    }

    function SerifRow({ ctx, t }) {
      const fonts = useTextFonts(ctx)
      const on = hasFamily(fonts)
      const label = t('title')
      const toggle = (next) => {
        try {
          ctx.theme.setFontFamily('text', next ? addFamily(fonts) : removeFamily(fonts))
        } catch (error) {
          console.error('[dsh-cjk-serif] text font update failed', error)
        }
      }
      return React.createElement(
        'div',
        { className: 'dsh-cjk-serif-row' },
        React.createElement(
          'div',
          null,
          React.createElement('div', { className: 'dsh-cjk-serif-title' }, label),
          React.createElement('div', { className: 'dsh-cjk-serif-desc' }, t('description')),
        ),
        React.createElement(Switch, { checked: on, label, onChange: toggle }),
      )
    }

    return {
      inject: ['slots', 'locale', 'theme'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-cjk-serif: dictionaries')

        // Only a font declaration: nothing is overridden, and the family stays
        // available for the Host's own font settings while the plugin is active.
        ctx.effect(() => {
          const style = document.createElement('style')
          style.id = STYLE_ID
          style.dataset.plugin = NS
          style.textContent = FONT_FACE + '\n' + UI_STYLES
          document.head.appendChild(style)
          return () => {
            style.remove()
          }
        }, 'dsh-cjk-serif: font face')

        // The row edits the Host's font-family setting through the theme
        // service; without that face (an older DSH) the family is still usable
        // by typing its name in Settings → Fonts → Text font.
        if (typeof ctx.theme.setFontFamily !== 'function' || typeof ctx.theme.getTheme !== 'function') {
          console.warn('[dsh-cjk-serif] the theme service has no font-family API; type the family name manually')
          return
        }
        ctx.slots.inject('settings.general.item', () =>
          ctx.slots.register(
            { name: 'settings.general.item', id: 'dsh-cjk-serif', order: 12, locale: NS },
            (props) => React.createElement(SerifRow, { ctx, t: props.t }),
          ),
        )
      },
    }
  },
})
