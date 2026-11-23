/**
 * Collidor UI — Docs & Demo Site
 * Vanilla JS + Vite
 *
 * Imports the library from source so everything is live and interactive.
 */

// ── Bootstrap the component library ────────────────────────────────────────
import '@collidor/ui'
import { announceLive } from '@collidor/ui'
import { buildApiExample } from './api-examples.js'


// ── Helpers ─────────────────────────────────────────────────────────────────

/** Escape HTML for safe display inside <code> blocks */
function esc(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function span(cls, rawText) {
  return `<span class="${cls}">${esc(rawText)}</span>`
}

/** Single-pass TypeScript / JavaScript syntax highlighter */
function highlightJS(raw) {
  const tokenRe =
    /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\b(import|export|from|type|interface|const|let|var|function|async|await|return|if|else|for|of|in|new|as|typeof|extends|class|true|false|null|undefined|void|readonly|default)\b|\b([A-Z][A-Z0-9_]{2,}|[A-Z][a-zA-Z0-9_]*)\b|\b(\d+(?:\.\d+)?)\b|\b([a-z_$][\w$]*)(?=\s*\()|\b([a-zA-Z_$][\w$]*)(?=\??\s*:)/g

  let out = ''
  let last = 0
  for (const m of raw.matchAll(tokenRe)) {
    const idx = m.index
    if (idx > last) out += esc(raw.slice(last, idx))
    const [full, comment, str, kw, typeOrConst, num, fn, prop] = m
    if (comment) out += span('comment', comment)
    else if (str) out += span('str', str)
    else if (kw) out += span('kw', kw)
    else if (typeOrConst) out += span('type', typeOrConst)
    else if (num) out += span('num', num)
    else if (fn) out += span('fn', fn)
    else if (prop) out += span('prop', prop)
    else out += esc(full)
    last = idx + full.length
  }
  if (last < raw.length) out += esc(raw.slice(last))
  return out
}

/** Single-pass CSS syntax highlighter */
function highlightCSS(raw) {
  const tokenRe =
    /(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(@[a-zA-Z-]+)|(--[a-zA-Z0-9-]+)|(#(?:[0-9a-fA-F]{3,8})\b|\b\d+(?:\.\d+)?(?:%|(?:px|rem|em|ms|s|deg|vh|vw|fr)\b)?)|\b([a-zA-Z-]+)(?=\()|(:root|:host|::?[a-zA-Z-]+|\.[a-zA-Z_-][\w-]*)|([a-z-]+)(?=\s*:(?!:|\s*[a-z-]+\s*[\{,]))/g

  let out = ''
  let last = 0
  for (const m of raw.matchAll(tokenRe)) {
    const idx = m.index
    if (idx > last) out += esc(raw.slice(last, idx))
    const [full, comment, str, atRule, customProp, num, fn, sel, prop] = m
    if (comment) out += span('comment', comment)
    else if (str) out += span('str', str)
    else if (atRule) out += span('kw', atRule)
    else if (customProp) out += span('attr', customProp)
    else if (num) out += span('num', num)
    else if (fn) out += span('fn', fn)
    else if (sel) out += span('tag', sel)
    else if (prop) out += span('prop', prop)
    else out += esc(full)
    last = idx + full.length
  }
  if (last < raw.length) out += esc(raw.slice(last))
  return out
}

function highlightHtmlAttrs(attrText) {
  const attrRe = /([\w:-]+)(\s*=\s*)("[^"]*"|'[^']*')|([\w:-]+)/g
  let out = ''
  let last = 0
  for (const m of attrText.matchAll(attrRe)) {
    const idx = m.index
    if (idx > last) out += esc(attrText.slice(last, idx))
    const [full, name, eq, val, boolAttr] = m
    if (name) out += span('attr', name) + esc(eq) + span('str', val)
    else if (boolAttr) out += span('attr', boolAttr)
    else out += esc(full)
    last = idx + full.length
  }
  if (last < attrText.length) out += esc(attrText.slice(last))
  return out
}

/** Single-pass HTML highlighter (delegates embedded <script> and <style> blocks) */
function highlightHTML(raw) {
  const tokenRe =
    /(<!--[\s\S]*?-->)|(<script\b[^>]*>)([\s\S]*?)(<\/script>)|(<style\b[^>]*>)([\s\S]*?)(<\/style>)|(<\/?)([\w-]+)((?:"[^"]*"|'[^']*'|[^>"'])*)(\/?>)/gi

  let out = ''
  let last = 0
  for (const m of raw.matchAll(tokenRe)) {
    const idx = m.index
    if (idx > last) out += esc(raw.slice(last, idx))
    const [
      full,
      comment,
      scriptOpen,
      scriptBody,
      scriptClose,
      styleOpen,
      styleBody,
      styleClose,
      tagOpen,
      tagName,
      tagAttrs,
      tagClose,
    ] = m
    if (comment) {
      out += span('comment', comment)
    } else if (scriptOpen) {
      out += highlightHTML(scriptOpen) + highlightJS(scriptBody) + highlightHTML(scriptClose)
    } else if (styleOpen) {
      out += highlightHTML(styleOpen) + highlightCSS(styleBody) + highlightHTML(styleClose)
    } else if (tagOpen) {
      out += esc(tagOpen) + span('tag', tagName) + highlightHtmlAttrs(tagAttrs) + esc(tagClose)
    } else {
      out += esc(full)
    }
    last = idx + full.length
  }
  if (last < raw.length) out += esc(raw.slice(last))
  return out
}

/** Syntax-highlight a raw code snippet according to its language */
function highlight(raw, lang = 'html') {
  const normalized = String(lang || 'html').toLowerCase()
  if (normalized === 'ts' || normalized === 'typescript' || normalized === 'js' || normalized === 'javascript') {
    return highlightJS(raw)
  }
  if (normalized === 'css') {
    return highlightCSS(raw)
  }
  return highlightHTML(raw)
}

/** Build a code block element with a copy button */
function codeBlock(raw, lang = 'html') {
  const wrapper = document.createElement('div')
  wrapper.className = 'code-block'

  const header = document.createElement('div')
  header.className = 'code-block-header'
  header.innerHTML = `
    <span class="code-lang"><span class="lang-dot" aria-hidden="true"></span>${esc(lang)}</span>
    <button type="button" class="copy-btn" title="Copy to clipboard">Copy</button>
  `
  wrapper.appendChild(header)

  const pre = document.createElement('pre')
  const code = document.createElement('code')
  code.innerHTML = highlight(raw, lang)
  pre.appendChild(code)
  wrapper.appendChild(pre)

  header.querySelector('.copy-btn').addEventListener('click', (e) => {
    const btn = e.currentTarget
    if (!navigator.clipboard?.writeText) return
    navigator.clipboard
      .writeText(raw)
      .then(() => {
        btn.textContent = 'Copied!'
        btn.classList.add('copied')
        setTimeout(() => {
          btn.textContent = 'Copy'
          btn.classList.remove('copied')
        }, 2000)
      })
      .catch(() => {})
  })

  return wrapper
}

/** Build a live demo block */
function demoBlock({ label = '', html: innerHtml, className = '', setup }) {
  const block = document.createElement('div')
  block.className = 'demo-block'

  if (label) {
    const lbl = document.createElement('div')
    lbl.className = 'demo-label'
    lbl.textContent = label
    block.appendChild(lbl)
  }

  const preview = document.createElement('div')
  preview.className = `demo-preview${className ? ' ' + className : ''}`
  preview.innerHTML = innerHtml
  block.appendChild(preview)

  if (setup) setup(preview)
  return block
}

/** Build a props table */
function propsTable(rows) {
  const wrap = document.createElement('div')
  wrap.className = 'props-table-wrap'
  const table = document.createElement('table')
  table.className = 'props-table'
  table.innerHTML = `
    <thead>
      <tr>
        <th>Attribute</th>
        <th>Type</th>
        <th>Default</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          ([name, type, def, desc]) => `
        <tr>
          <td class="prop-name">${esc(name)}</td>
          <td class="prop-type">${esc(type)}</td>
          <td class="prop-default">${esc(def)}</td>
          <td class="prop-desc">${esc(desc)}</td>
        </tr>`,
        )
        .join('')}
    </tbody>
  `
  wrap.appendChild(table)
  return wrap
}

/** Build an events table */
function eventsTable(rows) {
  const wrap = document.createElement('div')
  wrap.className = 'props-table-wrap'
  const table = document.createElement('table')
  table.className = 'props-table'
  table.innerHTML = `
    <thead>
      <tr>
        <th>Event</th>
        <th>Type</th>
        <th>Detail</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          ([name, type, detail, desc]) => `
        <tr>
          <td class="prop-name">${esc(name)}</td>
          <td class="prop-type">${esc(type)}</td>
          <td class="prop-default">${esc(detail)}</td>
          <td class="prop-desc">${esc(desc)}</td>
        </tr>`,
        )
        .join('')}
    </tbody>
  `
  wrap.appendChild(table)
  return wrap
}

function formatTagLabel(tag) {
  if (tag.startsWith('ui-')) return `&lt;${esc(tag)}&gt;`
  return esc(tag)
}

const API_SUBTITLE_RE =
  /^(Properties|Events|CSS Modifier Classes|Modifiers|API Parameters|Supported Components)\b/i

/** Build a section container with Examples | API tabs for components */
function section({ id, title, tag, group, description, children }) {
  const el = document.createElement('section')
  el.className = 'doc-section'
  el.id = id
  el.setAttribute('data-section', id)

  el.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">${title}</h2>
      <code class="section-tag">${formatTagLabel(tag)}</code>
    </div>
    <p class="section-description">${description}</p>
  `

  const validChildren = children.filter(Boolean)

  // Partition component sections into Examples and API tabs
  if (group !== 'Foundation') {
    const splitIdx = validChildren.findIndex(
      (node) =>
        node.classList?.contains('subsection-title') &&
        API_SUBTITLE_RE.test(node.textContent.trim()),
    )

    const exampleNodes = splitIdx === -1 ? validChildren : validChildren.slice(0, splitIdx)
    const apiNodes = splitIdx === -1 ? [] : validChildren.slice(splitIdx)
    const liveApiNodes = buildApiExample(id, { codeBlock, subTitle, esc })
    const allApiNodes = [...apiNodes, ...liveApiNodes]

    if (allApiNodes.length > 0) {
      const tabs = document.createElement('ui-tabs')
      tabs.className = 'section-tabs'
      tabs.value = 'examples'
      tabs.setAttribute('aria-label', `${title} documentation`)

      const examplesTab = document.createElement('ui-tab')
      examplesTab.id = `${id}-tab-examples`
      examplesTab.value = 'examples'
      examplesTab.controls = `${id}-panel-examples`
      examplesTab.textContent = 'Examples'

      const apiTab = document.createElement('ui-tab')
      apiTab.id = `${id}-tab-api`
      apiTab.value = 'api'
      apiTab.controls = `${id}-panel-api`
      apiTab.textContent = 'API'

      tabs.append(examplesTab, apiTab)

      const examplesPanel = document.createElement('div')
      examplesPanel.id = `${id}-panel-examples`
      examplesPanel.className = 'section-tab-panel'
      examplesPanel.setAttribute('role', 'tabpanel')
      examplesPanel.setAttribute('aria-labelledby', examplesTab.id)
      examplesPanel.setAttribute('data-panel', 'examples')
      for (const child of exampleNodes) examplesPanel.appendChild(child)

      const apiPanel = document.createElement('div')
      apiPanel.id = `${id}-panel-api`
      apiPanel.className = 'section-tab-panel'
      apiPanel.setAttribute('role', 'tabpanel')
      apiPanel.setAttribute('aria-labelledby', apiTab.id)
      apiPanel.setAttribute('data-panel', 'api')
      apiPanel.hidden = true
      for (const child of allApiNodes) apiPanel.appendChild(child)

      tabs.addEventListener('ui-change', (e) => {
        e.stopPropagation()
        const showApi = e.detail.value === 'api'
        examplesPanel.hidden = showApi
        apiPanel.hidden = !showApi
      })

      el.append(tabs, examplesPanel, apiPanel)
      return el
    }
  }

  for (const child of validChildren) {
    el.appendChild(child)
  }

  return el
}

function subTitle(text) {
  const h = document.createElement('p')
  h.className = 'subsection-title'
  h.textContent = text
  return h
}

// ── Section definitions ───────────────────────────────────────────────────

const SECTIONS = [
  // ── Buttons ──────────────────────────────────────────────────────────────
  {
    id: 'button',
    title: 'Button',
    tag: 'ui-button',
    group: 'Actions',
    description:
      'Interactive button element supporting multiple semantic variants, sizes, icon-only layout, loading and disabled states.',
    build() {
      return [
        subTitle('Variants'),
        demoBlock({
          label: 'All Variants',
          html: `
            <ui-button variant="primary">Primary</ui-button>
            <ui-button variant="secondary">Secondary</ui-button>
            <ui-button variant="outline">Outline</ui-button>
            <ui-button variant="ghost">Ghost</ui-button>
            <ui-button variant="accent">Accent</ui-button>
            <ui-button variant="danger">Danger</ui-button>
            <ui-button variant="success">Success</ui-button>
          `,
        }),
        codeBlock(`<ui-button variant="primary">Primary</ui-button>
<ui-button variant="secondary">Secondary</ui-button>
<ui-button variant="outline">Outline</ui-button>
<ui-button variant="ghost">Ghost</ui-button>
<ui-button variant="accent">Accent</ui-button>
<ui-button variant="danger">Danger</ui-button>
<ui-button variant="success">Success</ui-button>`),

        subTitle('Sizes'),
        demoBlock({
          label: 'sm / md / lg',
          html: `
            <ui-button size="sm">Small</ui-button>
            <ui-button size="md">Medium</ui-button>
            <ui-button size="lg">Large</ui-button>
          `,
        }),

        subTitle('States'),
        demoBlock({
          label: 'Loading & Disabled',
          html: `
            <ui-button loading>Loading…</ui-button>
            <ui-button disabled>Disabled</ui-button>
            <ui-button variant="outline" disabled>Disabled Outline</ui-button>
          `,
        }),

        subTitle('Slots'),
        demoBlock({
          label: 'Prefix / Suffix icons',
          html: `
            <ui-button variant="primary">
              <span slot="prefix">⬆</span>
              Upload
            </ui-button>
            <ui-button variant="outline">
              Download
              <span slot="suffix">⬇</span>
            </ui-button>
          `,
        }),

        subTitle('Properties'),
        propsTable([
          ['variant', "'primary'|'secondary'|'outline'|'ghost'|'accent'|'danger'|'success'", "'primary'", 'Visual style variant'],
          ['size', "'sm'|'md'|'lg'", "'md'", 'Size of the button'],
          ['disabled', 'boolean', 'false', 'Disables interaction'],
          ['loading', 'boolean', 'false', 'Shows a spinner and blocks clicks'],
          ['icon-only', 'boolean', 'false', 'Square aspect-ratio — no text label'],
          ['type', 'string', "''", 'Native button type (submit / reset / button)'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['click', 'MouseEvent', 'native', 'Standard click event; automatically suppressed while disabled or loading'],
        ]),
      ]
    },
  },

  // ── Badge ─────────────────────────────────────────────────────────────────
  {
    id: 'badge',
    title: 'Badge',
    tag: '.ui-badge',
    group: 'Display',
    description:
      'Zero-JS pure CSS badge for statuses, counts, and tags. Supports all semantic colour variants and an optional status dot.',
    build() {
      return [
        demoBlock({
          label: 'Variants',
          html: `
            <span class="ui-badge ui-badge--primary">Primary</span>
            <span class="ui-badge ui-badge--accent">Accent</span>
            <span class="ui-badge ui-badge--success">Success</span>
            <span class="ui-badge ui-badge--warning">Warning</span>
            <span class="ui-badge ui-badge--danger">Danger</span>
            <span class="ui-badge ui-badge--info">Info</span>
            <span class="ui-badge ui-badge--neutral">Neutral</span>
          `,
        }),
        demoBlock({
          label: 'With status dot',
          html: `
            <span class="ui-badge ui-badge--success ui-badge--dot">Online</span>
            <span class="ui-badge ui-badge--warning ui-badge--dot">Busy</span>
            <span class="ui-badge ui-badge--danger ui-badge--dot">Offline</span>
          `,
        }),
        codeBlock(`<span class="ui-badge ui-badge--primary">Primary</span>
<span class="ui-badge ui-badge--success ui-badge--dot">Online</span>
<span class="ui-badge ui-badge--sm ui-badge--warning">Small</span>`),

        subTitle('CSS Modifier Classes'),
        propsTable([
          ['.ui-badge--primary/accent/...', 'Modifier', '—', 'Color variant (primary, accent, success, warning, danger, info, neutral)'],
          ['.ui-badge--sm / .ui-badge--md', 'Modifier', '.ui-badge--md', 'Size modifiers based on Golden Ratio'],
          ['.ui-badge--dot', 'Modifier', '—', 'Prepends a status dot via ::before'],
        ]),
      ]
    },
  },

  // ── Alert ─────────────────────────────────────────────────────────────────
  {
    id: 'alert',
    title: 'Alert',
    tag: 'ui-alert',
    group: 'Feedback',
    description:
      'Contextual alert banners with coloured left-border accent. Optionally closable with an automatic dismiss.',
    build() {
      return [
        demoBlock({
          label: 'Variants',
          className: 'column',
          html: `
            <ui-alert variant="info" title="Info">This is an informational message.</ui-alert>
            <ui-alert variant="success" title="Success">Action completed successfully.</ui-alert>
            <ui-alert variant="warning" title="Warning">Please review before continuing.</ui-alert>
            <ui-alert variant="danger" title="Error">Something went wrong. Please retry.</ui-alert>
          `,
        }),
        demoBlock({
          label: 'Closable',
          className: 'column',
          html: `<ui-alert variant="info" title="Dismissible" closable>Click the × to dismiss this alert.</ui-alert>`,
        }),
        codeBlock(`<ui-alert variant="danger" title="Error" closable>Something went wrong.</ui-alert>`),

        subTitle('Properties'),
        propsTable([
          ['variant', 'Variant', "'info'", 'Colour/semantic variant'],
          ['title', 'string', "''", 'Bold heading displayed above the body slot'],
          ['icon', 'string', 'auto', 'Override the default icon character'],
          ['closable', 'boolean', 'false', 'Renders a dismiss × button'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-dismiss', 'UIAlertDismissEvent', '{}', 'Fired when the alert is dismissed via button or dismiss()'],
        ]),
      ]
    },
  },

  // ── Input ─────────────────────────────────────────────────────────────────
  {
    id: 'input',
    title: 'Input',
    tag: 'ui-input',
    group: 'Forms',
    description:
      'Styled text input with prefix/suffix slots, clearable button, and all standard HTML input types.',
    build() {
      return [
        demoBlock({
          label: 'Sizes',
          className: 'column',
          html: `
            <ui-input size="sm" placeholder="Small input" style="max-width:320px"></ui-input>
            <ui-input size="md" placeholder="Medium input" style="max-width:320px"></ui-input>
            <ui-input size="lg" placeholder="Large input" style="max-width:320px"></ui-input>
          `,
        }),
        demoBlock({
          label: 'With prefix & suffix slots',
          className: 'column',
          html: `
            <ui-input placeholder="Search…" style="max-width:320px">
              <span slot="prefix">🔍</span>
            </ui-input>
            <ui-input placeholder="Amount" style="max-width:320px">
              <span slot="prefix">$</span>
              <span slot="suffix">.00</span>
            </ui-input>
          `,
        }),
        demoBlock({
          label: 'Clearable',
          html: `<ui-input value="Clear me!" clearable style="max-width:320px"></ui-input>`,
        }),
        codeBlock(`<ui-input placeholder="Search…" clearable>
  <span slot="prefix">🔍</span>
</ui-input>`),

        subTitle('Properties'),
        propsTable([
          ['value', 'string', "''", 'Current value'],
          ['type', 'string', "'text'", 'Native input type (text, email, password, …)'],
          ['placeholder', 'string', "''", 'Placeholder text'],
          ['size', "'sm'|'md'|'lg'", "'md'", 'Visual size'],
          ['disabled', 'boolean', 'false', 'Disables the input'],
          ['readonly', 'boolean', 'false', 'Makes the input read-only'],
          ['clearable', 'boolean', 'false', 'Shows a × clear button when value is non-empty'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-input', 'UIInputEvent', '{ value: string }', 'Fired on every keystroke or clear action'],
          ['ui-change', 'UIInputChangeEvent', '{ value: string }', 'Fired when the value is committed or cleared'],
        ]),
      ]
    },
  },

  // ── Switch ────────────────────────────────────────────────────────────────
  {
    id: 'switch',
    title: 'Switch',
    tag: 'ui-switch',
    group: 'Forms',
    description:
      'Toggle switch. Width ≈ 1.618× height (golden ratio). Fires ui-change with { checked }.',
    build() {
      return [
        demoBlock({
          label: 'Sizes & States',
          html: `
            <ui-switch size="sm">Small</ui-switch>
            <ui-switch size="md" checked>Medium (on)</ui-switch>
            <ui-switch size="lg">Large</ui-switch>
            <ui-switch disabled>Disabled</ui-switch>
            <ui-switch checked disabled>Disabled on</ui-switch>
          `,
        }),
        codeBlock(`<ui-switch size="md" checked>Dark mode</ui-switch>`),

        subTitle('Properties'),
        propsTable([
          ['checked', 'boolean', 'false', 'Whether the switch is on'],
          ['size', "'sm'|'md'|'lg'", "'md'", 'Visual size'],
          ['label', 'string', "''", 'Text label (also accepted via default slot)'],
          ['disabled', 'boolean', 'false', 'Disables interaction'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-change', 'UISwitchChangeEvent', '{ checked: boolean }', 'Fired when toggled by click, keyboard, or toggle()'],
        ]),
      ]
    },
  },

  // ── Chip ──────────────────────────────────────────────────────────────────
  {
    id: 'chip',
    title: 'Chip / Tag',
    tag: 'ui-chip',
    group: 'Display',
    description:
      'Compact selectable or closable tags with optional icon and avatar. Inside <code>&lt;ui-chip-group&gt;</code>, interactive chips use roving tabindex (single Tab stop, Arrow/Home/End navigation, Space/Enter toggle, Delete/Backspace dismiss).',
    build() {
      return [
        demoBlock({
          label: 'Basic chips',
          html: `
            <ui-chip>TypeScript</ui-chip>
            <ui-chip icon="🎨">Design</ui-chip>
            <ui-chip variant="accent" selectable selected>Selected</ui-chip>
            <ui-chip closable>Closable</ui-chip>
          `,
        }),
        demoBlock({
          label: 'Chip group — selectable',
          html: `
            <ui-chip-group wrap>
              <ui-chip selectable>Fire</ui-chip>
              <ui-chip selectable>Water</ui-chip>
              <ui-chip selectable selected>Earth</ui-chip>
              <ui-chip selectable>Air</ui-chip>
              <ui-chip selectable>Lightning</ui-chip>
            </ui-chip-group>
          `,
        }),
        codeBlock(`<ui-chip-group wrap>
  <ui-chip selectable>Fire</ui-chip>
  <ui-chip selectable selected>Earth</ui-chip>
  <ui-chip closable>Closable</ui-chip>
</ui-chip-group>`),

        subTitle('Properties — ui-chip'),
        propsTable([
          ['value', 'string', "''", 'Value emitted in events'],
          ['variant', 'Variant', "'secondary'", 'Colour variant for selected state accent'],
          ['size', "'sm'|'md'|'lg'", "'md'", 'Size'],
          ['selectable', 'boolean', 'false', 'Allows toggling selected state'],
          ['selected', 'boolean', 'false', 'Currently selected'],
          ['closable', 'boolean', 'false', 'Shows a × remove button'],
          ['icon', 'string', "''", 'Emoji / character icon prepended to label'],
          ['avatar', 'string', "''", 'URL for a circular avatar image'],
        ]),

        subTitle('Events — ui-chip / ui-chip-group'),
        eventsTable([
          ['ui-select', 'UIChipSelectEvent', '{ value: string; selected: boolean }', 'Fired when a selectable chip is toggled'],
          ['ui-dismiss', 'UIChipDismissEvent', '{ value: string }', 'Fired when a closable chip is removed'],
        ]),
      ]
    },
  },

  // ── Progress ──────────────────────────────────────────────────────────────
  {
    id: 'progress',
    title: 'Progress',
    tag: 'ui-progress',
    group: 'Feedback',
    description:
      'Semantic progress bar with variants, sizes, striped & animated fill, buffer track, and optional value label.',
    build() {
      return [
        demoBlock({
          label: 'Variants',
          className: 'column',
          html: `
            <ui-progress value="72" label="Primary" show-value></ui-progress>
            <ui-progress value="48" variant="accent" label="Accent" show-value></ui-progress>
            <ui-progress value="65" variant="success" label="Success" show-value></ui-progress>
            <ui-progress value="33" variant="danger" label="Danger" show-value></ui-progress>
            <ui-progress value="90" variant="warning" label="Warning" show-value></ui-progress>
          `,
        }),
        demoBlock({
          label: 'Striped & animated',
          className: 'column',
          html: `
            <ui-progress value="55" striped label="Striped"></ui-progress>
            <ui-progress value="75" striped animated label="Animated"></ui-progress>
          `,
        }),
        demoBlock({
          label: 'Sizes',
          className: 'column',
          html: `
            <ui-progress value="60" size="sm" label="sm"></ui-progress>
            <ui-progress value="60" size="md" label="md"></ui-progress>
            <ui-progress value="60" size="lg" label="lg"></ui-progress>
          `,
        }),
        codeBlock(`<ui-progress value="72" label="Uploading" show-value striped animated></ui-progress>`),

        subTitle('Properties'),
        propsTable([
          ['value', 'number', '0', 'Current value'],
          ['min', 'number', '0', 'Minimum value'],
          ['max', 'number', '100', 'Maximum value'],
          ['buffer', 'number|null', 'null', 'Secondary buffer track value'],
          ['variant', 'Variant', "'primary'", 'Colour variant'],
          ['size', "'sm'|'md'|'lg'", "'md'", 'Track height'],
          ['label', 'string', "''", 'Label shown above the track'],
          ['show-value', 'boolean', 'false', 'Shows numeric value text'],
          ['striped', 'boolean', 'false', 'Diagonal stripe pattern on fill'],
          ['animated', 'boolean', 'false', 'Animates the stripes (requires striped)'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-collapse-change', 'UICollapseChangeEvent', '{ collapsed: boolean }', 'Fired when a collapsible progress header is toggled'],
        ]),
      ]
    },
  },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  {
    id: 'tabs',
    title: 'Tabs',
    tag: 'ui-tabs',
    group: 'Navigation',
    description:
      'Tab strip (<code>&lt;ui-tabs&gt;</code>) hosting individual tab items (<code>&lt;ui-tab&gt;</code>). Emits <code>ui-change</code> with the new value on selection.',
    build() {
      return [
        demoBlock({
          label: 'Basic tabs',
          html: `
            <div style="width:100%">
              <ui-tabs id="demo-tabs" value="overview">
                <ui-tab value="overview">Overview</ui-tab>
                <ui-tab value="stats">Stats</ui-tab>
                <ui-tab value="settings">Settings</ui-tab>
                <ui-tab value="disabled" disabled>Disabled</ui-tab>
              </ui-tabs>
              <div id="demo-tab-content" style="padding:12px 0; font-size:0.85rem; color: oklch(0.68 0.018 260)">
                Showing: <strong>Overview</strong>
              </div>
            </div>
          `,
          setup(preview) {
            const tabs = preview.querySelector('#demo-tabs')
            const content = preview.querySelector('#demo-tab-content')
            tabs.addEventListener('ui-change', (e) => {
              content.innerHTML = `Showing: <strong>${esc(String(e.detail.value ?? ''))}</strong>`
            })
          },
        }),
        codeBlock(`<ui-tabs value="overview">
  <ui-tab value="overview">Overview</ui-tab>
  <ui-tab value="stats">Stats</ui-tab>
  <ui-tab value="settings">Settings</ui-tab>
  <ui-tab value="disabled" disabled>Disabled</ui-tab>
</ui-tabs>`),

        subTitle('Properties — ui-tabs'),
        propsTable([
          ['value', 'string', "''", 'Currently active tab value'],
        ]),

        subTitle('Properties — ui-tab'),
        propsTable([
          ['value', 'string', "''", 'Unique identifier for this tab'],
          ['active', 'boolean', 'false', 'Managed by ui-tabs; do not set manually'],
          ['disabled', 'boolean', 'false', 'Prevents selection'],
        ]),

        subTitle('Events — ui-tabs'),
        eventsTable([
          ['ui-change', 'UITabsChangeEvent', '{ value: string }', 'Fired when the active tab changes via click or arrow keys'],
        ]),
      ]
    },
  },

  // ── Accordion ─────────────────────────────────────────────────────────────
  {
    id: 'accordion',
    title: 'Accordion',
    tag: 'ui-accordion',
    group: 'Navigation',
    description:
      'Collapsible sections. By default single-open; add multiple to allow many open at once.',
    build() {
      return [
        demoBlock({
          label: 'Single-open (default)',
          html: `
            <ui-accordion style="width:100%">
              <ui-accordion-item title="What is Golden Ratio spacing?" open>
                All spacing tokens are computed from powers of φ ≈ 1.618, ensuring
                harmonious proportions across the entire component surface.
              </ui-accordion-item>
              <ui-accordion-item title="What colour space is used?" icon="🎨">
                Components use OKLCH throughout — perceptually uniform so
                colours of different hues look equally bright at the same L value.
              </ui-accordion-item>
              <ui-accordion-item title="Can I customise components?" icon="⚙">
                Yes. Every component exposes CSS custom properties (hooks) that
                cascade from the containing element.
              </ui-accordion-item>
            </ui-accordion>
          `,
        }),
        codeBlock(`<ui-accordion>
  <ui-accordion-item title="First section" open>Content…</ui-accordion-item>
  <ui-accordion-item title="Second section">Content…</ui-accordion-item>
</ui-accordion>

<!-- Allow multiple open at once -->
<ui-accordion multiple>…</ui-accordion>`),

        subTitle('Properties — ui-accordion'),
        propsTable([
          ['multiple', 'boolean', 'false', 'Allow more than one item open simultaneously'],
        ]),

        subTitle('Properties — ui-accordion-item'),
        propsTable([
          ['title', 'string', "''", 'Header text (or use the title slot for rich content)'],
          ['open', 'boolean', 'false', 'Whether this item is expanded'],
          ['icon', 'string', "''", 'Emoji/character displayed before the title'],
          ['disabled', 'boolean', 'false', 'Prevents toggling'],
        ]),

        subTitle('Events — ui-accordion / ui-accordion-item'),
        eventsTable([
          ['ui-toggle', 'UIAccordionToggleEvent', '{ item: UIAccordionItem; open: boolean }', 'Fired when an accordion item is expanded or collapsed'],
        ]),
      ]
    },
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  {
    id: 'card',
    title: 'Card',
    tag: 'ui-card',
    group: 'Layout',
    description:
      'Surface container with optional header and footer slots. Supports elevated shadow, collapsible state, and header surface variants.',
    build() {
      return [
        demoBlock({
          label: 'Basic card',
          html: `
            <ui-card style="max-width:320px; width:100%">
              <span slot="header">Card Header</span>
              <p style="margin:0; font-size:0.85rem">
                Cards are bordered by default. Add the <code>elevated</code> attribute
                for a drop-shadow.
              </p>
              <span slot="footer">Footer text</span>
            </ui-card>
          `,
        }),
        demoBlock({
          label: 'Elevated & collapsible',
          html: `
            <ui-card elevated collapsible style="max-width:320px; width:100%">
              <span slot="header">Collapsible Elevated Card</span>
              <p style="margin:0; font-size:0.85rem">
                Click the header to collapse this card.
              </p>
            </ui-card>
          `,
        }),
        codeBlock(`<ui-card elevated collapsible>
  <span slot="header">Section Title</span>
  <p>Card body content goes here.</p>
  <span slot="footer">Last updated: now</span>
</ui-card>`),

        subTitle('Properties'),
        propsTable([
          ['bordered', 'boolean', 'true', 'Renders a 1px border'],
          ['elevated', 'boolean', 'false', 'Applies a diffuse drop-shadow'],
          ['collapsible', 'boolean', 'false', 'Makes the header a toggle button'],
          ['collapsed', 'boolean', 'false', 'Initial collapsed state (when collapsible)'],
          ['header-surface', 'string', "''", "One of 'flat'|'raised'|'sunken'|'banner'|'accent'"],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-collapse-change', 'UICollapseChangeEvent', '{ collapsed: boolean }', 'Fired when a collapsible card is collapsed or expanded'],
        ]),
      ]
    },
  },

  // ── Breadcrumbs ───────────────────────────────────────────────────────────
  {
    id: 'breadcrumbs',
    title: 'Breadcrumbs',
    tag: '.ui-breadcrumbs',
    group: 'Navigation',
    description: 'Semantic, accessible breadcrumb trail powered by standard <code>&lt;nav&gt;</code> and pure CSS separators.',
    build() {
      return [
        demoBlock({
          label: 'Standard breadcrumb',
          html: `
            <nav aria-label="Breadcrumb">
              <ol class="ui-breadcrumbs">
                <li><a href="#">Home</a></li>
                <li><a href="#">Library</a></li>
                <li><a href="#">Data</a></li>
                <li><span aria-current="page">Components</span></li>
              </ol>
            </nav>
          `,
        }),
        codeBlock(`<nav aria-label="Breadcrumb">
  <ol class="ui-breadcrumbs">
    <li><a href="/">Home</a></li>
    <li><a href="/library">Library</a></li>
    <li><span aria-current="page">Components</span></li>
  </ol>
</nav>`),

        subTitle('CSS Modifier Classes'),
        propsTable([
          ['.ui-breadcrumbs', 'Base class', '—', 'Horizontal breadcrumb list with automatic "/" separators'],
          ['[aria-current="page"]', 'Attribute', '—', 'Highlights the current page item'],
        ]),
      ]
    },
  },

  // ── Link ──────────────────────────────────────────────────────────────────
  {
    id: 'link',
    title: 'Link',
    tag: '.ui-link',
    group: 'Navigation',
    description:
      'Accessible, zero-JS pure CSS link styling with subtle, hover, active, and disabled variants.',
    build() {
      return [
        subTitle('Variants'),
        demoBlock({
          label: 'Default, Subtle, and Disabled links',
          html: `
            <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
              <a href="#link" class="ui-link">Standard Link</a>
              <a href="#link" class="ui-link ui-link--subtle">Subtle Link</a>
              <a href="#link" class="ui-link" aria-disabled="true">Disabled Link</a>
              <a href="#link" class="ui-link">
                <span>External Link</span>
                <span style="font-size: 0.75em;">↗</span>
              </a>
            </div>
          `,
        }),
        codeBlock(`<a href="/dashboard" class="ui-link">Standard Link</a>
<a href="/settings" class="ui-link ui-link--subtle">Subtle Link</a>
<a href="#" class="ui-link" aria-disabled="true">Disabled Link</a>
<a href="https://example.com" class="ui-link" target="_blank" rel="noopener">
  <span>External Docs</span>
  <span>↗</span>
</a>`),

        subTitle('Modifiers'),
        propsTable([
          ['.ui-link', 'class', '—', 'Base link style with primary color, focus ring, and underline on hover'],
          ['.ui-link--subtle', 'modifier', '—', 'Muted text color that brightens to full text color on hover'],
          ['.ui-link--disabled', 'modifier', '—', 'Opacity 0.5, pointer-events: none, cursor: not-allowed'],
          ['[aria-disabled="true"]', 'attribute', '—', 'Accessible disabled link state'],
        ]),
      ]
    },
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  {
    id: 'skeleton',
    title: 'Skeleton',
    tag: '.ui-skeleton',
    group: 'Feedback',
    description: 'Zero-JS loading placeholder shapes with shimmer animation via pure CSS @keyframes.',
    build() {
      return [
        demoBlock({
          label: 'Variants',
          className: 'column',
          html: `
            <div class="ui-skeleton" style="width:60%"></div>
            <div class="ui-skeleton" style="width:80%"></div>
            <div class="ui-skeleton" style="width:40%"></div>
            <div style="display:flex; gap:12px; align-items:center">
              <div class="ui-skeleton ui-skeleton--circle" style="width:48px; height:48px; flex-shrink:0"></div>
              <div style="flex:1; display:flex; flex-direction:column; gap:8px">
                <div class="ui-skeleton" style="width:70%"></div>
                <div class="ui-skeleton" style="width:45%"></div>
              </div>
            </div>
            <div class="ui-skeleton ui-skeleton--rect" style="width:100%; height:120px"></div>
          `,
        }),
        codeBlock(`<div class="ui-skeleton ui-skeleton--circle" style="width:48px; height:48px"></div>
<div class="ui-skeleton" style="width:60%"></div>
<div class="ui-skeleton ui-skeleton--rect" style="height:120px"></div>`),

        subTitle('CSS Modifier Classes'),
        propsTable([
          ['.ui-skeleton', 'Base class', '—', 'Base shimmer block with Golden Ratio rounded corners'],
          ['.ui-skeleton--circle', 'Modifier', '—', '50% border radius for avatar placeholders'],
          ['.ui-skeleton--rounded', 'Modifier', '—', 'Medium curvature for cards/buttons'],
          ['.ui-skeleton--rect', 'Modifier', '—', 'Flat rectangle placeholder'],
        ]),
      ]
    },
  },

  // ── Tooltip ───────────────────────────────────────────────────────────────
  {
    id: 'tooltip',
    title: 'Tooltip',
    tag: 'ui-tooltip',
    group: 'Overlays',
    description:
      'Hover/focus tooltip powered by CSS Anchor Positioning + the native Popover API. Pass text via the <code>content</code> attribute or use the <code>slot="content"</code> slot for rich markup.',
    build() {
      return [
        demoBlock({
          label: 'content attribute',
          className: 'center',
          html: `
            <ui-tooltip content="A simple tooltip">
              <ui-button variant="outline">Hover me</ui-button>
            </ui-tooltip>
          `,
        }),
        demoBlock({
          label: 'slot="content" — rich markup',
          className: 'center',
          html: `
            <ui-tooltip>
              <ui-button variant="primary">Rich tooltip</ui-button>
              <span slot="content">
                Supports <strong>HTML</strong> content
              </span>
            </ui-tooltip>
          `,
        }),
        demoBlock({
          label: 'Positions',
          className: 'center',
          html: `
            <ui-tooltip content="Top (default)" position="top">
              <ui-button size="sm" variant="secondary">Top</ui-button>
            </ui-tooltip>
            <ui-tooltip content="Bottom" position="bottom">
              <ui-button size="sm" variant="secondary">Bottom</ui-button>
            </ui-tooltip>
            <ui-tooltip content="Left" position="left">
              <ui-button size="sm" variant="secondary">Left</ui-button>
            </ui-tooltip>
            <ui-tooltip content="Right" position="right">
              <ui-button size="sm" variant="secondary">Right</ui-button>
            </ui-tooltip>
          `,
        }),
        codeBlock(`<!-- Via attribute -->
<ui-tooltip content="Helpful info">
  <ui-button>Hover me</ui-button>
</ui-tooltip>

<!-- Via slot (rich content) -->
<ui-tooltip position="bottom">
  <ui-button>Hover me</ui-button>
  <span slot="content">Supports <strong>HTML</strong></span>
</ui-tooltip>`),

        subTitle('Properties'),
        propsTable([
          ['content', 'string', "''", 'Tooltip text (plain). Use slot="content" for rich HTML.'],
          ['position', "'top'|'bottom'|'left'|'right'", "'top'", 'Preferred placement (auto-flips at viewport edges via CSS Anchor Positioning)'],
        ]),
      ]
    },
  },


  // ── Table ─────────────────────────────────────────────────────────────────
  {
    id: 'table',
    title: 'Table',
    tag: 'ui-table',
    group: 'Data',
    description:
      'Generic data table (<code>UITable&lt;T&gt;</code>) with client or remote sorting &amp; pagination, row selection, column customization, virtualization, and strongly-typed events.',
    build() {
      // ── Fake dataset ─────────────────────────────────────────────────────
      const ALL_ROWS = [
        { id: 1,  name: 'Aboleth',          type: 'Aberration',  cr: '10',  hp: 135, align: 'Lawful Evil' },
        { id: 2,  name: 'Banshee',          type: 'Undead',      cr: '4',   hp: 58,  align: 'Chaotic Evil' },
        { id: 3,  name: 'Basilisk',         type: 'Monstrosity', cr: '3',   hp: 52,  align: 'Unaligned' },
        { id: 4,  name: 'Beholder',         type: 'Aberration',  cr: '13',  hp: 180, align: 'Lawful Evil' },
        { id: 5,  name: 'Black Dragon',     type: 'Dragon',      cr: '17',  hp: 195, align: 'Chaotic Evil' },
        { id: 6,  name: 'Bugbear',          type: 'Humanoid',    cr: '1',   hp: 27,  align: 'Chaotic Evil' },
        { id: 7,  name: 'Centaur',          type: 'Monstrosity', cr: '2',   hp: 45,  align: 'Neutral Good' },
        { id: 8,  name: 'Chimera',          type: 'Monstrosity', cr: '6',   hp: 114, align: 'Chaotic Evil' },
        { id: 9,  name: 'Cyclops',          type: 'Giant',       cr: '6',   hp: 138, align: 'Chaotic Neutral' },
        { id: 10, name: 'Displacer Beast',  type: 'Monstrosity', cr: '3',   hp: 85,  align: 'Lawful Evil' },
        { id: 11, name: 'Drow',             type: 'Humanoid',    cr: '1/4', hp: 13,  align: 'Neutral Evil' },
        { id: 12, name: 'Ettin',            type: 'Giant',       cr: '4',   hp: 85,  align: 'Chaotic Evil' },
        { id: 13, name: 'Flumph',           type: 'Aberration',  cr: '1/8', hp: 7,   align: 'Lawful Good' },
        { id: 14, name: 'Gelatinous Cube',  type: 'Ooze',        cr: '2',   hp: 84,  align: 'Unaligned' },
        { id: 15, name: 'Githyanki',        type: 'Humanoid',    cr: '3',   hp: 49,  align: 'Lawful Evil' },
        { id: 16, name: 'Golem (Iron)',      type: 'Construct',   cr: '16',  hp: 210, align: 'Unaligned' },
        { id: 17, name: 'Harpy',            type: 'Monstrosity', cr: '1',   hp: 38,  align: 'Chaotic Evil' },
        { id: 18, name: 'Hydra',            type: 'Monstrosity', cr: '8',   hp: 172, align: 'Unaligned' },
        { id: 19, name: 'Kobold',           type: 'Humanoid',    cr: '1/8', hp: 5,   align: 'Lawful Evil' },
        { id: 20, name: 'Kraken',           type: 'Monstrosity', cr: '23',  hp: 472, align: 'Chaotic Evil' },
        { id: 21, name: 'Lich',             type: 'Undead',      cr: '21',  hp: 135, align: 'Neutral Evil' },
        { id: 22, name: 'Manticore',        type: 'Monstrosity', cr: '3',   hp: 68,  align: 'Lawful Evil' },
        { id: 23, name: 'Medusa',           type: 'Monstrosity', cr: '6',   hp: 127, align: 'Lawful Evil' },
        { id: 24, name: 'Mind Flayer',      type: 'Aberration',  cr: '7',   hp: 71,  align: 'Lawful Evil' },
        { id: 25, name: 'Minotaur',         type: 'Monstrosity', cr: '3',   hp: 114, align: 'Chaotic Evil' },
        { id: 26, name: 'Naga (Spirit)',     type: 'Monstrosity', cr: '8',   hp: 75,  align: 'Lawful Good' },
        { id: 27, name: 'Nightmare',        type: 'Fiend',       cr: '3',   hp: 68,  align: 'Neutral Evil' },
        { id: 28, name: 'Ogre',             type: 'Giant',       cr: '2',   hp: 59,  align: 'Chaotic Evil' },
        { id: 29, name: 'Owlbear',          type: 'Monstrosity', cr: '3',   hp: 59,  align: 'Unaligned' },
        { id: 30, name: 'Roc',              type: 'Monstrosity', cr: '11',  hp: 248, align: 'Unaligned' },
        { id: 31, name: 'Rust Monster',     type: 'Monstrosity', cr: '1/2', hp: 27,  align: 'Unaligned' },
        { id: 32, name: 'Salamander',       type: 'Elemental',   cr: '5',   hp: 90,  align: 'Neutral Evil' },
        { id: 33, name: 'Tarrasque',        type: 'Monstrosity', cr: '30',  hp: 676, align: 'Unaligned' },
        { id: 34, name: 'Troll',            type: 'Giant',       cr: '5',   hp: 84,  align: 'Chaotic Evil' },
        { id: 35, name: 'Unicorn',          type: 'Celestial',   cr: '5',   hp: 67,  align: 'Lawful Good' },
        { id: 36, name: 'Vampire',          type: 'Undead',      cr: '13',  hp: 144, align: 'Lawful Evil' },
        { id: 37, name: 'Werewolf',         type: 'Humanoid',    cr: '3',   hp: 58,  align: 'Chaotic Evil' },
        { id: 38, name: 'Wight',            type: 'Undead',      cr: '3',   hp: 45,  align: 'Neutral Evil' },
        { id: 39, name: 'Wraith',           type: 'Undead',      cr: '5',   hp: 67,  align: 'Neutral Evil' },
        { id: 40, name: 'Xorn',             type: 'Elemental',   cr: '5',   hp: 73,  align: 'Neutral' },
      ]

      const COLUMNS = JSON.stringify([
        { key: 'name',  label: 'Creature',   sortable: true },
        { key: 'type',  label: 'Type',       sortable: true },
        { key: 'cr',    label: 'CR',         sortable: true, align: 'center' },
        { key: 'hp',    label: 'HP',         sortable: true, align: 'right' },
        { key: 'align', label: 'Alignment',  sortable: true },
      ])

      const PAGE_SIZE = 8

      function makeTable(id, extraAttrs = '') {
        return `
          <ui-table
            id="${id}"
            row-key="id"
            columns='${COLUMNS}'
            pagination
            page-size="${PAGE_SIZE}"
            ${extraAttrs}
            style="height:auto"
          ></ui-table>
        `
      }

      // ── Client-side ────────────────────────────────────────────────────────
      // Pass the full dataset as table.data — do NOT set table.total.
      // The component sorts and paginates internally and emits ui-sort / ui-page-change.
      function setupClientTable(preview, id, rows) {
        const table = preview.querySelector(`#${id}`)
        table.pageSizeOptions = [5, 8, 10, 25]
        table.data = rows
      }

      // ── Async / remote ─────────────────────────────────────────────────────
      // Simulates a server: each page fires a "fetch" (300ms), returns a slice.
      // table.remote = true delegates sorting/paging to ui-page-request, and
      // e.detail.resolve({ data, total }) updates the table and clears loading.
      function parseSortableValue(v) {
        if (typeof v === 'number') return v
        if (typeof v === 'string') {
          const frac = /^(\d+)\/(\d+)$/.exec(v.trim())
          if (frac) return Number(frac[1]) / Number(frac[2])
          const num = Number(v)
          if (!Number.isNaN(num) && v.trim() !== '') return num
        }
        return null
      }

      function setupAsyncTable(preview, id, rows) {
        const table = preview.querySelector(`#${id}`)
        const SERVER_TOTAL = rows.length
        table.pageSizeOptions = [5, 8, 10, 25]
        table.remote = true

        function sorted(sortBy, sortDir) {
          if (!sortBy || !sortDir) return rows
          return [...rows].sort((a, b) => {
            const av = a[sortBy], bv = b[sortBy]
            const an = parseSortableValue(av), bn = parseSortableValue(bv)
            const cmp = an === null || bn === null
              ? String(av).localeCompare(String(bv))
              : an - bn
            return sortDir === 'desc' ? -cmp : cmp
          })
        }

        let pendingTimer = null
        table.addEventListener('ui-page-request', (e) => {
          if (pendingTimer) clearTimeout(pendingTimer)
          const { page, pageSize, sortBy, sortDirection, resolve } = e.detail
          table.loading = true
          pendingTimer = setTimeout(() => {
            pendingTimer = null
            const all = sorted(sortBy, sortDirection)
            const start = (page - 1) * pageSize
            resolve({
              data: all.slice(start, start + pageSize),
              total: SERVER_TOTAL,
            })
          }, 300)
        })

        table.getPage({ page: 1 })
      }

      return [
        subTitle('Client-side pagination'),
        demoBlock({
          label: 'Striped + hoverable — full data, component paginates internally',
          html: makeTable('demo-table-1', 'striped hoverable'),
          setup(preview) { setupClientTable(preview, 'demo-table-1', ALL_ROWS) },
        }),

        subTitle('Async / remote pagination (simulated 300ms fetch)'),
        demoBlock({
          label: 'Bordered — page slices from "server", loading overlay between pages',
          html: makeTable('demo-table-2', 'bordered hoverable'),
          setup(preview) { setupAsyncTable(preview, 'demo-table-2', ALL_ROWS) },
        }),

        subTitle('Compact bordered'),
        demoBlock({
          label: 'Dense grid',
          html: makeTable('demo-table-3', 'bordered compact'),
          setup(preview) { setupClientTable(preview, 'demo-table-3', ALL_ROWS) },
        }),

        codeBlock(`<!-- CLIENT-SIDE: pass all rows, component sorts & paginates internally -->
<ui-table row-key="id" columns='[...]' striped hoverable pagination page-size="8"></ui-table>
<script>
  const table = document.querySelector('ui-table')
  table.data = allRows       // full dataset — component sorts & slices internally

  table.addEventListener('ui-sort', (e) => {
    console.log(e.detail.sortBy, e.detail.sortDirection)
  })
  table.addEventListener('ui-row-click', (e) => {
    console.log(e.detail.row, e.detail.key, e.detail.selected)
  })
<\/script>

<!-- ASYNC / REMOTE: set remote, handle unified ui-page-request -->
<ui-table remote pagination page-size="8"></ui-table>
<script>
  table.addEventListener('ui-page-request', async (e) => {
    const { page, pageSize, sortBy, sortDirection, resolve } = e.detail
    table.loading = true
    const res = await api.getMonsters({ page, pageSize, sortBy, sortDirection })
    resolve({ data: res.rows, total: res.total })
  })
  table.getPage({ page: 1 })
<\/script>`),

        subTitle('Properties'),
        propsTable([
          ['data',          'T[]',                 '[]',    'Row data — pass full array (client) or current page slice (remote)'],
          ['columns',       'TableColumn<T>[]',    '[]',    'Column defs: { key, label?, sortable?, align?, width?, formatter? }'],
          ['row-key',       'string',              "'id'",  'Unique key field per row'],
          ['pagination',    'boolean',             'false', 'Show footer pagination bar'],
          ['page',          'number',              '1',     'Current page (1-indexed)'],
          ['page-size',     'number',              '10',    'Rows per page'],
          ['total',         'number',              'data.length', 'Total row count for remote paging — omit for client-side'],
          ['remote',        'boolean',             'false', 'Delegates sorting, paging, and infinite scroll to ui-page-request'],
          ['fetchPage',     '(params: TablePageRequestParams) => Promise<{ data: T[]; total?: number }> | void', 'undefined', 'Optional async page loader invoked alongside ui-page-request'],
          ['selectable',    'boolean',             'false', 'Enables row selection checkboxes'],
          ['selection-mode',"'single'|'multiple'", "'multiple'", 'Single or multi-row selection'],
          ['column-customization', 'boolean',      'false', 'Shows column visibility & reorder popover in the header bar'],
          ['virtual',       'boolean | VirtualScrollConfig', 'false', 'Enables windowed virtual scrolling for large datasets'],
          ['striped',       'boolean',             'false', 'Alternating row background'],
          ['hoverable',     'boolean',             'false', 'Highlight row on hover'],
          ['bordered',      'boolean',             'false', 'Column separator borders'],
          ['compact',       'boolean',             'false', 'Reduced padding'],
          ['sort-by',       'string',              "''",    'Active sort column key'],
          ['sort-direction','null|"asc"|"desc"',   'null',  'Sort direction'],
          ['loading',       'boolean',             'false', 'Loading overlay spinner'],
          ['empty-text',    'string',              "'No data available'", 'Empty state message'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-sort', 'UITableSortEvent<T>', '{ sortBy, sortDirection, data }', 'Fired when a sortable header is activated or sort() is called'],
          ['ui-page-change', 'UITablePageChangeEvent', '{ page, pageSize, totalPages, total }', 'Fired when the active page changes'],
          ['ui-page-size-change', 'UITablePageSizeChangeEvent', '{ page, pageSize, totalPages, total }', 'Fired when rows per page changes (resets page to 1)'],
          ['ui-page-request', 'UITablePageRequestEvent<T>', '{ page, pageSize, sortBy, sortDirection, reason, append, resolve }', 'Fired when remote/fetchPage is enabled (or getPage() is called). Call resolve({ data, total }) to update or append rows'],
          ['ui-selection-change', 'UITableSelectionChangeEvent<T>', '{ selectedKeys, selectedRows, row?, index? }', 'Fired when row selection changes'],
          ['ui-row-click', 'UITableRowClickEvent<T>', '{ row, index, key, selected }', 'Fired when a row is clicked (ignores clicks inside nested buttons/links/inputs)'],
          ['ui-columns-change', 'UITableColumnsChangeEvent<T>', '{ columns }', 'Fired when columns are shown, hidden, reordered, or reset'],
          ['ui-collapse-change', 'UICollapseChangeEvent', '{ collapsed }', 'Fired when a collapsible table header is toggled'],
        ]),
      ]
    },
  },

  // ── Events & Types ────────────────────────────────────────────────────────
  {
    id: 'events',
    title: 'Events & Types',
    tag: 'UI_EVENTS',
    group: 'Foundation',
    description:
      'All public component events follow a strict ui-* convention, bubble and cross Shadow DOM (bubbles, composed, cancelable), and ship with exported TypeScript detail types, CustomEvent aliases, UI_EVENTS constants, and typed addEventListener overloads.',
    build() {
      return [
        subTitle('Typed Listeners & Generic Components'),
        codeBlock(`import {
  UI_EVENTS,
  type UITable,
  type UIList,
  type UICombobox,
  type UIStructForm,
} from '@collidor/ui'

interface User {
  id: string
  name: string
  role: string
}

// Generic components infer event payloads automatically — no casts needed
const table = document.querySelector('ui-table') as UITable<User>

table.addEventListener(UI_EVENTS.ROW_CLICK, (e) => {
  console.log(e.detail.row.name, e.detail.key, e.detail.selected)
})

table.addEventListener(UI_EVENTS.PAGE_REQUEST, async (e) => {
  const { page, pageSize, sortBy, sortDirection, reason, append, resolve } = e.detail
  table.loading = true
  const res = await fetchUsers({ page, pageSize, sortBy, sortDirection })
  // Replaces rows on page/sort/page-size, appends rows on infinite scroll (append: true)
  resolve({ data: res.items, total: res.total })
})`, 'ts'),

        subTitle('Standard Event Vocabulary (UI_EVENTS)'),
        eventsTable([
          ['ui-input', 'UI_EVENTS.INPUT', '{ value }', 'Live edit on ui-input, ui-number-input, ui-slider'],
          ['ui-change', 'UI_EVENTS.CHANGE', '{ value } / { checked } / { activeStep } / { value, selectedOptions }', 'Committed value change on inputs, selects, switch, tabs, stepper, segmented control, combobox'],
          ['ui-create', 'UI_EVENTS.CREATE', '{ value, label }', 'New option created in a creatable ui-combobox'],
          ['ui-open / ui-close', 'UI_EVENTS.OPEN / CLOSE', '{ presentation } / { placement } / { x, y } / {}', 'Unified overlay lifecycle across ui-dialog, ui-drawer, ui-popover, ui-menu, ui-context-menu'],
          ['ui-dismiss', 'UI_EVENTS.DISMISS', '{} / { value }', 'Dismissal on ui-alert, ui-toast, and closable ui-chip'],
          ['ui-select', 'UI_EVENTS.SELECT', '{ value, item } / { value, selected }', 'Selection on ui-menu, ui-context-menu, and selectable ui-chip'],
          ['ui-toggle', 'UI_EVENTS.TOGGLE', '{ item, open }', 'Disclosure toggle on ui-accordion-item / ui-accordion'],
          ['ui-collapse-change', 'UI_EVENTS.COLLAPSE_CHANGE', '{ collapsed }', 'Collapsible header toggle on UIHeaderedElement (ui-card, ui-table, ui-list, ui-dialog, ui-drawer, ui-progress)'],
          ['ui-sort', 'UI_EVENTS.SORT', '{ sortBy, sortDirection, data }', 'Sort change on ui-table and ui-list'],
          ['ui-page-change / ui-page-size-change', 'UI_EVENTS.PAGE_CHANGE / PAGE_SIZE_CHANGE', '{ page, pageSize, totalPages, total }', 'Pagination state updates on ui-pagination, ui-table, and ui-list'],
          ['ui-page-request', 'UI_EVENTS.PAGE_REQUEST', '{ page, pageSize, ..., reason, append, resolve }', 'Unified remote data request on ui-table, ui-list, and ui-combobox'],
          ['ui-selection-change', 'UI_EVENTS.SELECTION_CHANGE', '{ selectedKeys, selectedRows | selectedItems, ... }', 'Row/item selection change on ui-table and ui-list'],
          ['ui-row-click / ui-item-click', 'UI_EVENTS.ROW_CLICK / ITEM_CLICK', '{ row | item, index, key, selected }', 'Row or item activation on ui-table and ui-list'],
          ['ui-columns-change', 'UI_EVENTS.COLUMNS_CHANGE', '{ columns }', 'Column visibility or order update on ui-table'],
          ['ui-form-*', 'UI_EVENTS.FORM_*', 'change / submit / invalid / loading / step-error', 'Structured form lifecycle events on ui-struct-form'],
        ]),
      ]
    },
  },

  // ── Design Tokens ─────────────────────────────────────────────────────────
  {
    id: 'design-tokens',
    title: 'Design Tokens',
    tag: 'tokens.css',
    group: 'Foundation',
    description:
      'All spacing, colour, typography, shadow and geometry values are driven by CSS custom properties. Override any token to customise globally.',
    build() {
      const spacingVars = [
        ['--ui-space-4xs', 'phi^-4 ≈ 0.146em', 'Micro nudge'],
        ['--ui-space-3xs', 'phi^-3 ≈ 0.236em', 'Fine gap'],
        ['--ui-space-2xs', 'phi^-2 ≈ 0.382em', 'Small gap'],
        ['--ui-space-xs', 'phi^-1 ≈ 0.618em', 'Compact padding'],
        ['--ui-space-sm', 'phi^0 = 1.000em', 'Base unit'],
        ['--ui-space-md', 'phi^1 ≈ 1.618em', 'Standard gap'],
        ['--ui-space-lg', 'phi^2 ≈ 2.618em', 'Section gap'],
        ['--ui-space-xl', 'phi^3 ≈ 4.236em', 'Large break'],
        ['--ui-space-2xl', 'phi^4 ≈ 6.854em', 'Section break'],
      ]

      const colorRows = [
        ['--ui-color-surface', 'oklch(0.14 0.02 260)', 'Deep slate canvas'],
        ['--ui-color-primary', 'oklch(0.62 0.2 260)', 'Vibrant indigo accent'],
        ['--ui-color-accent', 'oklch(0.68 0.18 160)', 'Vibrant emerald accent'],
        ['--ui-color-success', 'oklch(0.68 0.18 145)', 'Green success'],
        ['--ui-color-danger', 'oklch(0.65 0.22 25)', 'Red danger'],
        ['--ui-color-warning', 'oklch(0.75 0.18 70)', 'Amber warning'],
        ['--ui-color-info', 'oklch(0.7 0.16 225)', 'Sky blue info'],
        ['--ui-color-text', 'oklch(0.96 0.005 260)', 'Crisp white text'],
        ['--ui-color-text-muted', 'oklch(0.78 0.02 260)', 'Readable muted text'],
      ]

      const spacingTable = document.createElement('table')
      spacingTable.className = 'props-table'
      spacingTable.innerHTML = `
        <thead><tr><th>Token</th><th>Formula</th><th>Use</th></tr></thead>
        <tbody>
          ${spacingVars.map(([t, f, u]) => `<tr>
            <td class="prop-name">${t}</td>
            <td class="prop-type">${f}</td>
            <td class="prop-desc">${u}</td>
          </tr>`).join('')}
        </tbody>
      `

      const colorTable = document.createElement('table')
      colorTable.className = 'props-table'
      colorTable.innerHTML = `
        <thead><tr><th>Token</th><th>Default value</th><th>Role</th></tr></thead>
        <tbody>
          ${colorRows.map(([t, v, r]) => `<tr>
            <td class="prop-name">${t}</td>
            <td class="prop-type">${v}</td>
            <td class="prop-desc">${r}</td>
          </tr>`).join('')}
        </tbody>
      `

      return [
        subTitle('Golden Ratio Spacing Scale'),
        spacingTable,
        subTitle('Core Colour Tokens'),
        colorTable,
        codeBlock(`/* Override tokens to customise globally */
:root {
  --ui-color-primary: oklch(0.65 0.22 310); /* Purple */
  --ui-btn-radius: var(--ui-radius-full);   /* Pill buttons */
}`, 'css'),
      ]
    },
  },

  // ── Themes ────────────────────────────────────────────────────────────────
  {
    id: 'themes',
    title: 'Themes',
    tag: 'data-theme',
    group: 'Foundation',
    description:
      'Built-in themes ship alongside the default dark matte palette. Apply via class or data-theme attribute.',
    build() {
      const themes = [
        { name: 'Default (dark)', attr: '', desc: 'Deep matte slate studio — the library base.' },
        { name: 'Neumorphic', attr: 'neumorphic', desc: 'Soft-matte light surfaces with frosted glass overlays.' },
        { name: 'Jewel Art Nouveau', attr: 'jewel-artnouveau', desc: 'Rich jewel tones with ornate flourishes.' },
      ]

      const grid = document.createElement('div')
      grid.className = 'demo-grid'

      themes.forEach(({ name, attr, desc }) => {
        const card = document.createElement('div')
        card.style.cssText = `
          padding: 14px;
          border: 1px solid var(--docs-border);
          border-radius: 10px;
          background: var(--docs-card-bg);
          font-size: 0.8rem;
        `
        card.innerHTML = `
          <div style="font-weight:600; margin-bottom:4px; color: var(--docs-text)">${name}</div>
          <div style="color: var(--docs-text-muted); margin-bottom:10px; font-size:0.75rem">${desc}</div>
          ${attr ? `<code class="prop-name" style="font-size:0.7rem">data-theme="${attr}"</code>` : `<code class="prop-name" style="font-size:0.7rem">(base)</code>`}
        `
        grid.appendChild(card)
      })

      return [
        grid,
        codeBlock(`<!-- Apply neumorphic theme to a subtree -->
<div data-theme="neumorphic">
  <ui-button>Neumorphic Button</ui-button>
  <ui-card>…</ui-card>
</div>

<!-- Or via class -->
<div class="theme-neumorphic">…</div>`, 'html'),
        subTitle('Theme note'),
        (() => {
          const p = document.createElement('p')
          p.className = 'section-description'
          p.style.marginTop = '0'
          p.textContent = 'Themes ship as CSS files that override the token variables for a specific selector. A theme showcase section with live switching will be added in the next iteration.'
          return p
        })(),
      ]
    },
  },

  // ── Header Surfaces ───────────────────────────────────────────────────────
  {
    id: 'header-surfaces',
    title: 'Header Surfaces',
    tag: 'header-surface',
    group: 'Foundation',
    description:
      'Architectural visual hierarchy for card, dialog, drawer, and table headers. Supported by all components extending UIHeaderedElement.',
    build() {
      const surfaces = ['flat', 'raised', 'sunken', 'banner', 'accent']
      return [
        subTitle('All Header Surfaces'),
        demoBlock({
          label: 'flat · raised · sunken · banner · accent',
          html: `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
              ${surfaces.map(surface => `
                <ui-card header-surface="${surface}">
                  <span slot="header">${surface.charAt(0).toUpperCase() + surface.slice(1)} Surface</span>
                  <div style="font-size: 0.8rem; color: var(--docs-text-muted);">
                    <code>header-surface="${surface}"</code> provides distinct background, border, and text contrast.
                  </div>
                </ui-card>
              `).join('')}
            </div>
          `,
        }),
        codeBlock(`<!-- Apply header-surface to any UIHeaderedElement: ui-card, ui-dialog, ui-drawer, ui-table, ui-list, ui-progress -->
<ui-card header-surface="flat">
  <span slot="header">Flat Header</span>
  Card body…
</ui-card>

<ui-card header-surface="raised">
  <span slot="header">Raised Header</span>
  Card body…
</ui-card>

<ui-card header-surface="sunken">
  <span slot="header">Sunken Header</span>
  Card body…
</ui-card>

<ui-card header-surface="banner">
  <span slot="header">Banner Header</span>
  Card body…
</ui-card>

<ui-card header-surface="accent">
  <span slot="header">Accent Header</span>
  Card body…
</ui-card>`),

        subTitle('Supported Components'),
        propsTable([
          ['ui-card', 'Component', "'flat'", 'Card surface header'],
          ['ui-dialog', 'Component', "'flat'", 'Modal dialog header banner'],
          ['ui-drawer', 'Component', "'flat'", 'Drawer slide-out top header'],
          ['ui-list', 'Component', "'flat'", 'List collection title header'],
          ['ui-table', 'Component', "'flat'", 'Data table title header'],
          ['ui-progress', 'Component', "'flat'", 'Progress header surface'],
        ]),

        subTitle('Events (UIHeaderedElement)'),
        eventsTable([
          ['ui-collapse-change', 'UICollapseChangeEvent', '{ collapsed: boolean }', 'Fired when any collapsible headered surface is toggled'],
        ]),
      ]
    },
  },

  // ── Segmented Control ─────────────────────────────────────────────────────
  {
    id: 'segmented-control',
    title: 'Segmented Control',
    tag: 'ui-segmented-control',
    group: 'Actions',
    description:
      'Linear toggle button group for mutually exclusive options with animated indicator pill and keyboard roving focus.',
    build() {
      return [
        subTitle('Standard Segmented Control'),
        demoBlock({
          label: 'Day / Week / Month / Year',
          html: `
            <ui-segmented-control value="week">
              <ui-segment-item value="day">Day</ui-segment-item>
              <ui-segment-item value="week">Week</ui-segment-item>
              <ui-segment-item value="month">Month</ui-segment-item>
              <ui-segment-item value="year">Year</ui-segment-item>
            </ui-segmented-control>
          `,
          setup(preview) {
            const ctrl = preview.querySelector('ui-segmented-control')
            const log = document.createElement('div')
            log.style.cssText = 'margin-top: 8px; font-size: 0.8rem; color: var(--docs-text-muted);'
            log.textContent = 'Selected: week'
            preview.appendChild(log)
            ctrl.addEventListener('ui-change', (e) => {
              log.textContent = `Selected: ${e.detail.value}`
            })
          },
        }),
        codeBlock(`<ui-segmented-control value="week">
  <ui-segment-item value="day">Day</ui-segment-item>
  <ui-segment-item value="week">Week</ui-segment-item>
  <ui-segment-item value="month">Month</ui-segment-item>
  <ui-segment-item value="year">Year</ui-segment-item>
</ui-segmented-control>`),

        subTitle('Sizes & Disabled Item'),
        demoBlock({
          label: 'Small and Large variants with disabled item',
          html: `
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <ui-segmented-control size="sm" value="list">
                <ui-segment-item value="grid">Grid</ui-segment-item>
                <ui-segment-item value="list">List</ui-segment-item>
                <ui-segment-item value="table" disabled>Table</ui-segment-item>
              </ui-segmented-control>
              <ui-segmented-control size="lg" value="code">
                <ui-segment-item value="preview">Preview</ui-segment-item>
                <ui-segment-item value="code">Code</ui-segment-item>
              </ui-segmented-control>
            </div>
          `,
        }),

        subTitle('Properties'),
        propsTable([
          ['value', 'string', "''", 'Currently selected segment value'],
          ['size', "'sm'|'md'|'lg'", "'md'", 'Size of the segmented control'],
          ['full-width', 'boolean', 'false', 'Stretches control across container width'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-change', 'UISegmentedControlChangeEvent', '{ value: string }', 'Fired when the selected segment changes'],
        ]),
      ]
    },
  },

  // ── Select ────────────────────────────────────────────────────────────────
  {
    id: 'select',
    title: 'Select',
    tag: 'ui-select',
    group: 'Forms',
    description:
      'Accessible styled dropdown select element supporting option items, placeholder, sizes, prefix slot, and error states.',
    build() {
      return [
        subTitle('Basic Select'),
        demoBlock({
          label: 'Select with placeholder',
          html: `
            <div style="max-width: 320px;">
              <ui-select placeholder="Choose a region…" value="">
                <option value="us-east">US East (N. Virginia)</option>
                <option value="us-west">US West (Oregon)</option>
                <option value="eu-central">EU Central (Frankfurt)</option>
                <option value="ap-southeast">AP Southeast (Tokyo)</option>
              </ui-select>
            </div>
          `,
        }),
        codeBlock(`<ui-select placeholder="Choose a region…" value="us-east">
  <option value="us-east">US East (N. Virginia)</option>
  <option value="us-west">US West (Oregon)</option>
  <option value="eu-central">EU Central (Frankfurt)</option>
</ui-select>`),

        subTitle('Sizes & States'),
        demoBlock({
          label: 'Small, Disabled, and Invalid',
          html: `
            <div style="display: flex; flex-direction: column; gap: 12px; max-width: 320px;">
              <ui-select size="sm" value="low">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </ui-select>
              <ui-select disabled value="archived">
                <option value="archived">Archived State</option>
              </ui-select>
              <ui-select invalid value="">
                <option value="" disabled selected>Required selection missing</option>
                <option value="valid">Valid Option</option>
              </ui-select>
            </div>
          `,
        }),

        subTitle('Properties'),
        propsTable([
          ['value', 'string', "''", 'Selected option value'],
          ['placeholder', 'string', "''", 'Placeholder text when no option is selected'],
          ['size', "'sm'|'md'|'lg'", "'md'", 'Size of the select input'],
          ['disabled', 'boolean', 'false', 'Disables user interaction'],
          ['invalid', 'boolean', 'false', 'Applies error border and outline'],
          ['required', 'boolean', 'false', 'Marks field as required'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-change', 'UISelectChangeEvent', '{ value: string }', 'Fired when the selected option changes'],
        ]),
      ]
    },
  },

  // ── Combobox ──────────────────────────────────────────────────────────────
  {
    id: 'combobox',
    title: 'Combobox',
    tag: 'ui-combobox',
    group: 'Forms',
    description:
      'Generic searchable select &amp; tag combobox (<code>UICombobox&lt;O&gt;</code>) supporting multi-select chips, creatable options, virtual scrolling, and remote search/infinite-scroll paging.',
    build() {
      return [
        subTitle('Searchable Multi-Select & Creatable'),
        demoBlock({
          label: 'Type to filter, select multiple tags, or create a new tag',
          html: `
            <div style="max-width: 380px;">
              <ui-combobox id="demo-combobox" multiple creatable placeholder="Select or create tags…"></ui-combobox>
              <div id="demo-combobox-log" style="margin-top: 8px; font-size: 0.8rem; color: var(--docs-text-muted);">Selected: []</div>
            </div>
          `,
          setup(preview) {
            const combo = preview.querySelector('#demo-combobox')
            const log = preview.querySelector('#demo-combobox-log')
            combo.options = [
              { value: 'ts', label: 'TypeScript', description: 'Typed JavaScript' },
              { value: 'lit', label: 'Lit', description: 'Fast Web Components' },
              { value: 'oklch', label: 'OKLCH', description: 'Perceptual colour space' },
              { value: 'a11y', label: 'Accessibility', description: 'WCAG AAA contrast & ARIA' },
            ]
            combo.addEventListener('ui-change', (e) => {
              log.textContent = `Selected: ${JSON.stringify(e.detail.value)}`
            })
          },
        }),
        codeBlock(`const combo = document.querySelector('ui-combobox')
combo.options = [
  { value: 'us-east', label: 'US East' },
  { value: 'eu-west', label: 'EU West' },
]
combo.addEventListener('ui-change', (e) => {
  console.log(e.detail.value, e.detail.selectedOptions)
})
combo.addEventListener('ui-page-request', async (e) => {
  const { page, search, append, resolve } = e.detail
  const res = await fetchOptions({ page, search })
  resolve({ options: res.options, total: res.total })
})`, 'ts'),

        subTitle('Properties'),
        propsTable([
          ['options', 'O[]', '[]', 'Array of option objects ({ value, label, description?, disabled? })'],
          ['value', "O['value'] | O['value'][] | ''", "''", 'Selected value or array of values (in multiple mode)'],
          ['multiple', 'boolean', 'false', 'Enables multi-select chip tags'],
          ['searchable', 'boolean', 'true', 'Allows filtering options by typing'],
          ['creatable', 'boolean', 'false', 'Allows creating a new option when no exact match exists'],
          ['remote', 'boolean', 'false', 'Emits debounced ui-page-request on search and scroll'],
          ['virtual', 'boolean | ComboboxVirtualConfig', 'false', 'Windowed virtual list for large option sets'],
          ['debounce-ms', 'number', '250', 'Debounce delay in ms for remote search'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-change', 'UIComboboxChangeEvent<O>', '{ value, selectedOptions }', 'Fired when selection changes'],
          ['ui-create', 'UIComboboxCreateEvent', '{ value, label }', 'Fired when a new option is created in creatable mode'],
          ['ui-page-request', 'UIComboboxPageRequestEvent<O>', '{ page, pageSize, search, reason, append, resolve }', 'Fired on remote search or dropdown infinite scroll; call resolve({ options, total })'],
        ]),
      ]
    },
  },

  // ── Number Input ──────────────────────────────────────────────────────────
  {
    id: 'number-input',
    title: 'Number Input',
    tag: 'ui-number-input',
    group: 'Forms',
    description:
      'Precision numeric input with stepper increment/decrement controls, min/max limits, keyboard arrow stepping, and precision rounding.',
    build() {
      return [
        subTitle('Standard Stepper'),
        demoBlock({
          label: 'Integer Stepper (min: 0, max: 100, step: 5)',
          html: `
            <div style="max-width: 240px;">
              <ui-number-input value="25" min="0" max="100" step="5"></ui-number-input>
            </div>
          `,
          setup(preview) {
            const input = preview.querySelector('ui-number-input')
            const log = document.createElement('div')
            log.style.cssText = 'margin-top: 8px; font-size: 0.8rem; color: var(--docs-text-muted);'
            log.textContent = 'Current value: 25'
            preview.appendChild(log)
            input.addEventListener('ui-change', (e) => {
              log.textContent = `Current value: ${e.detail.value}`
            })
          },
        }),
        codeBlock(`<ui-number-input value="25" min="0" max="100" step="5"></ui-number-input>`),

        subTitle('Precision & Sizes'),
        demoBlock({
          label: 'Decimal precision (step: 0.25, precision: 2) and Small variant',
          html: `
            <div style="display: flex; flex-direction: column; gap: 12px; max-width: 240px;">
              <ui-number-input value="19.99" step="0.25" precision="2"></ui-number-input>
              <ui-number-input size="sm" value="3" min="1" max="10"></ui-number-input>
              <ui-number-input size="lg" value="50"></ui-number-input>
            </div>
          `,
        }),

        subTitle('Properties'),
        propsTable([
          ['value', 'number', '0', 'Current numeric value'],
          ['min', 'number', 'undefined', 'Minimum allowed value'],
          ['max', 'number', 'undefined', 'Maximum allowed value'],
          ['step', 'number', '1', 'Amount to increment/decrement per step'],
          ['precision', 'number', 'undefined', 'Number of decimal places to round to'],
          ['size', "'sm'|'md'|'lg'", "'md'", 'Size of input and buttons'],
          ['disabled', 'boolean', 'false', 'Disables interaction'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-input', 'UINumberInputEvent', '{ value: number }', 'Fired while typing or stepping'],
          ['ui-change', 'UINumberInputChangeEvent', '{ value: number }', 'Fired when committed or stepped'],
        ]),
      ]
    },
  },

  // ── Slider ────────────────────────────────────────────────────────────────
  {
    id: 'slider',
    title: 'Slider',
    tag: 'ui-slider',
    group: 'Forms',
    description:
      'Range slider with live value bubble, min/max limits, step ticks, and optional prefix/suffix slots.',
    build() {
      return [
        subTitle('Range Slider with Value Badge'),
        demoBlock({
          label: 'Volume level (0 to 100 with show-value)',
          html: `
            <div style="max-width: 360px;">
              <ui-slider value="65" min="0" max="100" show-value></ui-slider>
            </div>
          `,
        }),
        codeBlock(`<ui-slider value="65" min="0" max="100" show-value></ui-slider>`),

        subTitle('Prefix & Suffix Slots'),
        demoBlock({
          label: 'Brightness with icon prefix & suffix',
          html: `
            <div style="max-width: 360px;">
              <ui-slider value="40" min="0" max="100">
                <span slot="prefix" style="font-size: 0.9rem;">🌑</span>
                <span slot="suffix" style="font-size: 0.9rem;">🌕</span>
              </ui-slider>
            </div>
          `,
        }),

        subTitle('Properties'),
        propsTable([
          ['value', 'number', '0', 'Current value of the slider'],
          ['min', 'number', '0', 'Minimum slider value'],
          ['max', 'number', '100', 'Maximum slider value'],
          ['step', 'number', '1', 'Step increment'],
          ['show-value', 'boolean', 'false', 'Displays current value badge alongside track'],
          ['disabled', 'boolean', 'false', 'Disables slider interaction'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-input', 'UISliderInputEvent', '{ value: number }', 'Fired continuously while dragging the thumb'],
          ['ui-change', 'UISliderChangeEvent', '{ value: number }', 'Fired when the slider value is committed'],
        ]),
      ]
    },
  },

  // ── Field ─────────────────────────────────────────────────────────────────
  {
    id: 'field',
    title: 'Field',
    tag: 'ui-field',
    group: 'Forms',
    description:
      'Light DOM layout wrapper providing accessible <code>&lt;label&gt;</code>, required indicator, helper text, and error validation linked via native <code>aria-describedby</code>.',
    build() {
      return [
        subTitle('Standard Field'),
        demoBlock({
          label: 'Field with label, helper, and required marker',
          html: `
            <div style="max-width: 360px;">
              <ui-field label="Workspace Name" required helper="Must be unique across your organization.">
                <ui-input placeholder="e.g. quantum-lab"></ui-input>
              </ui-field>
            </div>
          `,
        }),
        codeBlock(`<ui-field label="Workspace Name" required helper="Must be unique across your organization.">
  <ui-input placeholder="e.g. quantum-lab"></ui-input>
</ui-field>`),

        subTitle('Validation Error State'),
        demoBlock({
          label: 'Field with error message',
          html: `
            <div style="max-width: 360px;">
              <ui-field label="Email Address" required error="Please enter a valid work email.">
                <ui-input value="invalid-email@" invalid></ui-input>
              </ui-field>
            </div>
          `,
        }),

        subTitle('Properties'),
        propsTable([
          ['label', 'string', "''", 'Field label text'],
          ['required', 'boolean', 'false', 'Appends a required asterisk to label'],
          ['helper', 'string', "''", 'Descriptive helper text beneath input'],
          ['error', 'string', "''", 'Validation error message (replaces helper text in red)'],
          ['orientation', "'vertical'|'horizontal'", "'vertical'", 'Layout orientation of label and control'],
        ]),
      ]
    },
  },

  // ── Struct Form ───────────────────────────────────────────────────────────
  {
    id: 'struct-form',
    title: 'Struct Form',
    tag: 'ui-struct-form',
    group: 'Forms',
    description:
      'Dynamic schema-driven form generator rendered in Light DOM for direct visibility, styling, and accessibility, automatically composing Collidor UI controls from field definitions.',
    build() {
      return [
        subTitle('Dynamic Form Generation'),
        demoBlock({
          label: 'Configured with text, number, select, and switch fields',
          html: `
            <div style="max-width: 440px;">
              <ui-struct-form id="demo-struct-form" submit-label="Save Settings"></ui-struct-form>
              <pre id="struct-form-output" style="margin-top: 12px; padding: 10px; border-radius: 6px; background: var(--docs-code-bg); font-size: 0.75rem; color: var(--docs-accent); min-height: 24px; border: 1px solid var(--docs-border);">Form submitted data will appear here…</pre>
            </div>
          `,
          setup(preview) {
            const form = preview.querySelector('#demo-struct-form')
            const output = preview.querySelector('#struct-form-output')
            form.fields = [
              { key: 'clusterName', label: 'Cluster Name', widget: 'text', defaultValue: 'Primary-US-East', required: true },
              { key: 'replicas', label: 'Replica Count', widget: 'number', defaultValue: 3, widgetProps: { min: 1, max: 10 } },
              { key: 'region', label: 'Deployment Region', widget: 'select', defaultValue: 'us-east-1', options: [
                { value: 'us-east-1', label: 'US East (N. Virginia)' },
                { value: 'eu-west-1', label: 'EU West (Ireland)' },
                { value: 'ap-east-1', label: 'AP East (Hong Kong)' },
              ]},
              { key: 'autoScale', label: 'Enable Auto-Scaling', widget: 'switch', defaultValue: true },
            ]
            form.addEventListener('ui-form-submit', (e) => {
              output.textContent = JSON.stringify(e.detail.values, null, 2)
            })
          },
        }),
        codeBlock(`const form = document.querySelector('ui-struct-form')
form.fields = [
  { key: 'clusterName', label: 'Cluster Name', widget: 'text', defaultValue: 'Cluster-1' },
  { key: 'replicas', label: 'Replicas', widget: 'number', defaultValue: 3 },
  { key: 'autoScale', label: 'Auto-Scaling', widget: 'switch', defaultValue: true },
]
form.addEventListener('ui-form-submit', (e) => console.log(e.detail.values))`, 'js'),

        subTitle('Properties'),
        propsTable([
          ['fields', 'StructFormField[]', '[]', 'Array of field descriptors defining keys, labels, widgets'],
          ['values', 'TValues', '{}', 'Initial or controlled form values (generic via UIStructForm<TValues>)'],
          ['submit-label', 'string', "'Submit'", 'Text on the submit button'],
          ['bordered', 'boolean', 'false', 'Adds an outer container border'],
          ['dense', 'boolean', 'false', 'Compact spacing between form rows'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-form-change', 'UIStructFormChangeEvent<TValues>', '{ values, fieldKey, fieldValue }', 'Fired whenever any field value changes'],
          ['ui-form-submit', 'UIStructFormSubmitEvent<TValues>', '{ values }', 'Fired when validation passes and the form is submitted'],
          ['ui-form-invalid', 'UIStructFormInvalidEvent<TValues>', '{ errors, values }', 'Fired when submission fails validation'],
          ['ui-form-loading', 'UIStructFormLoadingEvent', '{ loading, fieldKey }', 'Fired when an async field dataSource starts or finishes loading'],
          ['ui-form-step-error', 'UIStructFormStepErrorEvent', '{ stepKey, errors }', 'Fired when advancing a wizard step fails validation'],
        ]),
      ]
    },
  },

  // ── Toast ─────────────────────────────────────────────────────────────────
  {
    id: 'toast',
    title: 'Toast',
    tag: 'ui-toast',
    group: 'Feedback',
    description:
      'Non-blocking floating notifications with auto-dismiss timers, progress bars, custom icons, and action callbacks.',
    build() {
      return [
        subTitle('Dispatch Toasts'),
        demoBlock({
          label: 'Click buttons to spawn toast notifications in the bottom-right corner',
          html: `
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <ui-button variant="success" id="btn-toast-success">Success Toast</ui-button>
              <ui-button variant="danger" id="btn-toast-danger">Danger Toast</ui-button>
              <ui-button variant="accent" id="btn-toast-accent">Accent Toast</ui-button>
              <ui-button variant="outline" id="btn-toast-info">Info Toast</ui-button>
            </div>
          `,
          setup(preview) {
            const container = document.getElementById('docs-toast-container')
            preview.querySelector('#btn-toast-success').addEventListener('click', () => {
              container?.notify({ title: 'Build Succeeded', message: 'Project compiled into dist/ in 120ms.', variant: 'success', duration: 4000 })
            })
            preview.querySelector('#btn-toast-danger').addEventListener('click', () => {
              container?.notify({ title: 'Connection Refused', message: 'Failed to reach API gateway socket.', variant: 'danger', duration: 4000 })
            })
            preview.querySelector('#btn-toast-accent').addEventListener('click', () => {
              container?.notify({ title: 'New Release', message: 'Version 0.2.0 is ready for deployment.', variant: 'accent', duration: 4000 })
            })
            preview.querySelector('#btn-toast-info').addEventListener('click', () => {
              container?.notify({ title: 'Indexing Started', message: 'Scanning 1,420 graph nodes…', variant: 'info', duration: 3000 })
            })
          },
        }),
        codeBlock(`const container = document.querySelector('ui-toast-container')
container.notify({
  title: 'Build Succeeded',
  message: 'Compiled bundle in 120ms',
  variant: 'success',
  duration: 4000
})`, 'js'),

        subTitle('Properties'),
        propsTable([
          ['variant', "'primary'|'success'|'warning'|'danger'|'accent'|'info'", "'info'", 'Color variant of toast'],
          ['title', 'string', "''", 'Bold title header'],
          ['duration', 'number', '4000', 'Auto-dismiss timeout in ms (0 for persistent)'],
          ['closable', 'boolean', 'true', 'Shows close X button'],
        ]),

        subTitle('Events — ui-toast / ui-toast-container'),
        eventsTable([
          ['ui-dismiss', 'UIToastDismissEvent', '{}', 'Fired when a toast is dismissed by button, timer, or dismiss()'],
        ]),
      ]
    },
  },

  // ── Live Announcer ────────────────────────────────────────────────────────
  {
    id: 'announcer',
    title: 'Live Announcer',
    tag: 'announceLive',
    group: 'Feedback',
    description:
      'Accessible screen-reader live region announcer singleton. Bypasses Shadow DOM encapsulation to guarantee VoiceOver, NVDA, and JAWS catch notifications.',
    build() {
      return [
        subTitle('Screen Reader Trigger'),
        demoBlock({
          label: 'Trigger polite or assertive announcement',
          html: `
            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
              <ui-button variant="primary" id="announce-polite-btn">Announce Polite</ui-button>
              <ui-button variant="danger" id="announce-assertive-btn">Announce Assertive</ui-button>
              <span id="announce-status" style="font-size: 0.8rem; color: var(--docs-text-muted);">Click a button to test</span>
            </div>
          `,
          setup(preview) {
            const status = preview.querySelector('#announce-status')
            preview.querySelector('#announce-polite-btn').addEventListener('click', () => {
              announceLive('Filter applied: showing 42 results', 'polite')
              status.textContent = 'Polite announcement broadcast: "Filter applied: showing 42 results"'
            })
            preview.querySelector('#announce-assertive-btn').addEventListener('click', () => {
              announceLive('Network connection lost! Please reconnect.', 'assertive')
              status.textContent = 'Assertive announcement broadcast: "Network connection lost! Please reconnect."'
            })
          },
        }),
        codeBlock(`import { announceLive } from '@collidor/ui'

// Polite announcement (waits until speech queue finishes)
announceLive('Search returned 14 matches', 'polite')

// Assertive announcement (interrupts current speech immediately)
announceLive('Network connection lost! Please reconnect.', 'assertive')`, 'ts'),

        subTitle('API Parameters'),
        propsTable([
          ['message', 'string', '—', 'The text string broadcast to assistive technology'],
          ['priority', "'polite' | 'assertive'", "'polite'", 'aria-live: polite queues speech, assertive interrupts'],
        ]),
      ]
    },
  },

  // ── Icon ──────────────────────────────────────────────────────────────────
  {
    id: 'icon',
    title: 'Icon',
    tag: 'ui-icon',
    group: 'Display',
    description:
      'Inline SVG icon component providing built-in UI glyphs with customizable size and currentColor inheritance.',
    build() {
      const iconNames = [
        'check', 'close', 'plus', 'minus', 'play', 'pause', 'stop',
        'settings', 'refresh', 'trash', 'info', 'warning', 'help',
        'chevron-down', 'chevron-right', 'chevron-up', 'chevron-left',
        'grid', 'link', 'eye', 'eye-off'
      ]
      return [
        subTitle('Built-in Glyphs'),
        demoBlock({
          label: 'Available icons in Collidor UI',
          html: `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 10px;">
              ${iconNames.map(name => `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 6px; border: 1px solid var(--docs-border); border-radius: 8px; background: var(--docs-card-bg); font-size: 0.72rem; gap: 6px;">
                  <ui-icon name="${name}" size="20px"></ui-icon>
                  <span style="color: var(--docs-text-muted);">${name}</span>
                </div>
              `).join('')}
            </div>
          `,
        }),
        codeBlock(`<ui-icon name="check" size="18px"></ui-icon>
<ui-icon name="settings" size="24px" style="color: var(--ui-color-accent);"></ui-icon>`),

        subTitle('Properties'),
        propsTable([
          ['name', 'string', "''", 'Icon name glyph identifier'],
          ['size', 'string', "'1em'", 'CSS dimension for width and height'],
          ['label', 'string', "''", 'Accessible label for screen readers'],
        ]),
      ]
    },
  },

  // ── Pagination ────────────────────────────────────────────────────────────
  {
    id: 'pagination',
    title: 'Pagination',
    tag: 'ui-pagination',
    group: 'Navigation',
    description:
      'Configurable pagination bar featuring discrete page numbering, stepper controls (-+ or arrows), and a composite combo button with roving tabindex (single Tab stop, arrow navigation, Space activation).',
    build() {
      return [
        subTitle('Discrete Pages with Combo Button'),
        demoBlock({
          label: 'Discrete numbering (page 3 of 12, total 120 items)',
          html: `
            <ui-pagination page="3" page-size="10" total="120" discrete-pages></ui-pagination>
          `,
          setup(preview) {
            const pager = preview.querySelector('ui-pagination')
            const log = document.createElement('div')
            log.style.cssText = 'margin-top: 8px; font-size: 0.8rem; color: var(--docs-text-muted);'
            log.textContent = 'Current page: 3'
            preview.appendChild(log)
            pager.addEventListener('ui-page-change', (e) => {
              log.textContent = `Page changed to: ${e.detail.page} of ${e.detail.totalPages}`
            })
            pager.addEventListener('ui-page-size-change', (e) => {
              log.textContent = `Page size changed to: ${e.detail.pageSize} (page ${e.detail.page} of ${e.detail.totalPages})`
            })
          },
        }),
        codeBlock(`<ui-pagination page="3" page-size="10" total="120" discrete-pages></ui-pagination>`),

        subTitle('Stepper Format (-+ Mode) & Small Size'),
        demoBlock({
          label: 'Stepper mode with -+ controls and compact sizing',
          html: `
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <ui-pagination page="5" page-size="10" total="80" mode="stepper" stepper-format="-+"></ui-pagination>
              <ui-pagination size="sm" page="2" page-size="20" total="200" discrete-pages></ui-pagination>
            </div>
          `,
        }),

        subTitle('Properties'),
        propsTable([
          ['page', 'number', '1', 'Current active page number (1-indexed)'],
          ['page-size', 'number', '10', 'Number of items per page'],
          ['total', 'number', '0', 'Total number of items in dataset'],
          ['mode', "'full'|'stepper'|'discrete'|'-+'", "'full'", 'Display mode of controls'],
          ['stepper-format', "'arrows'|'-+'", "'arrows'", 'Icon format for stepper controls'],
          ['discrete-pages', 'boolean', 'true', 'Shows numbered discrete page buttons'],
          ['first-last', 'boolean', 'true', 'Shows jump-to-first and jump-to-last buttons'],
          ['size', "'sm'|'md'|'lg'", "'md'", 'Size of pagination bar and buttons'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-page-change', 'UIPageChangeEvent', '{ page, pageSize, totalPages, total }', 'Fired when navigating to a different page'],
          ['ui-page-size-change', 'UIPageSizeChangeEvent', '{ page, pageSize, totalPages, total }', 'Fired when the page size selector changes (does not duplicate ui-page-change)'],
        ]),
      ]
    },
  },

  // ── Stepper ───────────────────────────────────────────────────────────────
  {
    id: 'stepper',
    title: 'Stepper',
    tag: 'ui-stepper',
    group: 'Navigation',
    description:
      'Multi-step progress and wizard navigation (<code>&lt;ui-stepper&gt;</code> with <code>&lt;ui-step&gt;</code> children) with keyboard arrow navigation and completed step indicators.',
    build() {
      return [
        subTitle('Interactive Stepper'),
        demoBlock({
          label: 'Click steps or use arrow keys to navigate',
          html: `
            <div style="width: 100%;">
              <ui-stepper id="demo-stepper" active-step="1">
                <ui-step step="1" label="Account" description="Basic details"></ui-step>
                <ui-step step="2" label="Workspace" description="Region & plan"></ui-step>
                <ui-step step="3" label="Confirm" description="Review & launch"></ui-step>
              </ui-stepper>
              <div id="demo-stepper-log" style="margin-top: 8px; font-size: 0.8rem; color: var(--docs-text-muted);">Active step index: 1</div>
            </div>
          `,
          setup(preview) {
            const stepper = preview.querySelector('#demo-stepper')
            const log = preview.querySelector('#demo-stepper-log')
            stepper.addEventListener('ui-change', (e) => {
              log.textContent = `Active step index: ${e.detail.activeStep}`
            })
          },
        }),
        codeBlock(`<ui-stepper active-step="0">
  <ui-step step="1" label="Account" description="Basic details"></ui-step>
  <ui-step step="2" label="Workspace" description="Region & plan"></ui-step>
  <ui-step step="3" label="Confirm" description="Review & launch"></ui-step>
</ui-stepper>`),

        subTitle('Properties — ui-stepper'),
        propsTable([
          ['active-step', 'number', '0', 'Zero-based index of the active step'],
          ['orientation', "'horizontal'|'vertical'", "'horizontal'", 'Layout orientation of step items'],
        ]),

        subTitle('Events — ui-stepper'),
        eventsTable([
          ['ui-change', 'UIStepperChangeEvent', '{ activeStep: number }', 'Fired when the active step changes via click or keyboard'],
        ]),
      ]
    },
  },

  // ── Menu ──────────────────────────────────────────────────────────────────
  {
    id: 'menu',
    title: 'Menu',
    tag: 'ui-menu',
    group: 'Navigation',
    description:
      'Keyboard-accessible action menu with roving focus, shortcuts, icon support, dividers, and destructive item styling.',
    build() {
      return [
        subTitle('Standard Menu'),
        demoBlock({
          label: 'Interactive action menu',
          html: `
            <div style="max-width: 240px; border: 1px solid var(--docs-border); border-radius: 8px; padding: 4px; background: var(--docs-card-bg);">
              <ui-menu id="demo-menu">
                <ui-menu-item value="cut" icon="✂️" shortcut="⌘X">Cut</ui-menu-item>
                <ui-menu-item value="copy" icon="📄" shortcut="⌘C">Copy</ui-menu-item>
                <ui-menu-item value="paste" icon="📋" shortcut="⌘V">Paste</ui-menu-item>
                <ui-menu-divider></ui-menu-divider>
                <ui-menu-item value="archive" icon="📦">Archive</ui-menu-item>
                <ui-menu-item value="delete" icon="🗑️" danger shortcut="⌫">Delete</ui-menu-item>
              </ui-menu>
            </div>
            <div id="menu-selection-log" style="margin-top: 8px; font-size: 0.8rem; color: var(--docs-text-muted);">Click an item to see selection</div>
          `,
          setup(preview) {
            const menu = preview.querySelector('#demo-menu')
            const log = preview.querySelector('#menu-selection-log')
            menu.addEventListener('ui-select', (e) => {
              log.textContent = `Selected action: ${e.detail.value}`
            })
          },
        }),

        subTitle('Dropdown Menu via Trigger Button'),
        demoBlock({
          label: 'Button with anchored dropdown menu',
          html: `
            <div style="display: flex; gap: 12px; align-items: center;">
              <ui-button variant="primary" id="btn-menu-dropdown">Options ▾</ui-button>
              <ui-menu trigger="#btn-menu-dropdown">
                <ui-menu-item value="profile" icon="👤">View Profile</ui-menu-item>
                <ui-menu-item value="settings" icon="⚙️">Settings</ui-menu-item>
                <ui-menu-divider></ui-menu-divider>
                <ui-menu-item value="logout" icon="🚪" danger>Sign Out</ui-menu-item>
              </ui-menu>
              <span id="dropdown-menu-log" style="font-size: 0.8rem; color: var(--docs-text-muted);">Click Options to open dropdown</span>
            </div>
          `,
          setup(preview) {
            const menu = preview.querySelector('ui-menu[trigger]')
            const log = preview.querySelector('#dropdown-menu-log')
            menu.addEventListener('ui-select', (e) => {
              log.textContent = `Dropdown selected: ${e.detail.value}`
            })
          },
        }),
        codeBlock(`<!-- Inline Action Menu -->
<ui-menu>
  <ui-menu-item value="cut" icon="✂️" shortcut="⌘X">Cut</ui-menu-item>
  <ui-menu-item value="copy" icon="📄" shortcut="⌘C">Copy</ui-menu-item>
  <ui-menu-divider></ui-menu-divider>
  <ui-menu-item value="delete" icon="🗑️" danger>Delete</ui-menu-item>
</ui-menu>

<!-- Dropdown Menu attached to button -->
<ui-button id="btn-options">Options ▾</ui-button>
<ui-menu trigger="#btn-options">
  <ui-menu-item value="profile">Profile</ui-menu-item>
  <ui-menu-item value="logout" danger>Logout</ui-menu-item>
</ui-menu>`),

        subTitle('Properties'),
        propsTable([
          ['value', 'string', "''", 'Value emitted on menu item selection'],
          ['icon', 'string', "''", 'Emoji or glyph shown on the left'],
          ['shortcut', 'string', "''", 'Keyboard shortcut badge on the right'],
          ['danger', 'boolean', 'false', 'Styles item in semantic red for destructive actions'],
          ['disabled', 'boolean', 'false', 'Disables item from selection and keyboard focus'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-select', 'UIMenuSelectEvent', '{ value: string; item: UIMenuItem }', 'Fired when a menu item is activated by click or keyboard'],
          ['ui-open', 'UIMenuOpenEvent', '{}', 'Fired when a dropdown menu opens'],
          ['ui-close', 'UIMenuCloseEvent', '{}', 'Fired when a dropdown menu closes'],
        ]),
      ]
    },
  },

  // ── List ──────────────────────────────────────────────────────────────────
  {
    id: 'list',
    title: 'List',
    tag: 'ui-list',
    group: 'Data',
    description:
      'Data-driven list component featuring search filtering, sort ordering, single or multi-selection, layout switching, and pagination.',
    build() {
      return [
        subTitle('Interactive Data List'),
        demoBlock({
          label: 'Searchable, selectable list with badges and metadata',
          html: `
            <ui-list id="demo-data-list" selectable pagination page-size="4" search-placeholder="Filter services…"></ui-list>
          `,
          setup(preview) {
            const list = preview.querySelector('#demo-data-list')
            list.data = [
              { id: '1', title: 'Auth Gateway', subtitle: 'OAuth2 / OpenID Connect provider', badge: 'Active', latency: '4ms', version: 'v2.4' },
              { id: '2', title: 'Payment Processing', subtitle: 'Stripe webhook receiver & billing engine', badge: 'Active', latency: '12ms', version: 'v1.8' },
              { id: '3', title: 'Image Optimizer', subtitle: 'WebP / AVIF on-the-fly transcoder', badge: 'Idle', latency: '24ms', version: 'v3.1' },
              { id: '4', title: 'Event Broker', subtitle: 'Distributed Kafka streaming bridge', badge: 'Warning', latency: '82ms', version: 'v0.9' },
              { id: '5', title: 'Telemetry Ingest', subtitle: 'OpenTelemetry collector and log scraper', badge: 'Active', latency: '8ms', version: 'v2.1' },
              { id: '6', title: 'Email Dispatcher', subtitle: 'Transactional email queue worker', badge: 'Active', latency: '15ms', version: 'v1.2' },
            ]
          },
        }),
        codeBlock(`const list = document.querySelector('ui-list')
list.data = [
  { id: '1', title: 'Auth Gateway', subtitle: 'OAuth2 provider', badge: 'Active' },
  { id: '2', title: 'Event Broker', subtitle: 'Kafka pipeline', badge: 'Warning' }
]`, 'js'),

        subTitle('Properties'),
        propsTable([
          ['data', 'T[]', '[]', 'Array of data items to display (generic via UIList<T>)'],
          ['selectable', 'boolean', 'false', 'Enables item click selection'],
          ['selection-mode', "'single'|'multiple'", "'multiple'", 'Selection mode'],
          ['pagination', 'boolean', 'false', 'Enables pagination controls'],
          ['page-size', 'number', '10', 'Items per page'],
          ['remote', 'boolean', 'false', 'Delegates sorting, paging, and infinite scroll to ui-page-request'],
          ['virtual', 'boolean | VirtualScrollConfig', 'false', 'Enables windowed virtual scrolling'],
          ['layout', "'list'|'grid'|'auto-fit'", "'list'", 'List display layout'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-sort', 'UIListSortEvent<T>', '{ sortBy, sortDirection, data }', 'Fired when sort() changes ordering'],
          ['ui-page-change', 'UIListPageChangeEvent', '{ page, pageSize, totalPages, total }', 'Fired when the active page changes'],
          ['ui-page-size-change', 'UIListPageSizeChangeEvent', '{ page, pageSize, totalPages, total }', 'Fired when items per page changes (resets page to 1)'],
          ['ui-page-request', 'UIListPageRequestEvent<T>', '{ page, pageSize, sortBy, sortDirection, reason, append, resolve }', 'Fired when remote/fetchPage is enabled (or getPage() is called). Call resolve({ data, total })'],
          ['ui-selection-change', 'UIListSelectionChangeEvent<T>', '{ selectedKeys, selectedItems, item?, index? }', 'Fired when item selection changes'],
          ['ui-item-click', 'UIListItemClickEvent<T>', '{ item, index, key, selected }', 'Fired when a list item is clicked'],
          ['ui-collapse-change', 'UICollapseChangeEvent', '{ collapsed }', 'Fired when a collapsible list header is toggled'],
        ]),
      ]
    },
  },

  // ── Dialog ────────────────────────────────────────────────────────────────
  {
    id: 'dialog',
    title: 'Dialog',
    tag: 'ui-dialog',
    group: 'Overlays',
    description:
      'Modal dialog surface powered by native <code>&lt;dialog&gt;</code> with backdrop blur, focus trapping, Escape key dismiss, and header surface styling.',
    build() {
      return [
        subTitle('Modal Dialog'),
        demoBlock({
          label: 'Click button to open modal dialog',
          html: `
            <ui-button variant="primary" id="btn-open-dialog">Open Confirm Dialog</ui-button>
            <ui-dialog id="demo-modal-dialog" title="Confirm Project Deletion">
              <p style="margin: 0; line-height: 1.6;">Are you sure you want to permanently delete this project? All associated deployments, tokens, and storage buckets will be eradicated.</p>
              <div slot="footer" style="display: flex; justify-content: flex-end; gap: 8px;">
                <ui-button variant="outline" id="btn-dialog-cancel">Cancel</ui-button>
                <ui-button variant="danger" id="btn-dialog-confirm">Delete Project</ui-button>
              </div>
            </ui-dialog>
          `,
          setup(preview) {
            const dialog = preview.querySelector('#demo-modal-dialog')
            preview.querySelector('#btn-open-dialog').addEventListener('click', () => {
              dialog.showModal()
            })
            preview.querySelector('#btn-dialog-cancel').addEventListener('click', () => {
              dialog.close()
            })
            preview.querySelector('#btn-dialog-confirm').addEventListener('click', () => {
              dialog.close()
            })
          },
        }),
        codeBlock(`<ui-dialog title="Confirm Action">
  <p>Are you sure you want to proceed?</p>
  <div slot="footer">
    <ui-button variant="outline">Cancel</ui-button>
    <ui-button variant="danger">Confirm</ui-button>
  </div>
</ui-dialog>

// In JavaScript:
document.querySelector('ui-dialog').showModal()`),

        subTitle('Properties & Methods'),
        propsTable([
          ['title', 'string', "''", 'Dialog header title text'],
          ['open', 'boolean', 'false', 'Reflects modal visibility state'],
          ['showModal()', 'method', '—', 'Opens the dialog as a modal with backdrop'],
          ['show()', 'method', '—', 'Opens the dialog modelessly'],
          ['close()', 'method', '—', 'Closes the dialog'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-open', 'UIDialogOpenEvent', "{ presentation: 'modal' | 'modeless' }", 'Fired when the dialog opens'],
          ['ui-close', 'UIDialogCloseEvent', '{}', 'Fired when the dialog closes'],
          ['ui-collapse-change', 'UICollapseChangeEvent', '{ collapsed: boolean }', 'Fired when a collapsible dialog header is toggled'],
        ]),
      ]
    },
  },

  // ── Drawer ────────────────────────────────────────────────────────────────
  {
    id: 'drawer',
    title: 'Drawer',
    tag: 'ui-drawer',
    group: 'Overlays',
    description:
      'Off-canvas sliding drawer panel supporting left, right, top, and bottom placements with backdrop dismiss.',
    build() {
      return [
        subTitle('Slide-out Drawer'),
        demoBlock({
          label: 'Open slide-out drawer panels from left or right',
          html: `
            <div style="display: flex; gap: 10px;">
              <ui-button variant="primary" id="btn-open-right-drawer">Open Right Drawer</ui-button>
              <ui-button variant="outline" id="btn-open-left-drawer">Open Left Drawer</ui-button>
            </div>
            <ui-drawer id="demo-right-drawer" title="Project Details" placement="right" closable>
              <div style="padding: 16px;">
                <p>Configure project settings, view recent activities, and manage team member access roles.</p>
                <ui-field label="Environment"><ui-input value="production"></ui-input></ui-field>
                <ui-field label="Region"><ui-input value="us-east-1"></ui-input></ui-field>
              </div>
            </ui-drawer>
            <ui-drawer id="demo-left-drawer" title="Navigation Panel" placement="left" closable>
              <div style="padding: 16px;">
                <p>Quick navigation links and workspace switcher.</p>
              </div>
            </ui-drawer>
          `,
          setup(preview) {
            const rightDrawer = preview.querySelector('#demo-right-drawer')
            const leftDrawer = preview.querySelector('#demo-left-drawer')
            preview.querySelector('#btn-open-right-drawer').addEventListener('click', () => {
              rightDrawer.open = true
            })
            preview.querySelector('#btn-open-left-drawer').addEventListener('click', () => {
              leftDrawer.open = true
            })
          },
        }),
        codeBlock(`<ui-drawer title="Details" placement="right" closable>
  <div class="content">Drawer content here…</div>
</ui-drawer>

// Open drawer:
document.querySelector('ui-drawer').open = true`),

        subTitle('Properties'),
        propsTable([
          ['placement', "'left'|'right'|'top'|'bottom'", "'right'", 'Side of the viewport the drawer slides from'],
          ['title', 'string', "''", 'Drawer header title'],
          ['open', 'boolean', 'false', 'Controls drawer visibility'],
          ['closable', 'boolean', 'true', 'Shows close button in header'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-open', 'UIDrawerOpenEvent', '{ placement: DrawerPlacement }', 'Fired when the drawer opens via show() or open = true'],
          ['ui-close', 'UIDrawerCloseEvent', '{}', 'Fired when the drawer closes via close(), Escape, backdrop, or open = false'],
          ['ui-collapse-change', 'UICollapseChangeEvent', '{ collapsed: boolean }', 'Fired when a collapsible drawer header is toggled'],
        ]),
      ]
    },
  },

  // ── Popover ───────────────────────────────────────────────────────────────
  {
    id: 'popover',
    title: 'Popover',
    tag: 'ui-popover',
    group: 'Overlays',
    description:
      'Floating anchored panel with light-dismiss, multiple placement anchors, and top-layer animation.',
    build() {
      return [
        subTitle('Anchored Popover'),
        demoBlock({
          label: 'Click button to toggle anchored popover',
          html: `
            <ui-button variant="primary" id="btn-toggle-popover">Toggle Info Popover</ui-button>
            <ui-popover id="demo-popover" placement="bottom-start">
              <div style="padding: 12px; max-width: 240px; font-size: 0.85rem;">
                <div style="font-weight: 600; margin-bottom: 4px;">Quick Actions</div>
                <div style="color: var(--docs-text-muted); margin-bottom: 8px;">Floating popover surfaces support rich custom content.</div>
                <ui-button size="sm" variant="accent" style="width: 100%;">View Changelog</ui-button>
              </div>
            </ui-popover>
          `,
          setup(preview) {
            const btn = preview.querySelector('#btn-toggle-popover')
            const popover = preview.querySelector('#demo-popover')
            btn.addEventListener('click', () => {
              popover.toggle(btn)
            })
          },
        }),
        codeBlock(`const popover = document.querySelector('ui-popover')
const button = document.querySelector('ui-button')

button.addEventListener('click', () => {
  popover.toggle(button)
})`, 'js'),

        subTitle('Properties'),
        propsTable([
          ['placement', "'top'|'bottom'|'left'|'right'|...-start|...-end", "'bottom'", 'Placement position relative to anchor'],
          ['open', 'boolean', 'false', 'Controls visibility state'],
          ['offset', 'number', '6', 'Gap in pixels between anchor and popover surface'],
          ['trigger', 'string', "''", 'CSS selector of trigger element to automatically bind clicks'],
          ['type', "'auto'|'manual'", "'auto'", 'Native popover dismiss behavior'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-open', 'UIPopoverOpenEvent', '{ placement: PopoverPlacement }', 'Fired when the popover opens'],
          ['ui-close', 'UIPopoverCloseEvent', '{}', 'Fired when the popover closes'],
        ]),
      ]
    },
  },

  // ── Context Menu ──────────────────────────────────────────────────────────
  {
    id: 'context-menu',
    title: 'Context Menu',
    tag: 'ui-context-menu',
    group: 'Overlays',
    description:
      'Custom right-click context menu bound to any DOM target element via CSS selector or element reference.',
    build() {
      return [
        subTitle('Right-Click Trigger Zone'),
        demoBlock({
          label: 'Right-click inside the dashed box below',
          html: `
            <div id="context-target-box" style="padding: 28px; border: 2px dashed var(--docs-border); border-radius: 10px; text-align: center; background: var(--docs-card-bg); user-select: none; cursor: context-menu;">
              <span style="font-size: 1.4rem;">🖱️</span>
              <div style="font-weight: 600; margin-top: 6px;">Right-click anywhere inside this container</div>
              <div style="font-size: 0.75rem; color: var(--docs-text-muted);">A custom context menu will appear at your cursor position</div>
            </div>
            <div id="context-selection-log" style="margin-top: 8px; font-size: 0.8rem; color: var(--docs-text-muted);">Right-click box to open menu</div>
            <ui-context-menu target="#context-target-box">
              <ui-menu-item value="inspect" icon="🔍">Inspect Node</ui-menu-item>
              <ui-menu-item value="clone" icon="📋">Clone Configuration</ui-menu-item>
              <ui-menu-divider></ui-menu-divider>
              <ui-menu-item value="restart" icon="🔄">Restart Service</ui-menu-item>
              <ui-menu-item value="terminate" icon="🛑" danger>Terminate</ui-menu-item>
            </ui-context-menu>
          `,
          setup(preview) {
            const menu = preview.querySelector('ui-context-menu')
            const log = preview.querySelector('#context-selection-log')
            menu.addEventListener('ui-select', (e) => {
              log.textContent = `Executed context action: ${e.detail.value}`
            })
          },
        }),
        codeBlock(`<div id="target-element">Right-click here</div>

<ui-context-menu target="#target-element">
  <ui-menu-item value="edit" icon="✏️">Edit</ui-menu-item>
  <ui-menu-item value="clone" icon="📋">Clone</ui-menu-item>
  <ui-menu-divider></ui-menu-divider>
  <ui-menu-item value="delete" icon="🗑️" danger>Delete</ui-menu-item>
</ui-context-menu>`),

        subTitle('Properties'),
        propsTable([
          ['target', 'string | HTMLElement', "''", 'CSS selector or element target to intercept contextmenu on'],
          ['open', 'boolean', 'false', 'Visibility state of the context menu'],
          ['disabled', 'boolean', 'false', 'Disables context menu interception'],
        ]),

        subTitle('Events'),
        eventsTable([
          ['ui-open', 'UIContextMenuOpenEvent', '{ x: number; y: number }', 'Fired when the context menu opens at pointer coordinates'],
          ['ui-close', 'UIContextMenuCloseEvent', '{}', 'Fired when the context menu closes'],
          ['ui-select', 'UIMenuSelectEvent', '{ value: string; item: UIMenuItem }', 'Fired when a menu item is selected'],
        ]),
      ]
    },
  },
]

// ── Sidebar group ordering ──────────────────────────────────────────────────
const GROUP_ORDER = ['Foundation', 'Display', 'Actions', 'Forms', 'Feedback', 'Navigation', 'Layout', 'Data', 'Overlays']

// ── Build the page ──────────────────────────────────────────────────────────
function buildPage() {
  const container = document.getElementById('sections-container')
  const navEl = document.getElementById('sidebar-nav')

  // Hero section
  const hero = document.createElement('div')
  hero.className = 'docs-hero'
  hero.innerHTML = `
    <div class="docs-hero-badge">@collidor/ui · v2</div>
    <h1>Component <span>Reference</span></h1>
    <p>
      A Web Component UI library enforcing Golden Ratio relative spacing and OKLCH-derived
      colour tokens. Zero runtime dependencies beyond Lit, fully themeable via CSS custom properties.
    </p>
    <div class="hero-pills">
      <span class="hero-pill"><span>⬡</span> Web Components</span>
      <span class="hero-pill"><span>𝜑</span> Golden Ratio spacing</span>
      <span class="hero-pill"><span>🎨</span> OKLCH colours</span>
      <span class="hero-pill"><span>🌙</span> 4 built-in themes</span>
      <span class="hero-pill"><span>♿</span> WCAG AAA contrast</span>
    </div>
  `
  container.appendChild(hero)

  // Group sections
  const grouped = {}
  for (const s of SECTIONS) {
    if (!grouped[s.group]) grouped[s.group] = []
    grouped[s.group].push(s)
  }

  // Build nav
  for (const group of GROUP_ORDER) {
    if (!grouped[group]) continue

    const groupEl = document.createElement('div')
    groupEl.className = 'sidebar-group'

    const groupLabel = document.createElement('div')
    groupLabel.className = 'sidebar-title'
    groupLabel.textContent = group
    groupEl.appendChild(groupLabel)

    const ul = document.createElement('ul')
    ul.className = 'sidebar-nav'

    for (const s of grouped[group]) {
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.className = 'sidebar-link'
      a.href = `#${s.id}`
      a.setAttribute('data-target', s.id)
      const tagDisplay = formatTagLabel(s.tag)
      a.innerHTML = `<span>${s.title}</span><span class="nav-tag">${tagDisplay}</span>`
      li.appendChild(a)
      ul.appendChild(li)
    }

    groupEl.appendChild(ul)
    navEl.appendChild(groupEl)
  }

  // Ensure toast container is mounted for toast notifications
  if (!document.getElementById('docs-toast-container')) {
    const toastContainer = document.createElement('ui-toast-container')
    toastContainer.id = 'docs-toast-container'
    toastContainer.setAttribute('placement', 'bottom-right')
    document.body.appendChild(toastContainer)
  }

  // Build sections (ordered by group)
  for (const group of GROUP_ORDER) {
    if (!grouped[group]) continue
    for (const s of grouped[group]) {
      const children = s.build()
      const el = section({ ...s, children })
      container.appendChild(el)
    }
  }
}

// ── Active link tracking via IntersectionObserver ──────────────────────────
function setupScrollSpy() {
  const navLinks = document.querySelectorAll('#sidebar-nav a[data-target]')
  const sections = document.querySelectorAll('.doc-section')

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-section')
          navLinks.forEach((a) => {
            a.classList.toggle('active', a.getAttribute('data-target') === id)
          })
        }
      }
    },
    {
      root: null,
      rootMargin: '-15% 0px -65% 0px',
      threshold: 0,
    },
  )

  sections.forEach((s) => observer.observe(s))
}

// ── Sidebar search ──────────────────────────────────────────────────────────
function setupSearch() {
  const input = document.getElementById('sidebar-search')
  const groups = document.querySelectorAll('#sidebar-nav .sidebar-group')

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase()
    groups.forEach((group) => {
      let visibleCount = 0
      group.querySelectorAll('li').forEach((li) => {
        const a = li.querySelector('a[data-target]')
        const text = a ? a.textContent.toLowerCase() : ''
        const hidden = q.length > 0 && !text.includes(q)
        li.classList.toggle('hidden-by-search', hidden)
        if (a) a.classList.toggle('hidden-by-search', hidden)
        if (!hidden) visibleCount++
      })
      group.classList.toggle('hidden-by-search', q.length > 0 && visibleCount === 0)
    })
  })
}

function scrollBehavior() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

// ── Smooth scroll nav clicks ────────────────────────────────────────────────
function setupNavClicks() {
  document.getElementById('sidebar-nav').addEventListener('click', (e) => {
    const a = e.target.closest('a[data-target]')
    if (!a) return
    e.preventDefault()
    const targetId = a.getAttribute('data-target')
    const target = document.getElementById(targetId)
    if (target) {
      history.replaceState(null, '', `#${targetId}`)
      target.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
      target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    }
  })

  const brandHome = document.getElementById('brand-home')
  if (brandHome) {
    brandHome.addEventListener('click', (e) => {
      e.preventDefault()
      history.replaceState(null, '', location.pathname + location.search)
      window.scrollTo({ top: 0, behavior: scrollBehavior() })
      const content = document.getElementById('content')
      if (content) content.focus({ preventScroll: true })
    })
  }
}

// ── Initial body focus for keyboard navigation ──────────────────────────────
function setupInitialFocus() {
  const hashId = location.hash ? location.hash.slice(1) : ''
  const hashTarget = hashId ? document.getElementById(hashId) : null
  if (hashTarget) {
    hashTarget.scrollIntoView({ block: 'start' })
    hashTarget.setAttribute('tabindex', '-1')
    hashTarget.focus({ preventScroll: true })
    return
  }
  const content = document.getElementById('content')
  if (content) {
    content.focus({ preventScroll: true })
  }
}

// ── Theme selector ──────────────────────────────────────────────────────────
function setupThemeSelector() {
  const select = document.getElementById('theme-selector')
  const applyTheme = (theme) => {
    if (theme && theme !== 'dark') {
      document.documentElement.setAttribute('data-theme', theme)
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  try {
    const saved = localStorage.getItem('collidor-theme')
    if (saved && [...select.options].some((o) => o.value === saved)) {
      select.value = saved
      applyTheme(saved)
    }
  } catch {
    // Ignore storage restrictions
  }

  select.addEventListener('change', () => {
    const theme = select.value
    applyTheme(theme)
    try {
      localStorage.setItem('collidor-theme', theme)
    } catch {
      // Ignore storage restrictions
    }
  })
}

// ── Init ────────────────────────────────────────────────────────────────────
buildPage()
setupScrollSpy()
setupSearch()
setupNavClicks()
setupThemeSelector()
setupInitialFocus()
