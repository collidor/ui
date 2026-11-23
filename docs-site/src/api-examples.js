/**
 * Live interactive event-wiring playgrounds & TypeScript examples
 * rendered inside each component's API tab.
 */

import { UI_EVENTS } from '@collidor/ui'

/** Safely serialize event detail objects (handling DOM elements & functions) */
export function formatEventDetail(detail) {
  if (detail === undefined) return 'undefined'
  try {
    return JSON.stringify(
      detail,
      (_key, val) => {
        if (typeof val === 'function') {
          return `[Function: ${val.name || 'callback'}]`
        }
        if (typeof Element !== 'undefined' && val instanceof Element) {
          const tag = val.tagName.toLowerCase()
          const valueAttr = val.getAttribute('value')
          if (valueAttr) return `<${tag} value="${valueAttr}">`
          const titleAttr = val.getAttribute('title')
          if (titleAttr) return `<${tag} title="${titleAttr}">`
          return `<${tag}>`
        }
        if (Array.isArray(val) && val.length > 4) {
          return [...val.slice(0, 3), `… +${val.length - 3} more`]
        }
        return val
      },
      2,
    )
  } catch {
    return String(detail)
  }
}

/**
 * Build a live interactive event-wiring playground + TypeScript code snippet.
 */
export function buildApiExample(sectionId, { codeBlock, subTitle, esc }) {
  const spec = API_EXAMPLES[sectionId]
  if (!spec) return []

  const nodes = [subTitle(spec.heading || 'Live Event Wiring')]

  if (spec.html) {
    const block = document.createElement('div')
    block.className = 'demo-block event-demo'

    const lbl = document.createElement('div')
    lbl.className = 'demo-label'
    lbl.textContent = spec.label || 'Interact below to see live CustomEvent payloads'
    block.appendChild(lbl)

    const preview = document.createElement('div')
    preview.className = `demo-preview${spec.className ? ' ' + spec.className : ''}`
    preview.innerHTML = spec.html
    block.appendChild(preview)

    const logHeader = document.createElement('div')
    logHeader.className = 'event-log-header'
    logHeader.innerHTML = `
      <span>Event Log</span>
      <button type="button" class="event-log-clear">Clear</button>
    `
    block.appendChild(logHeader)

    const logBody = document.createElement('div')
    logBody.className = 'event-log'
    logBody.setAttribute('role', 'log')
    logBody.setAttribute('aria-live', 'polite')
    const emptyMsg = '<div class="event-log-empty">Interact with the component above to inspect emitted events…</div>'
    logBody.innerHTML = emptyMsg
    block.appendChild(logBody)

    const logEvent = (eventName, detail) => {
      const empty = logBody.querySelector('.event-log-empty')
      if (empty) empty.remove()
      const row = document.createElement('div')
      row.className = 'event-log-entry'
      const time = new Date().toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      row.innerHTML = `
        <div class="event-log-meta">
          <span class="event-log-badge">${esc(eventName)}</span>
          <span class="event-log-time">${esc(time)}</span>
        </div>
        <pre class="event-log-detail">${esc(formatEventDetail(detail))}</pre>
      `
      logBody.prepend(row)
      while (logBody.children.length > 12) {
        logBody.lastElementChild?.remove()
      }
    }

    logHeader.querySelector('.event-log-clear').addEventListener('click', () => {
      logBody.innerHTML = emptyMsg
    })

    if (Array.isArray(spec.events) && spec.events.length > 0) {
      const target = spec.targetSelector ? preview.querySelector(spec.targetSelector) : preview
      if (target) {
        for (const eventName of spec.events) {
          target.addEventListener(eventName, (e) => {
            logEvent(eventName, e instanceof CustomEvent ? e.detail : { type: e.type })
          })
        }
      }
    }

    if (spec.setup) {
      spec.setup(preview, logEvent)
    }

    nodes.push(block)
  }

  if (spec.code) {
    nodes.push(codeBlock(spec.code, 'ts'))
  }

  return nodes
}

const API_EXAMPLES = {
  button: {
    label: 'Click enabled vs disabled/loading buttons (native click is suppressed when disabled or loading)',
    html: `
      <ui-button variant="primary" id="api-btn-save">Save Changes</ui-button>
      <ui-button variant="outline" id="api-btn-toggle-load">Toggle Loading</ui-button>
      <ui-button variant="secondary" disabled>Disabled</ui-button>
    `,
    setup(preview, logEvent) {
      const saveBtn = preview.querySelector('#api-btn-save')
      const toggleBtn = preview.querySelector('#api-btn-toggle-load')
      saveBtn.addEventListener('click', () => {
        logEvent('click', { id: 'api-btn-save', variant: saveBtn.variant })
      })
      toggleBtn.addEventListener('click', () => {
        saveBtn.loading = !saveBtn.loading
        logEvent('click', { toggledLoading: saveBtn.loading })
      })
    },
    code: `import type { UIButton } from '@collidor/ui'

const button = document.querySelector('ui-button') as UIButton
button.addEventListener('click', () => {
  // Automatically suppressed while button.disabled or button.loading is true
  console.log('Button activated')
})`,
  },

  alert: {
    label: 'Dismiss the alert (or re-spawn it) to observe ui-dismiss',
    className: 'column',
    html: `
      <div id="api-alert-slot">
        <ui-alert variant="warning" title="Unsaved changes" closable>
          Click × to trigger <code>ui-dismiss</code>.
        </ui-alert>
      </div>
      <div>
        <ui-button size="sm" variant="outline" id="api-alert-reset">Reset Alert</ui-button>
      </div>
    `,
    events: [UI_EVENTS.DISMISS],
    setup(preview) {
      const slot = preview.querySelector('#api-alert-slot')
      preview.querySelector('#api-alert-reset').addEventListener('click', () => {
        slot.innerHTML = `<ui-alert variant="warning" title="Unsaved changes" closable>Click × to trigger <code>ui-dismiss</code>.</ui-alert>`
      })
    },
    code: `import { UI_EVENTS, type UIAlert } from '@collidor/ui'

const alert = document.querySelector('ui-alert') as UIAlert
alert.addEventListener(UI_EVENTS.DISMISS, (e) => {
  // e is UIAlertDismissEvent
  console.log('Alert dismissed', e.detail)
})`,
  },

  input: {
    label: 'Type, blur/Enter, or click × clear to see ui-input and ui-change',
    html: `<ui-input id="api-input" placeholder="Type something…" clearable style="max-width: 340px"></ui-input>`,
    targetSelector: '#api-input',
    events: [UI_EVENTS.INPUT, UI_EVENTS.CHANGE],
    code: `import { UI_EVENTS, type UIInput } from '@collidor/ui'

const input = document.querySelector('ui-input') as UIInput
input.addEventListener(UI_EVENTS.INPUT, (e) => {
  console.log('Live value:', e.detail.value) // string
})
input.addEventListener(UI_EVENTS.CHANGE, (e) => {
  console.log('Committed value:', e.detail.value) // string
})`,
  },

  switch: {
    label: 'Toggle the switch to inspect ui-change',
    html: `<ui-switch id="api-switch">Enable notifications</ui-switch>`,
    targetSelector: '#api-switch',
    events: [UI_EVENTS.CHANGE],
    code: `import { UI_EVENTS, type UISwitch } from '@collidor/ui'

const toggle = document.querySelector('ui-switch') as UISwitch
toggle.addEventListener(UI_EVENTS.CHANGE, (e) => {
  console.log('Checked:', e.detail.checked) // boolean
})`,
  },

  chip: {
    label: 'Select or dismiss chips inside <ui-chip-group> (events bubble to the group)',
    className: 'column',
    html: `
      <ui-chip-group id="api-chip-group" wrap>
        <ui-chip value="ts" selectable selected>TypeScript</ui-chip>
        <ui-chip value="lit" selectable>Lit</ui-chip>
        <ui-chip value="oklch" selectable closable>OKLCH</ui-chip>
        <ui-chip value="a11y" closable>A11y</ui-chip>
      </ui-chip-group>
      <div>
        <ui-button size="sm" variant="outline" id="api-chip-reset">Reset Chips</ui-button>
      </div>
    `,
    targetSelector: '#api-chip-group',
    events: [UI_EVENTS.SELECT, UI_EVENTS.DISMISS],
    setup(preview) {
      const group = preview.querySelector('#api-chip-group')
      preview.querySelector('#api-chip-reset').addEventListener('click', () => {
        group.innerHTML = `
          <ui-chip value="ts" selectable selected>TypeScript</ui-chip>
          <ui-chip value="lit" selectable>Lit</ui-chip>
          <ui-chip value="oklch" selectable closable>OKLCH</ui-chip>
          <ui-chip value="a11y" closable>A11y</ui-chip>
        `
      })
    },
    code: `import { UI_EVENTS, type UIChipGroup } from '@collidor/ui'

const group = document.querySelector('ui-chip-group') as UIChipGroup
group.addEventListener(UI_EVENTS.SELECT, (e) => {
  console.log(e.detail.value, e.detail.selected)
})
group.addEventListener(UI_EVENTS.DISMISS, (e) => {
  console.log('Removed chip:', e.detail.value)
})`,
  },

  progress: {
    label: 'Click the collapsible progress header to emit ui-collapse-change',
    className: 'column',
    html: `
      <ui-progress id="api-progress" value="68" label="Deployment Progress" show-value collapsible></ui-progress>
    `,
    targetSelector: '#api-progress',
    events: [UI_EVENTS.COLLAPSE_CHANGE],
    code: `import { UI_EVENTS, type UIProgress } from '@collidor/ui'

const progress = document.querySelector('ui-progress') as UIProgress
progress.addEventListener(UI_EVENTS.COLLAPSE_CHANGE, (e) => {
  console.log('Collapsed:', e.detail.collapsed) // boolean
})`,
  },

  tabs: {
    label: 'Switch tabs by click or ArrowLeft/ArrowRight to emit ui-change',
    html: `
      <ui-tabs id="api-tabs" value="general">
        <ui-tab value="general">General</ui-tab>
        <ui-tab value="security">Security</ui-tab>
        <ui-tab value="billing">Billing</ui-tab>
      </ui-tabs>
    `,
    targetSelector: '#api-tabs',
    events: [UI_EVENTS.CHANGE],
    code: `import { UI_EVENTS, type UITabs } from '@collidor/ui'

const tabs = document.querySelector('ui-tabs') as UITabs
tabs.addEventListener(UI_EVENTS.CHANGE, (e) => {
  console.log('Active tab:', e.detail.value) // string
})`,
  },

  accordion: {
    label: 'Expand or collapse sections to inspect ui-toggle',
    html: `
      <ui-accordion id="api-accordion" style="width: 100%">
        <ui-accordion-item title="Section One" open>First panel content.</ui-accordion-item>
        <ui-accordion-item title="Section Two">Second panel content.</ui-accordion-item>
      </ui-accordion>
    `,
    targetSelector: '#api-accordion',
    events: [UI_EVENTS.TOGGLE],
    code: `import { UI_EVENTS, type UIAccordion } from '@collidor/ui'

const accordion = document.querySelector('ui-accordion') as UIAccordion
accordion.addEventListener(UI_EVENTS.TOGGLE, (e) => {
  console.log(e.detail.item.title, 'open:', e.detail.open)
})`,
  },

  card: {
    label: 'Click the collapsible card header to emit ui-collapse-change',
    html: `
      <ui-card id="api-card" collapsible elevated style="max-width: 360px; width: 100%">
        <span slot="header">Collapsible Card</span>
        <p style="margin: 0; font-size: 0.85rem;">Click the header above to collapse or expand.</p>
      </ui-card>
    `,
    targetSelector: '#api-card',
    events: [UI_EVENTS.COLLAPSE_CHANGE],
    code: `import { UI_EVENTS, type UICard } from '@collidor/ui'

const card = document.querySelector('ui-card') as UICard
card.addEventListener(UI_EVENTS.COLLAPSE_CHANGE, (e) => {
  console.log('Card collapsed:', e.detail.collapsed)
})`,
  },

  table: {
    label: 'Sort, paginate, change page size, select rows, click rows, customize columns, collapse header, or toggle remote mode',
    className: 'column',
    html: `
      <div class="event-demo-controls">
        <ui-switch id="api-table-remote" size="sm">Remote mode (emits ui-page-request)</ui-switch>
      </div>
      <ui-table
        id="api-table"
        row-key="id"
        selectable
        pagination
        page-size="3"
        column-customization
        collapsible
        striped
        hoverable
        style="height: auto"
      >
        <span slot="header">Interactive Heroes Table</span>
      </ui-table>
    `,
    targetSelector: '#api-table',
    events: [
      UI_EVENTS.SORT,
      UI_EVENTS.PAGE_CHANGE,
      UI_EVENTS.PAGE_SIZE_CHANGE,
      UI_EVENTS.PAGE_REQUEST,
      UI_EVENTS.SELECTION_CHANGE,
      UI_EVENTS.ROW_CLICK,
      UI_EVENTS.COLUMNS_CHANGE,
      UI_EVENTS.COLLAPSE_CHANGE,
    ],
    setup(preview) {
      const table = preview.querySelector('#api-table')
      const remoteSwitch = preview.querySelector('#api-table-remote')
      const dataset = [
        { id: '1', name: 'Achilles', role: 'Champion', power: 99 },
        { id: '2', name: 'Hector', role: 'Commander', power: 95 },
        { id: '3', name: 'Odysseus', role: 'Strategist', power: 92 },
        { id: '4', name: 'Ajax', role: 'Vanguard', power: 90 },
        { id: '5', name: 'Diomedes', role: 'Spearman', power: 89 },
        { id: '6', name: 'Paris', role: 'Archer', power: 78 },
      ]
      table.columns = [
        { key: 'name', label: 'Hero', sortable: true },
        { key: 'role', label: 'Role', sortable: true },
        { key: 'power', label: 'Power', sortable: true, align: 'right' },
      ]
      table.pageSizeOptions = [3, 5, 10]
      table.data = dataset

      let pendingTimer = null
      table.addEventListener(UI_EVENTS.PAGE_REQUEST, (e) => {
        if (!table.remote) return
        if (pendingTimer) clearTimeout(pendingTimer)
        const { page, pageSize, sortBy, sortDirection, resolve } = e.detail
        table.loading = true
        pendingTimer = setTimeout(() => {
          pendingTimer = null
          if (!table.remote) return
          let rows = [...dataset]
          if (sortBy && sortDirection) {
            rows.sort((a, b) => {
              const cmp = typeof a[sortBy] === 'number'
                ? a[sortBy] - b[sortBy]
                : String(a[sortBy]).localeCompare(String(b[sortBy]))
              return sortDirection === 'desc' ? -cmp : cmp
            })
          }
          const start = (page - 1) * pageSize
          resolve({ data: rows.slice(start, start + pageSize), total: rows.length })
        }, 180)
      })

      remoteSwitch.addEventListener(UI_EVENTS.CHANGE, (e) => {
        if (pendingTimer) {
          clearTimeout(pendingTimer)
          pendingTimer = null
        }
        table.loading = false
        table.remote = e.detail.checked
        if (table.remote) {
          table.getPage({ page: 1 })
        } else {
          table.total = null
          table.data = dataset
        }
      })
    },
    code: `import { UI_EVENTS, type UITable } from '@collidor/ui'

interface Hero {
  id: string
  name: string
  role: string
  power: number
}

const table = document.querySelector('ui-table') as UITable<Hero>

table.addEventListener(UI_EVENTS.ROW_CLICK, (e) => {
  console.log(e.detail.row.name, e.detail.key, e.detail.selected)
})

table.addEventListener(UI_EVENTS.SELECTION_CHANGE, (e) => {
  console.log('Selected:', e.detail.selectedRows.map((r) => r.name))
})

table.addEventListener(UI_EVENTS.SORT, (e) => {
  console.log('Sorted by:', e.detail.sortBy, e.detail.sortDirection)
})

table.addEventListener(UI_EVENTS.PAGE_CHANGE, (e) => {
  console.log('Page:', e.detail.page, 'of', e.detail.totalPages)
})

table.addEventListener(UI_EVENTS.PAGE_SIZE_CHANGE, (e) => {
  console.log('Page size:', e.detail.pageSize)
})

table.addEventListener(UI_EVENTS.COLUMNS_CHANGE, (e) => {
  console.log('Visible columns:', e.detail.columns.filter((c) => !c.hidden))
})

// Unified remote data loading (handles page, page-size, sort, and scroll)
table.addEventListener(UI_EVENTS.PAGE_REQUEST, async (e) => {
  const { page, pageSize, sortBy, sortDirection, reason, append, resolve } = e.detail
  table.loading = true
  const res = await fetchHeroes({ page, pageSize, sortBy, sortDirection })
  resolve({ data: res.rows, total: res.total })
})`,
  },

  'segmented-control': {
    label: 'Click or use arrow keys to switch segments and observe ui-change',
    html: `
      <ui-segmented-control id="api-segmented" value="day">
        <ui-segment-item value="day">Day</ui-segment-item>
        <ui-segment-item value="week">Week</ui-segment-item>
        <ui-segment-item value="month">Month</ui-segment-item>
      </ui-segmented-control>
    `,
    targetSelector: '#api-segmented',
    events: [UI_EVENTS.CHANGE],
    code: `import { UI_EVENTS, type UISegmentedControl } from '@collidor/ui'

const control = document.querySelector('ui-segmented-control') as UISegmentedControl
control.addEventListener(UI_EVENTS.CHANGE, (e) => {
  console.log('Segment:', e.detail.value) // string
})`,
  },

  select: {
    label: 'Pick an option to emit ui-change',
    html: `
      <div style="max-width: 300px; width: 100%">
        <ui-select id="api-select" placeholder="Select environment…">
          <option value="dev">Development</option>
          <option value="staging">Staging</option>
          <option value="prod">Production</option>
        </ui-select>
      </div>
    `,
    targetSelector: '#api-select',
    events: [UI_EVENTS.CHANGE],
    code: `import { UI_EVENTS, type UISelect } from '@collidor/ui'

const select = document.querySelector('ui-select') as UISelect
select.addEventListener(UI_EVENTS.CHANGE, (e) => {
  console.log('Selected:', e.detail.value) // string
})`,
  },

  combobox: {
    label: 'Search (triggers remote ui-page-request), select options, or create a new option',
    html: `
      <div style="max-width: 380px; width: 100%">
        <ui-combobox
          id="api-combobox"
          multiple
          creatable
          remote
          debounce-ms="200"
          placeholder="Search or create a region…"
        ></ui-combobox>
      </div>
    `,
    targetSelector: '#api-combobox',
    events: [UI_EVENTS.CHANGE, UI_EVENTS.CREATE, UI_EVENTS.PAGE_REQUEST],
    setup(preview) {
      const combo = preview.querySelector('#api-combobox')
      const catalog = [
        { value: 'us-east', label: 'US East', description: 'N. Virginia' },
        { value: 'us-west', label: 'US West', description: 'Oregon' },
        { value: 'eu-west', label: 'EU West', description: 'Ireland' },
        { value: 'ap-south', label: 'AP South', description: 'Singapore' },
      ]
      combo.options = catalog
      combo.total = catalog.length
      combo.addEventListener(UI_EVENTS.PAGE_REQUEST, (e) => {
        const q = e.detail.search.trim().toLowerCase()
        const filtered = q
          ? catalog.filter((o) => o.label.toLowerCase().includes(q) || o.value.includes(q))
          : catalog
        e.detail.resolve({ options: filtered, total: filtered.length })
      })
    },
    code: `import { UI_EVENTS, type UICombobox } from '@collidor/ui'

interface CloudRegion {
  value: 'us-east' | 'eu-west'
  label: string
  latencyMs: number
}

const combo = document.querySelector('ui-combobox') as UICombobox<CloudRegion>

combo.addEventListener(UI_EVENTS.CHANGE, (e) => {
  console.log(e.detail.value, e.detail.selectedOptions) // CloudRegion[]
})

combo.addEventListener(UI_EVENTS.CREATE, (e) => {
  console.log('Created:', e.detail.value, e.detail.label)
})

combo.addEventListener(UI_EVENTS.PAGE_REQUEST, async (e) => {
  const { page, pageSize, search, reason, append, resolve } = e.detail
  const res = await searchRegions({ page, pageSize, search })
  resolve({ options: res.items, total: res.total })
})`,
  },

  'number-input': {
    label: 'Step with buttons/ArrowUp/ArrowDown or type a number to inspect ui-input and ui-change',
    html: `<ui-number-input id="api-num" value="10" min="0" max="100" step="5" style="max-width: 220px"></ui-number-input>`,
    targetSelector: '#api-num',
    events: [UI_EVENTS.INPUT, UI_EVENTS.CHANGE],
    code: `import { UI_EVENTS, type UINumberInput } from '@collidor/ui'

const input = document.querySelector('ui-number-input') as UINumberInput
input.addEventListener(UI_EVENTS.INPUT, (e) => {
  console.log('Live:', e.detail.value) // number
})
input.addEventListener(UI_EVENTS.CHANGE, (e) => {
  console.log('Committed:', e.detail.value) // number
})`,
  },

  slider: {
    label: 'Drag the slider thumb to observe ui-input (live) and ui-change (committed)',
    html: `<ui-slider id="api-slider" value="40" min="0" max="100" show-value style="max-width: 340px"></ui-slider>`,
    targetSelector: '#api-slider',
    events: [UI_EVENTS.INPUT, UI_EVENTS.CHANGE],
    code: `import { UI_EVENTS, type UISlider } from '@collidor/ui'

const slider = document.querySelector('ui-slider') as UISlider
slider.addEventListener(UI_EVENTS.INPUT, (e) => {
  console.log('Dragging:', e.detail.value) // number
})
slider.addEventListener(UI_EVENTS.CHANGE, (e) => {
  console.log('Final value:', e.detail.value) // number
})`,
  },

  'struct-form': {
    label: 'Edit fields and submit (try submitting with Name empty to trigger ui-form-invalid)',
    html: `
      <div style="max-width: 420px; width: 100%">
        <ui-struct-form id="api-struct-form" submit-label="Submit Form" bordered></ui-struct-form>
      </div>
    `,
    targetSelector: '#api-struct-form',
    events: [
      UI_EVENTS.FORM_CHANGE,
      UI_EVENTS.FORM_SUBMIT,
      UI_EVENTS.FORM_INVALID,
      UI_EVENTS.FORM_LOADING,
      UI_EVENTS.FORM_STEP_ERROR,
    ],
    setup(preview) {
      const form = preview.querySelector('#api-struct-form')
      form.fields = [
        { key: 'name', label: 'Service Name', widget: 'text', required: true, placeholder: 'Required field…' },
        { key: 'replicas', label: 'Replicas', widget: 'number', defaultValue: 2, widgetProps: { min: 1, max: 10 } },
        { key: 'canary', label: 'Canary Rollout', widget: 'switch', defaultValue: false },
      ]
    },
    code: `import { UI_EVENTS, type UIStructForm } from '@collidor/ui'

interface ServiceConfig {
  name: string
  replicas: number
  canary: boolean
}

const form = document.querySelector('ui-struct-form') as UIStructForm<ServiceConfig>

form.addEventListener(UI_EVENTS.FORM_CHANGE, (e) => {
  console.log(e.detail.fieldKey, e.detail.fieldValue, e.detail.values.name)
})

form.addEventListener(UI_EVENTS.FORM_SUBMIT, (e) => {
  console.log('Valid submit:', e.detail.values) // ServiceConfig
})

form.addEventListener(UI_EVENTS.FORM_INVALID, (e) => {
  console.log('Errors:', e.detail.errors, e.detail.values)
})`,
  },

  toast: {
    label: 'Spawn a toast and dismiss it (or wait 2.5s) to observe ui-dismiss on the container',
    html: `
      <ui-button variant="primary" size="sm" id="api-toast-spawn">Spawn Toast (2.5s)</ui-button>
    `,
    setup(preview, logEvent) {
      const container = document.getElementById('docs-toast-container')
      preview.querySelector('#api-toast-spawn').addEventListener('click', () => {
        const toast = container?.notify({
          title: 'Event Demo Toast',
          message: 'Click × or wait 2.5s to emit ui-dismiss.',
          variant: 'info',
          duration: 2500,
        })
        toast?.addEventListener(UI_EVENTS.DISMISS, (e) => {
          logEvent(UI_EVENTS.DISMISS, e.detail)
        })
      })
    },
    code: `import { UI_EVENTS, type UIToastContainer } from '@collidor/ui'

const container = document.querySelector('ui-toast-container') as UIToastContainer
container.addEventListener(UI_EVENTS.DISMISS, (e) => {
  // Bubbles from any child <ui-toast>
  console.log('Toast dismissed', e.detail)
})`,
  },

  pagination: {
    label: 'Navigate pages or change page size to inspect ui-page-change and ui-page-size-change',
    html: `<ui-pagination id="api-pagination" page="2" page-size="10" total="95" discrete-pages></ui-pagination>`,
    targetSelector: '#api-pagination',
    events: [UI_EVENTS.PAGE_CHANGE, UI_EVENTS.PAGE_SIZE_CHANGE],
    code: `import { UI_EVENTS, type UIPagination } from '@collidor/ui'

const pager = document.querySelector('ui-pagination') as UIPagination
pager.addEventListener(UI_EVENTS.PAGE_CHANGE, (e) => {
  console.log('Page:', e.detail.page, 'of', e.detail.totalPages)
})
pager.addEventListener(UI_EVENTS.PAGE_SIZE_CHANGE, (e) => {
  // Emitted once without duplicating ui-page-change
  console.log('Size:', e.detail.pageSize, 'current page:', e.detail.page)
})`,
  },

  stepper: {
    label: 'Click steps or press ArrowLeft/ArrowRight to observe ui-change',
    html: `
      <ui-stepper id="api-stepper" active-step="0">
        <ui-step step="1" label="Details"></ui-step>
        <ui-step step="2" label="Billing"></ui-step>
        <ui-step step="3" label="Review"></ui-step>
      </ui-stepper>
    `,
    targetSelector: '#api-stepper',
    events: [UI_EVENTS.CHANGE],
    code: `import { UI_EVENTS, type UIStepper } from '@collidor/ui'

const stepper = document.querySelector('ui-stepper') as UIStepper
stepper.addEventListener(UI_EVENTS.CHANGE, (e) => {
  console.log('Active step index:', e.detail.activeStep) // number
})`,
  },

  menu: {
    label: 'Open the dropdown menu and select an item to observe ui-open, ui-select, and ui-close',
    html: `
      <ui-button variant="outline" size="sm" id="api-menu-trigger">Actions ▾</ui-button>
      <ui-menu id="api-menu" trigger="#api-menu-trigger">
        <ui-menu-item value="duplicate" icon="📋">Duplicate</ui-menu-item>
        <ui-menu-item value="export" icon="⬇️">Export JSON</ui-menu-item>
        <ui-menu-divider></ui-menu-divider>
        <ui-menu-item value="delete" icon="🗑️" danger>Delete</ui-menu-item>
      </ui-menu>
    `,
    targetSelector: '#api-menu',
    events: [UI_EVENTS.OPEN, UI_EVENTS.SELECT, UI_EVENTS.CLOSE],
    code: `import { UI_EVENTS, type UIMenu } from '@collidor/ui'

const menu = document.querySelector('ui-menu') as UIMenu
menu.addEventListener(UI_EVENTS.OPEN, () => console.log('Opened'))
menu.addEventListener(UI_EVENTS.SELECT, (e) => {
  console.log('Selected:', e.detail.value, e.detail.item)
})
menu.addEventListener(UI_EVENTS.CLOSE, () => console.log('Closed'))`,
  },

  list: {
    label: 'Click items, sort, paginate, change page size, collapse header, or toggle remote mode',
    className: 'column',
    html: `
      <div class="event-demo-controls">
        <ui-button size="sm" variant="outline" id="api-list-sort">Sort by Title</ui-button>
        <ui-switch id="api-list-remote" size="sm">Remote mode</ui-switch>
      </div>
      <ui-list id="api-list" selectable pagination page-size="2" collapsible>
        <span slot="header">Interactive Services List</span>
      </ui-list>
    `,
    targetSelector: '#api-list',
    events: [
      UI_EVENTS.SORT,
      UI_EVENTS.PAGE_CHANGE,
      UI_EVENTS.PAGE_SIZE_CHANGE,
      UI_EVENTS.PAGE_REQUEST,
      UI_EVENTS.SELECTION_CHANGE,
      UI_EVENTS.ITEM_CLICK,
      UI_EVENTS.COLLAPSE_CHANGE,
    ],
    setup(preview) {
      const list = preview.querySelector('#api-list')
      const sortBtn = preview.querySelector('#api-list-sort')
      const remoteSwitch = preview.querySelector('#api-list-remote')
      const items = [
        { id: 'svc-1', title: 'Auth Gateway', badge: 'Active' },
        { id: 'svc-2', title: 'Billing Engine', badge: 'Active' },
        { id: 'svc-3', title: 'Cache Proxy', badge: 'Idle' },
        { id: 'svc-4', title: 'Event Stream', badge: 'Warning' },
      ]
      list.pageSizeOptions = [2, 4]
      list.data = items

      sortBtn.addEventListener('click', () => list.sort('title'))

      let pendingTimer = null
      list.addEventListener(UI_EVENTS.PAGE_REQUEST, (e) => {
        if (!list.remote) return
        if (pendingTimer) clearTimeout(pendingTimer)
        const { page, pageSize, sortBy, sortDirection, resolve } = e.detail
        list.loading = true
        pendingTimer = setTimeout(() => {
          pendingTimer = null
          if (!list.remote) return
          const rows = [...items]
          if (sortBy && sortDirection) {
            rows.sort((a, b) => {
              const cmp = String(a[sortBy]).localeCompare(String(b[sortBy]))
              return sortDirection === 'desc' ? -cmp : cmp
            })
          }
          const start = (page - 1) * pageSize
          resolve({ data: rows.slice(start, start + pageSize), total: rows.length })
        }, 160)
      })

      remoteSwitch.addEventListener(UI_EVENTS.CHANGE, (e) => {
        if (pendingTimer) {
          clearTimeout(pendingTimer)
          pendingTimer = null
        }
        list.loading = false
        list.remote = e.detail.checked
        if (list.remote) {
          list.getPage({ page: 1 })
        } else {
          list.total = null
          list.data = items
        }
      })
    },
    code: `import { UI_EVENTS, type UIList } from '@collidor/ui'

interface Service {
  id: string
  title: string
  badge: string
}

const list = document.querySelector('ui-list') as UIList<Service>

list.addEventListener(UI_EVENTS.ITEM_CLICK, (e) => {
  console.log(e.detail.item.title, e.detail.key, e.detail.selected)
})

list.addEventListener(UI_EVENTS.SELECTION_CHANGE, (e) => {
  console.log('Selected:', e.detail.selectedItems) // Service[]
})

list.addEventListener(UI_EVENTS.PAGE_REQUEST, async (e) => {
  const { page, pageSize, sortBy, sortDirection, resolve } = e.detail
  const res = await fetchServices({ page, pageSize, sortBy, sortDirection })
  resolve({ data: res.items, total: res.total })
})`,
  },

  dialog: {
    label: 'Open as modal or modeless, collapse the header, or close to observe ui-open / ui-close / ui-collapse-change',
    html: `
      <ui-button variant="primary" size="sm" id="api-dialog-modal">Open Modal</ui-button>
      <ui-button variant="outline" size="sm" id="api-dialog-modeless">Open Modeless</ui-button>
      <ui-dialog id="api-dialog" title="Dialog Event Demo" collapsible>
        <p style="margin: 0; font-size: 0.85rem;">Try collapsing the header or closing via × / Escape / backdrop.</p>
        <div slot="footer">
          <ui-button size="sm" variant="outline" id="api-dialog-close">Close</ui-button>
        </div>
      </ui-dialog>
    `,
    targetSelector: '#api-dialog',
    events: [UI_EVENTS.OPEN, UI_EVENTS.CLOSE, UI_EVENTS.COLLAPSE_CHANGE],
    setup(preview) {
      const dialog = preview.querySelector('#api-dialog')
      preview.querySelector('#api-dialog-modal').addEventListener('click', () => dialog.showModal())
      preview.querySelector('#api-dialog-modeless').addEventListener('click', () => dialog.show())
      preview.querySelector('#api-dialog-close').addEventListener('click', () => dialog.close())
    },
    code: `import { UI_EVENTS, type UIDialog } from '@collidor/ui'

const dialog = document.querySelector('ui-dialog') as UIDialog
dialog.addEventListener(UI_EVENTS.OPEN, (e) => {
  console.log('Opened:', e.detail.presentation) // 'modal' | 'modeless'
})
dialog.addEventListener(UI_EVENTS.CLOSE, () => {
  console.log('Closed')
})`,
  },

  drawer: {
    label: 'Open and close the drawer to inspect ui-open ({ placement }) and ui-close',
    html: `
      <ui-button variant="primary" size="sm" id="api-drawer-open">Open Drawer</ui-button>
      <ui-drawer id="api-drawer" title="Drawer Event Demo" placement="right" closable collapsible>
        <p style="margin: 0; font-size: 0.85rem;">Press Escape, click backdrop, or click × to emit ui-close.</p>
      </ui-drawer>
    `,
    targetSelector: '#api-drawer',
    events: [UI_EVENTS.OPEN, UI_EVENTS.CLOSE, UI_EVENTS.COLLAPSE_CHANGE],
    setup(preview) {
      const drawer = preview.querySelector('#api-drawer')
      preview.querySelector('#api-drawer-open').addEventListener('click', () => drawer.show())
    },
    code: `import { UI_EVENTS, type UIDrawer } from '@collidor/ui'

const drawer = document.querySelector('ui-drawer') as UIDrawer
drawer.addEventListener(UI_EVENTS.OPEN, (e) => {
  console.log('Drawer opened from:', e.detail.placement)
})
drawer.addEventListener(UI_EVENTS.CLOSE, () => {
  console.log('Drawer closed')
})`,
  },

  popover: {
    label: 'Toggle the popover to inspect ui-open ({ placement }) and ui-close',
    html: `
      <ui-button variant="outline" size="sm" id="api-popover-btn">Toggle Popover</ui-button>
      <ui-popover id="api-popover" placement="bottom-start">
        <div style="padding: 8px; font-size: 0.82rem;">Click outside or toggle again to emit <code>ui-close</code>.</div>
      </ui-popover>
    `,
    targetSelector: '#api-popover',
    events: [UI_EVENTS.OPEN, UI_EVENTS.CLOSE],
    setup(preview) {
      const btn = preview.querySelector('#api-popover-btn')
      const popover = preview.querySelector('#api-popover')
      btn.addEventListener('click', () => popover.toggle(btn))
    },
    code: `import { UI_EVENTS, type UIPopover } from '@collidor/ui'

const popover = document.querySelector('ui-popover') as UIPopover
popover.addEventListener(UI_EVENTS.OPEN, (e) => {
  console.log('Opened at placement:', e.detail.placement)
})
popover.addEventListener(UI_EVENTS.CLOSE, () => {
  console.log('Popover closed')
})`,
  },

  'context-menu': {
    label: 'Right-click inside the zone below and choose an item to observe ui-open, ui-select, and ui-close',
    html: `
      <div id="api-ctx-zone" style="width: 100%; padding: 18px; border: 1px dashed var(--docs-border); border-radius: 8px; text-align: center; font-size: 0.82rem; color: var(--docs-text-muted); cursor: context-menu;">
        Right-click here to emit <code>ui-open</code>, <code>ui-select</code>, and <code>ui-close</code>
      </div>
      <ui-context-menu id="api-ctx-menu" target="#api-ctx-zone">
        <ui-menu-item value="inspect" icon="🔍">Inspect</ui-menu-item>
        <ui-menu-item value="copy-id" icon="📋">Copy ID</ui-menu-item>
        <ui-menu-divider></ui-menu-divider>
        <ui-menu-item value="remove" icon="🗑️" danger>Remove</ui-menu-item>
      </ui-context-menu>
    `,
    targetSelector: '#api-ctx-menu',
    events: [UI_EVENTS.OPEN, UI_EVENTS.SELECT, UI_EVENTS.CLOSE],
    code: `import { UI_EVENTS, type UIContextMenu } from '@collidor/ui'

const menu = document.querySelector('ui-context-menu') as UIContextMenu
menu.addEventListener(UI_EVENTS.OPEN, (e) => {
  console.log('Opened at:', e.detail.x, e.detail.y)
})
menu.addEventListener(UI_EVENTS.SELECT, (e) => {
  console.log('Action:', e.detail.value, e.detail.item)
})
menu.addEventListener(UI_EVENTS.CLOSE, () => {
  console.log('Closed')
})`,
  },
}
