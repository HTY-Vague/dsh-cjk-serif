/**
 * Chinese serif for DeepSeek Harness.
 *
 * Chinese text usually ends up on a sans fallback because Western text fonts
 * rarely include CJK glyphs. This module declares a CJK-only font face that
 * resolves to the first installed Chinese serif family and puts it ahead of
 * whatever font stacks the running page uses: globally, and per detected UI
 * region.
 *
 * Instead of assuming a particular theme's variable names, it reads the font
 * related CSS custom properties from the live computed style of <body> and
 * prepends the CJK face to each value. Any theme that drives its fonts through
 * custom properties is covered, and switching the theme or its typeface just
 * triggers another read.
 *
 * The face is declared with a unicode-range covering CJK only, so Latin text
 * keeps whatever appearance the page gives it, and properties whose names look
 * like code fonts are left untouched so code stays monospaced.
 *
 * Regions are discovered from the live slot registry (ctx.slots.snapshot())
 * and grouped into a few coarse areas, so panels added by other plugins show up
 * automatically. Rows for areas containing third-party widgets carry a small
 * provenance hint rendered in a sans face, per request.
 */
window.__ModuleLoader__.load({
  id: 'dsh-cjk-serif',
  factory(require) {
    const React = require('react')
    const { Switch } = require('@deepseek-ai/dsh-client-ui-primitives')

    const NS = 'dsh-cjk-serif'
    const STORAGE_KEY = 'dsh-cjk-serif:enabled'
    const REGIONS_KEY = 'dsh-cjk-serif:regions'
    const ATTRIBUTE = 'data-dsh-cjk-serif'
    const REGION_ATTR = 'data-cjk-region-font'
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

    // Settings rows and the collapsible region list.
    const UI_STYLES = [
      '.dsh-cjk-serif-block{display:flex;flex-direction:column}',
      '.dsh-cjk-serif-row{border-bottom:.5px solid var(--dsw-alias-border-l2);' +
        'justify-content:space-between;align-items:center;gap:24px;padding:16px 0;display:flex}',
      '.dsh-cjk-serif-title{font-size:14px;line-height:20px}',
      '.dsh-cjk-serif-desc{color:var(--dsw-alias-label-secondary);margin-top:4px;font-size:12px;line-height:18px}',
      // Provenance hint: deliberately rendered in a sans face at 0.9em, per request.
      '.dsh-cjk-serif-src{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif!important;' +
        'color:var(--dsw-alias-label-secondary);font-size:.9em;font-weight:400;margin-left:8px;white-space:nowrap}',
      '.dsh-cjk-serif-regions{margin:0}',
      '.dsh-cjk-serif-regions>summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:6px;' +
        'padding:12px 0;font-size:13px;line-height:18px;color:var(--dsw-alias-label-secondary);user-select:none}',
      '.dsh-cjk-serif-regions>summary::-webkit-details-marker{display:none}',
      '.dsh-cjk-serif-chev{display:inline-block;transition:transform .15s ease}',
      '.dsh-cjk-serif-regions[open] .dsh-cjk-serif-chev{transform:rotate(90deg)}',
      '.dsh-cjk-serif-hint{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;padding:0 0 8px}',
      '.dsh-cjk-serif-region .dsh-cjk-serif-title{font-size:13px;line-height:18px}',
      '.dsh-cjk-serif-empty{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;padding:4px 0 16px}',
      '.dsh-cjk-serif-block > .dsh-cjk-serif-row:last-child{border-bottom:none}',
    ].join('\n')

    const zh = {
      title: '\u4e2d\u6587\u886c\u7ebf\u5b57\u4f53',
      description:
        '\u5f00\u542f\u540e\u754c\u9762\u4e0e\u4f1a\u8bdd\u4e2d\u7684\u4e2d\u6587\u4f7f\u7528\u5b8b\u4f53' +
        '\uff0c\u897f\u6587\u4fdd\u6301\u539f\u6709\u5b57\u4f53\uff0c\u4ee3\u7801\u5757\u4fdd\u6301\u7b49\u5bbd\u3002',
      regionsTitle: '\u6309\u533a\u57df\u63a7\u5236',
      regionsHint: '已按位置归并成几个区域，其他插件添加的组件会标注来源。',
      regionsEmpty: '当前没有可识别的区域。',
      from: '来自',
      'region.sidebar': '左侧边栏',
      'region.main': '主区域',
      'region.rightbar': '右侧边栏',
      'region.other': '其他面板',
    }
    const en = {
      title: 'Chinese serif text',
      description:
        'When on, Chinese text in the interface and conversation is rendered with a serif face. ' +
        'Latin text keeps the page\u2019s font and code stays monospaced.',
      regionsTitle: 'Control by region',
      regionsHint: 'Grouped by location; widgets added by other plugins are labelled with their source.',
      regionsEmpty: 'No regions detected right now.',
      from: 'from',
      'region.sidebar': 'Left sidebar',
      'region.main': 'Main area',
      'region.rightbar': 'Right sidebar',
      'region.other': 'Other panels',
    }

    // Slots that always make sense as regions; their labels live in the locale
    // dictionaries (objects here would end up rendered as React children).
    const KNOWN = {
      sidebar: true,
      main: true,
      rightbar: true,
      'conversation.composer': true,
    }
    const LABEL_KEYS = {
      main: 'region.main',
      sidebar: 'region.sidebar',
      rightbar: 'region.rightbar',
      other: 'region.other',
    }
    const EXCLUDED = /^(root|settings\.|shell\.overlay$)/
    const MICRO = /\.(icon|label|actions|action|badge|text|button|item|row|hint|meta)$/

    // Custom properties we are willing to edit: font stacks, but not code.
    const VAR_NAME = /(font|serif|prose)/i
    const VAR_SKIP = /(code|mono|terminal)/i
    const VAR_SKIP_EXACT = /^--dsh-font-family-(text|code|terminal)$/

    function readEnabled() {
      try {
        return localStorage.getItem(STORAGE_KEY) !== '0'
      } catch {
        return true
      }
    }

    function writeEnabled(on) {
      try {
        localStorage.setItem(STORAGE_KEY, on ? '1' : '0')
      } catch {
        /* storage can be unavailable; the switch still works for this page */
      }
    }

    function readRegions() {
      try {
        const raw = JSON.parse(localStorage.getItem(REGIONS_KEY) || '{}')
        return raw && typeof raw === 'object' ? raw : {}
      } catch {
        return {}
      }
    }

    function writeRegions(value) {
      try {
        localStorage.setItem(REGIONS_KEY, JSON.stringify(value))
      } catch {
        /* ignore */
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
      return styleEl
    }

    // Read the font stacks the page currently uses. Our own overrides are
    // cleared first (the style element only holds the @font-face at that point),
    // so this always returns the page's own values.
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
          if (!VAR_NAME.test(name) || VAR_SKIP.test(name) || VAR_SKIP_EXACT.test(name)) continue
          const value = computed.getPropertyValue(name).trim()
          if (!value || /var\(/i.test(value)) continue
          seen.add(name)
          found.push([name, value])
        }
      }
      return found
    }

    function declarations(vars, withFace) {
      let out = ''
      for (const [name, value] of vars) {
        out += name + ':' + (withFace ? FACE + ', ' + value : value) + ' !important;'
      }
      return out
    }

    function buildCSS(vars) {
      const parts = [FONT_FACE]
      if (vars.length > 0) {
        const body = declarations(vars, true)
        const without = declarations(vars, false)
        parts.push('html[' + ATTRIBUTE + '=on] body{' + body + '}')
        // Region opt-in / opt-out, declared on the slot wrapper so it also wins
        // over values inherited from an outer region.
        parts.push('html[' + ATTRIBUTE + '=on] body [' + REGION_ATTR + '=serif]{' + body + '}')
        parts.push('html[' + ATTRIBUTE + '=on] body [' + REGION_ATTR + '=sans]{' + without + '}')
      }
      parts.push(UI_STYLES)
      return parts.join('\n')
    }

    function refreshFonts() {
      if (typeof document === 'undefined' || !document.body) return
      const style = ensureStyle()
      style.textContent = FONT_FACE
      const vars = readFontVars()
      style.textContent = buildCSS(vars)
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

    function flatten(tree) {
      const nodes = []
      const walk = (node, parent) => {
        nodes.push({ ...node, parent })
        for (const child of node.children || []) walk(child, node.name)
      }
      for (const node of tree || []) walk(node, undefined)
      return nodes
    }

    function ownersOf(node) {
      const names = new Set()
      for (const occupant of node.occupants || []) {
        if (!occupant.active) continue
        names.add(occupant.registrant || node.declaredBy || '(built-in)')
      }
      if (names.size === 0 && node.declaredBy) names.add(node.declaredBy)
      return [...names]
    }

    // Registrant strings look like a package name, or a longer description that
    // ends with the package in parentheses, e.g. factory "lib/client.js" (@scope/pkg).
    function packageOf(label) {
      if (!label) return undefined
      if (!label.includes(' ') && /^@?[\w.-]+(\/[\w.-]+)?$/.test(label)) return label
      const paren = /\(([^()]+)\)\s*$/.exec(label)
      if (paren) return paren[1].trim()
      const quoted = /"([^"]+)"\s*$/.exec(label)
      if (quoted) return quoted[1].trim()
      return undefined
    }

    function isThirdParty(owner) {
      if (typeof owner !== 'string' || owner.length === 0) return false
      const pkg = packageOf(owner) || owner
      return !pkg.startsWith('@deepseek-ai/') && pkg !== '(built-in)' && pkg !== 'built-in'
    }

    function rectOf(el) {
      try {
        const range = document.createRange()
        range.selectNodeContents(el)
        const rect = range.getBoundingClientRect()
        if (rect.width > 0 || rect.height > 0) return rect
      } catch {
        /* fall through */
      }
      return undefined
    }

    function unionRect(els) {
      let left = Infinity
      let top = Infinity
      let right = -Infinity
      let bottom = -Infinity
      for (const el of els) {
        const rect = rectOf(el)
        if (!rect) continue
        left = Math.min(left, rect.left)
        top = Math.min(top, rect.top)
        right = Math.max(right, rect.right)
        bottom = Math.max(bottom, rect.bottom)
      }
      if (left === Infinity) return undefined
      return { left, top, right, bottom, width: right - left, height: bottom - top }
    }

    function categoryOf(name) {
      if (/^sidebar(\.|$)/.test(name)) return 'sidebar'
      if (/^rightbar(\.|$)/.test(name)) return 'rightbar'
      if (name === 'main' || /^main\./.test(name) || /^conversation(\.|$)/.test(name)) return 'main'
      return 'other'
    }

    const CATEGORY_ORDER = ['main', 'sidebar', 'rightbar', 'other']

    function detectCategories(ctx) {
      if (typeof document === 'undefined' || typeof ctx.slots?.snapshot !== 'function') return []
      let tree
      try {
        tree = ctx.slots.snapshot()
      } catch {
        return []
      }
      const nodes = flatten(tree)
      const byName = new Map()
      for (const node of nodes) {
        if (byName.has(node.name)) continue
        if (!node.occupants || node.occupants.every((o) => !o.active)) continue
        byName.set(node.name, node)
      }

      const groups = new Map()
      for (const [name, node] of byName) {
        if (name === 'root' || EXCLUDED.test(name)) continue
        const wrappers = Array.from(document.querySelectorAll('[data-slot="' + name.replace(/"/g, '\\"') + '"]'))
        if (wrappers.length === 0) continue
        const rect = unionRect(wrappers)
        if (!rect) continue
        const known = Object.prototype.hasOwnProperty.call(KNOWN, name)
        if (rect.width < 180 || rect.height < 90) continue
        if (!known && (rect.width < 260 || rect.height < 150 || MICRO.test(name))) continue
        const key = categoryOf(name)
        const group = groups.get(key) || { key, slots: [], third: [] }
        group.slots.push(name)
        for (const owner of ownersOf(node)) {
          if (!isThirdParty(owner)) continue
          const pkg = packageOf(owner) || owner
          if (!group.third.includes(pkg)) group.third.push(pkg)
        }
        groups.set(key, group)
      }
      return CATEGORY_ORDER.filter((k) => groups.has(k)).map((k) => groups.get(k))
    }

    function setCategoryAttributes(categories, off) {
      for (const category of categories) {
        const value = off[category.key] ? 'sans' : 'serif'
        for (const name of category.slots) {
          const wrappers = document.querySelectorAll('[data-slot="' + name.replace(/"/g, '\\"') + '"]')
          for (const wrapper of wrappers) wrapper.setAttribute(REGION_ATTR, value)
        }
      }
    }

    function clearAllRegionAttributes() {
      for (const el of document.querySelectorAll('[' + REGION_ATTR + ']')) el.removeAttribute(REGION_ATTR)
    }

    function CategorySwitch({ category, enabled, off, onToggle, t }) {
      const checked = !off[category.key]
      const label = t(LABEL_KEYS[category.key])
      return React.createElement(
        'div',
        { className: 'dsh-cjk-serif-row dsh-cjk-serif-region' },
        React.createElement(
          'div',
          { className: 'dsh-cjk-serif-title' },
          label,
          category.third.length > 0
            ? React.createElement(
                'span',
                { className: 'dsh-cjk-serif-src', title: category.third.join(', ') },
                t('from') + ' ' + category.third.join(', '),
              )
            : null,
        ),
        React.createElement(Switch, {
          checked,
          disabled: !enabled,
          label,
          onChange: (next) => onToggle(category.key, !next),
        }),
      )
    }

    function SerifPanel({ ctx, t }) {
      const [enabled, setEnabled] = React.useState(readEnabled)
      const [off, setOff] = React.useState(readRegions)
      const [categories, setCategories] = React.useState(() => detectCategories(ctx))
      const stateRef = React.useRef({ enabled, off, categories })
      stateRef.current = { enabled, off, categories }

      React.useEffect(() => {
        apply(enabled)
        writeEnabled(enabled)
        setCategoryAttributes(stateRef.current.categories, off)
        return () => clearAllRegionAttributes()
      }, [enabled])

      React.useEffect(() => {
        writeRegions(off)
        setCategoryAttributes(stateRef.current.categories, off)
      }, [off])

      React.useEffect(() => {
        let timer
        let disposed = false
        const refresh = () => {
          if (disposed) return
          const next = detectCategories(ctx)
          setCategories((prev) => {
            const same =
              prev.length === next.length &&
              prev.every(
                (c, i) =>
                  c.key === next[i].key &&
                  c.slots.join() === next[i].slots.join() &&
                  c.third.join() === next[i].third.join(),
              )
            return same ? prev : next
          })
          setCategoryAttributes(next, stateRef.current.off)
        }
        const schedule = () => {
          clearTimeout(timer)
          timer = setTimeout(refresh, 200)
        }
        if (typeof MutationObserver !== 'undefined' && document.body) {
          const observer = new MutationObserver(schedule)
          observer.observe(document.body, { childList: true, subtree: true })
          window.addEventListener('resize', schedule)
          schedule()
          return () => {
            disposed = true
            clearTimeout(timer)
            observer.disconnect()
            window.removeEventListener('resize', schedule)
          }
        }
        return undefined
      }, [])

      const toggleCategory = (key, nextOff) => {
        const next = { ...off }
        if (nextOff) next[key] = true
        else delete next[key]
        writeRegions(next)
        setOff(next)
        setCategoryAttributes(categories, next)
      }

      return React.createElement(
        'div',
        { className: 'dsh-cjk-serif-block' },
        React.createElement(
          'div',
          { className: 'dsh-cjk-serif-row' },
          React.createElement(
            'div',
            null,
            React.createElement('div', { className: 'dsh-cjk-serif-title' }, t('title')),
            React.createElement('div', { className: 'dsh-cjk-serif-desc' }, t('description')),
          ),
          React.createElement(Switch, {
            checked: enabled,
            label: t('title'),
            onChange: (next) => {
              setEnabled(next)
              apply(next)
            },
          }),
        ),
        React.createElement(
          'details',
          { className: 'dsh-cjk-serif-regions' },
          React.createElement(
            'summary',
            null,
            React.createElement('span', { className: 'dsh-cjk-serif-chev', 'aria-hidden': 'true' }, '\u203a'),
            t('regionsTitle'),
          ),
          React.createElement('div', { className: 'dsh-cjk-serif-hint' }, t('regionsHint')),
          categories.length === 0
            ? React.createElement('div', { className: 'dsh-cjk-serif-empty' }, t('regionsEmpty'))
            : categories.map((category) =>
                React.createElement(CategorySwitch, {
                  key: category.key,
                  category,
                  enabled,
                  off,
                  onToggle: toggleCategory,
                  t,
                }),
              ),
        ),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => {
          const off = ctx.locale.register(NS, { zh, en })
          return () => {
            if (typeof off === 'function') off()
          }
        }, 'dsh-cjk-serif: dictionaries')

        ctx.effect(() => {
          apply(readEnabled())
          const timers = [
            setTimeout(refreshFonts, 300),
            setTimeout(refreshFonts, 1200),
            setTimeout(refreshFonts, 3000),
          ]
          let scheduled
          const schedule = () => {
            clearTimeout(scheduled)
            scheduled = setTimeout(refreshFonts, 250)
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
            for (const timer of timers) clearTimeout(timer)
            clearTimeout(scheduled)
            observer?.disconnect()
            clearAllRegionAttributes()
            apply(false)
            styleEl?.remove()
            styleEl = null
          }
        }, 'dsh-cjk-serif: styles')

        ctx.slots.inject('settings.general.item', () =>
          ctx.slots.register(
            { name: 'settings.general.item', id: 'dsh-cjk-serif', order: 11, locale: NS },
            (props) => React.createElement(SerifPanel, { ctx, t: props.t }),
          ),
        )
      },
    }
  },
})
