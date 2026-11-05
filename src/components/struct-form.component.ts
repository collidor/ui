import { html, css, nothing, type CSSResultGroup, type PropertyDeclarations } from 'lit'
import { UIElement, bool } from '../base.element.ts'
import { UI_TAG_NAMES } from '../constants.ts'
import './table.component.ts'
import './dialog.component.ts'
import './button.component.ts'
import './field.component.ts'
import './input.component.ts'
import './number-input.component.ts'
import './slider.component.ts'
import './switch.component.ts'
import './select.component.ts'
import './combobox.component.ts'
import './list.component.ts'
import './alert.component.ts'
import './tabs.component.ts'
import './stepper.component.ts'

export type StructFormWidgetType =
  | 'text'
  | 'number'
  | 'stepper'
  | 'slider'
  | 'range'
  | 'switch'
  | 'select'
  | 'combobox'
  | 'textarea'
  | 'table'
  | 'list'
  | 'tags'
  | (string & {})

export interface StructFormField {
  key: string
  path?: string
  label?: string
  description?: string
  placeholder?: string
  widget?: StructFormWidgetType
  widgetProps?: Record<string, unknown>
  required?: boolean
  defaultValue?: unknown
  type?: string
  options?: Array<{ value: string | number; label: string }>
  dataSource?: any
  virtual?: any
  pagination?: any
  collectionView?: any
  descriptor?: unknown
}

export interface StructFormChangeEventDetail {
  values: Record<string, unknown>
  fieldKey: string
  fieldValue: unknown
}

export interface StructFormSubmitEventDetail {
  values: Record<string, unknown>
}

function getByDotPath(obj: any, path?: string): any {
  if (!path || !obj) return obj
  const parts = path.split('.')
  let curr = obj
  for (const part of parts) {
    if (curr == null) return undefined
    curr = curr[part]
  }
  return curr
}

function inferFormFieldFromDescriptor(key: string, fieldDesc: any): StructFormField {
  const meta = (fieldDesc?.metadata as Record<string, unknown> | undefined) || {}
  let widget: StructFormWidgetType = typeof meta.widget === 'string' ? (meta.widget as any) : 'text'
  const kind = fieldDesc.kind
  const min = typeof fieldDesc.min === 'number' ? fieldDesc.min : undefined
  const max = typeof fieldDesc.max === 'number' ? fieldDesc.max : undefined
  const step = typeof fieldDesc.step === 'number' ? fieldDesc.step : undefined

  if (!meta.widget) {
    if (kind === 'number' || kind === 'integer') {
      widget = 'number'
    } else if (kind === 'boolean') {
      widget = 'switch'
    } else if (kind === 'enum') {
      widget = 'select'
    } else if (kind === 'array') {
      const itemsDesc = (fieldDesc as any).items
      if (itemsDesc?.kind === 'struct') {
        widget = 'table'
      } else {
        widget = 'tags'
      }
    }
  }

  const options =
    kind === 'enum' && Array.isArray(fieldDesc.values)
      ? fieldDesc.values.map((val: unknown) => ({
          value: String(val),
          label: String(val),
        }))
      : undefined

  return {
    key,
    label:
      typeof meta.label === 'string'
        ? meta.label
        : typeof fieldDesc.title === 'string'
          ? fieldDesc.title
          : key,
    description:
      typeof meta.description === 'string'
        ? meta.description
        : typeof fieldDesc.description === 'string'
          ? fieldDesc.description
          : undefined,
    widget,
    widgetProps: {
      min,
      max,
      step,
      ...(typeof meta.widgetProps === 'object' && meta.widgetProps !== null
        ? (meta.widgetProps as Record<string, unknown>)
        : {}),
    },
    options,
    defaultValue: fieldDesc.defaultValue,
    required: !fieldDesc.isOptional,
    descriptor: fieldDesc,
    dataSource: meta.dataSource || (fieldDesc as any).dataSource,
    virtual: meta.virtual || (fieldDesc as any).virtual,
    pagination: meta.pagination || (fieldDesc as any).pagination,
    collectionView: meta.collectionView || (fieldDesc as any).collectionView,
  }
}

export class UIStructForm extends UIElement {
  static override properties: PropertyDeclarations = {
    submitLabel: { type: String, attribute: 'submit-label', reflect: true },
    bordered: bool(),
    dense: bool(),
    loading: bool(),
    layout: { type: String, reflect: true },
    baseUrl: { type: String, attribute: 'base-url' },
    fetchInterceptor: { attribute: false },
    dataProviders: { attribute: false },
    fields: { attribute: false },
    values: { attribute: false },
    schema: { attribute: false },
    ariaLabel: { type: String, attribute: 'aria-label' },
  }

  static override styles: CSSResultGroup = css`
    :host {
      display: block;
      box-sizing: border-box;
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
      width: 100%;
    }

    :host([hidden]) {
      display: none !important;
    }

    .struct-form-root {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--ui-space-sm, 1em);
      box-sizing: border-box;
      background: var(--ui-card-bg, var(--ui-color-surface-elevated, oklch(0.22 0.025 260)));
      color: var(--ui-card-color, var(--ui-color-text, oklch(0.96 0.01 260)));
      border: none;
      border-radius: var(--ui-radius-md, 0.236em);
      padding: 0;
      overflow: hidden;
    }

    .struct-form-root.bordered {
      border: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.7));
      padding: var(--ui-space-sm, 1em);
    }

    /* Top Indeterminate Loader Bar */
    .form-loader-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: color-mix(in oklch, var(--ui-color-primary, oklch(0.65 0.19 230)) 20%, transparent);
      overflow: hidden;
      z-index: 20;
      pointer-events: none;
    }

    .form-loader-bar-indicator {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      background: var(--ui-color-primary, oklch(0.65 0.19 230));
      width: 40%;
      animation: form-indeterminate-bar 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    @keyframes form-indeterminate-bar {
      0% {
        left: -40%;
        width: 40%;
      }
      50% {
        left: 30%;
        width: 50%;
      }
      100% {
        left: 100%;
        width: 40%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .form-loader-bar-indicator {
        animation-duration: 2s;
      }
    }

    .form-fields-container.layout-stacked {
      display: flex;
      flex-direction: column;
      gap: var(--ui-space-xs, 0.618em);
    }

    .form-fields-container.layout-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--ui-space-xs, 0.618em);
    }

    .struct-form-root.dense .form-fields-container.layout-stacked,
    .struct-form-root.dense .form-fields-container.layout-grid {
      gap: var(--ui-space-3xs, 0.236em);
    }

    /* Layout Containers */
    .form-row {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: var(--ui-space-sm, 1em);
      align-items: flex-start;
      width: 100%;
    }

    .form-row > * {
      flex: 1 1 200px;
    }

    .form-grid {
      display: grid;
      gap: var(--ui-space-sm, 1em);
      width: 100%;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: var(--ui-space-xs, 0.618em);
      padding: var(--ui-space-sm, 1em);
      border: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.7));
      border-radius: var(--ui-radius-md, 0.236em);
      background: var(--ui-color-surface, oklch(0.20 0.02 260));
      width: 100%;
      box-sizing: border-box;
    }

    .form-section-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--ui-color-text, oklch(0.96 0.01 260));
    }

    .form-section-desc {
      margin: 0;
      font-size: 0.8rem;
      color: var(--ui-color-text-muted, oklch(0.70 0.02 260));
    }

    .form-section-body {
      display: flex;
      flex-direction: column;
      gap: var(--ui-space-xs, 0.618em);
    }

    /* Multi-Step Wizard */
    .form-steps-container {
      display: flex;
      flex-direction: column;
      gap: var(--ui-space-sm, 1em);
      width: 100%;
    }

    .form-stepper-nav {
      width: 100%;
      border-bottom: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.7));
      padding-bottom: var(--ui-space-sm, 1em);
      margin-bottom: var(--ui-space-2xs, 0.382em);
    }

    .stepper-list {
      display: flex;
      align-items: center;
      justify-content: space-between;
      list-style: none;
      padding: 0;
      margin: 0;
      width: 100%;
      gap: var(--ui-space-xs, 0.618em);
    }

    .stepper-item {
      display: flex;
      align-items: center;
      gap: var(--ui-space-2xs, 0.382em);
      cursor: pointer;
      user-select: none;
      opacity: 0.6;
      transition: opacity 0.2s;
      flex: 1;
    }

    .stepper-item:hover {
      opacity: 0.95;
    }

    .stepper-item.active {
      opacity: 1;
      font-weight: 600;
    }

    .stepper-item.completed {
      opacity: 0.85;
    }

    .step-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--ui-color-surface-elevated, oklch(0.25 0.03 260));
      border: 2px solid var(--ui-color-border-subtle, oklch(0.35 0.03 260));
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--ui-color-text-muted, oklch(0.70 0.02 260));
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .stepper-item.active .step-badge {
      background: var(--ui-color-primary, oklch(0.65 0.20 260));
      border-color: var(--ui-color-primary, oklch(0.65 0.20 260));
      color: white;
      box-shadow: 0 0 10px color-mix(in oklch, var(--ui-color-primary, oklch(0.65 0.20 260)) 50%, transparent);
    }

    .stepper-item.completed .step-badge {
      background: var(--ui-color-success, oklch(0.65 0.18 150));
      border-color: var(--ui-color-success, oklch(0.65 0.18 150));
      color: white;
    }

    .step-label {
      font-size: 0.85rem;
      color: var(--ui-color-text, oklch(0.96 0.01 260));
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .form-step-content {
      display: flex;
      flex-direction: column;
      gap: var(--ui-space-sm, 1em);
      width: 100%;
    }

    .form-step-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: var(--ui-space-sm, 1em);
      padding-top: var(--ui-space-sm, 1em);
      border-top: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.7));
    }

    .step-alert {
      margin-bottom: var(--ui-space-xs, 0.618em);
    }

    .step-error-list {
      margin: 0.382em 0 0 1.236em;
      padding: 0;
      font-size: 0.82rem;
      line-height: 1.4;
    }

    /* Tabs Container */
    .form-tabs-container {
      display: flex;
      flex-direction: column;
      gap: var(--ui-space-sm, 1em);
      width: 100%;
    }

    .form-tabs-header {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.7));
    }

    .form-tab-btn {
      padding: 8px 16px;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--ui-color-text-muted, oklch(0.70 0.02 260));
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }

    .form-tab-btn:hover {
      color: var(--ui-color-text, oklch(0.96 0.01 260));
    }

    .form-tab-btn.active {
      color: var(--ui-color-primary, oklch(0.65 0.20 260));
      border-bottom-color: var(--ui-color-primary, oklch(0.65 0.20 260));
      font-weight: 600;
    }

    .form-tab-body {
      padding: var(--ui-space-2xs, 0.382em) 0;
    }

    /* UI-Only Nodes */
    .form-heading {
      margin: var(--ui-space-2xs, 0.382em) 0 0 0;
      font-weight: 700;
      color: var(--ui-color-text, oklch(0.96 0.01 260));
    }

    .form-text {
      margin: 0;
      font-size: 0.875rem;
      color: var(--ui-color-text-muted, oklch(0.70 0.02 260));
    }

    .form-divider {
      border: none;
      border-top: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.7));
      margin: var(--ui-space-xs, 0.618em) 0;
      width: 100%;
    }

    .form-spacer {
      width: 100%;
    }

    .form-alert {
      margin-block-end: var(--ui-space-xs, 0.618em);
      width: 100%;
    }

    .form-button-container {
      display: flex;
      align-items: center;
      margin: var(--ui-space-2xs, 0.382em) 0;
    }

    .form-computed-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--ui-space-2xs, 0.382em) var(--ui-space-xs, 0.618em);
      background: var(--ui-color-surface-elevated, oklch(0.25 0.03 260));
      border: 1px dashed var(--ui-color-border-subtle, oklch(0.35 0.03 260));
      border-radius: var(--ui-radius-sm, 0.146em);
      font-size: 0.85rem;
      width: 100%;
      box-sizing: border-box;
    }

    .form-computed-box .computed-label {
      font-weight: 600;
      color: var(--ui-color-text-muted, oklch(0.70 0.02 260));
    }

    .form-computed-box .computed-val {
      font-family: var(--ui-font-family-mono, monospace);
      font-weight: 700;
      color: var(--ui-color-accent, oklch(0.8 0.15 150));
    }

    /* Table Widget using <ui-table> */
    .form-table-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--ui-space-3xs, 0.236em);
      width: 100%;
      box-sizing: border-box;
      margin-block-end: var(--ui-space-xs, 0.618em);
    }

    .form-table-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ui-space-xs, 0.618em);
      margin-bottom: var(--ui-space-4xs, 0.146em);
    }

    .form-table-title-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .form-table-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--ui-color-text-muted, oklch(0.70 0.02 260));
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .form-table-desc {
      font-size: 0.75rem;
      color: var(--ui-color-text-muted, oklch(0.60 0.02 260));
    }

    .form-table-wrapper ui-table {
      width: 100%;
      min-height: 140px;
    }

    .table-foot-aggregations {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: var(--ui-space-3xs, 0.236em) var(--ui-space-xs, 0.618em);
      background: var(--ui-color-surface-elevated, oklch(0.21 0.02 260));
      border: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.7));
      border-radius: var(--ui-radius-sm, 0.146em);
    }

    .aggregations-list {
      display: flex;
      align-items: center;
      gap: var(--ui-space-sm, 1em);
    }

    .aggregation-badge {
      font-size: 0.8rem;
      color: var(--ui-color-text, oklch(0.90 0.01 260));
    }

    .aggregation-badge strong {
      color: var(--ui-color-text-muted, oklch(0.70 0.02 260));
    }

    .subform-dialog-body {
      padding: var(--ui-space-xs, 0.618em);
      width: 100%;
      box-sizing: border-box;
    }

    .subform-instance {
      width: 100%;
    }

    /* Tags Widget */
    .form-tags-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--ui-space-3xs, 0.236em);
      width: 100%;
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ui-space-3xs, 0.236em);
      padding: var(--ui-space-3xs, 0.236em) var(--ui-space-2xs, 0.382em);
      background: var(--ui-color-surface-elevated, oklch(0.22 0.025 260));
      border: 1px solid var(--ui-color-border-subtle, oklch(0.35 0.03 260 / 0.7));
      border-radius: var(--ui-radius-sm, 0.146em);
      min-height: 36px;
      box-sizing: border-box;
    }

    .tag-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: color-mix(in oklch, var(--ui-color-primary, oklch(0.65 0.20 260)) 25%, var(--ui-color-surface, oklch(0.20 0.02 260)));
      border: 1px solid color-mix(in oklch, var(--ui-color-primary, oklch(0.65 0.20 260)) 45%, transparent);
      border-radius: 999px;
      font-size: 0.75rem;
      color: var(--ui-color-text, oklch(0.96 0.01 260));
    }

    .tag-del-btn {
      background: transparent;
      border: none;
      color: var(--ui-color-text-muted, oklch(0.70 0.02 260));
      cursor: pointer;
      padding: 0;
      font-size: 0.75rem;
      line-height: 1;
    }

    .tag-del-btn:hover {
      color: var(--ui-color-danger, oklch(0.65 0.22 25));
    }

    .tag-input {
      flex: 1 1 120px;
      border: none;
      background: transparent;
      color: var(--ui-color-text, oklch(0.96 0.01 260));
      font-size: 0.85rem;
      padding: 4px;
    }

    .tag-input:focus {
      outline: none;
    }

    .form-textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 0.5em 0.75em;
      background: var(--ui-color-surface-elevated, oklch(0.22 0.025 260));
      border: 1px solid var(--ui-color-border-subtle, oklch(0.35 0.03 260 / 0.7));
      border-radius: var(--ui-radius-sm, 0.146em);
      color: var(--ui-color-text, oklch(0.96 0.01 260));
      font-family: inherit;
      font-size: 0.875rem;
      resize: vertical;
    }

    .form-textarea:focus {
      outline: none;
      border-color: var(--ui-color-primary, oklch(0.65 0.20 260));
    }

    .form-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--ui-space-xs, 0.618em);
      margin-top: var(--ui-space-xs, 0.618em);
    }
  `

  submitLabel = 'Submit'
  bordered = false
  dense = false
  loading = false
  layout: 'stacked' | 'grid' = 'stacked'
  ariaLabel = ''

  get isFetching(): boolean {
    if (this.loading) return true
    for (const cache of this.#dataSourceCache.values()) {
      if (cache.loading) return true
    }
    return false
  }
  baseUrl?: string
  fetchInterceptor?: (
    url: string,
    init: RequestInit,
  ) => Promise<Response | RequestInit | void> | Response | RequestInit | void
  dataProviders?: Record<
    string,
    (params: Record<string, unknown>) => Promise<{ items: unknown[]; total?: number; nextCursor?: string }>
  >

  #fields: StructFormField[] = []
  #values: Record<string, unknown> = {}
  #schema: unknown = null

  // Data source runtime cache and controllers
  #dataSourceCache = new Map<
    string,
    { items: unknown[]; total?: number; nextCursor?: string; loading?: boolean; page?: number }
  >()
  #abortControllers = new Map<string, AbortController>()
  #dependentFields = new Map<string, Set<string>>()

  // Subform modal state for table additions and edits
  #subformDialogOpen = false
  #subformDialogField: StructFormField | null = null
  #subformDialogRowIndex = -1
  #subformDialogValues: Record<string, unknown> = {}

  // Wizard and Tab navigation state
  #activeStepIndices: Record<string, number> = {}
  #activeTabs: Record<string, string> = {}

  // Validation and step blocking state
  #errors: Record<string, string> = {}
  #stepErrors: Record<string, string[]> = {}

  override connectedCallback(): void {
    super.connectedCallback()
    this.#initDataSources()
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    for (const controller of this.#abortControllers.values()) {
      controller.abort()
    }
    this.#abortControllers.clear()
  }

  get errors(): Record<string, string> {
    return { ...this.#errors }
  }

  set errors(errs: Record<string, string>) {
    this.#errors = errs ? { ...errs } : {}
    this.requestUpdate('errors', null)
  }

  get fields(): StructFormField[] {
    return this.#fields
  }

  set fields(f: StructFormField[]) {
    this.#fields = Array.isArray(f) ? [...f] : []
    for (const field of this.#fields) {
      if (this.#values[field.key] === undefined && field.defaultValue !== undefined) {
        this.#values[field.key] = field.defaultValue
      }
    }
    this.#initDataSources()
    this.requestUpdate('fields', null)
  }

  get values(): Record<string, unknown> {
    return { ...this.#values }
  }

  set values(v: Record<string, unknown>) {
    this.#values = typeof v === 'object' && v !== null ? { ...v } : {}
    this.#initDataSources()
    this.requestUpdate('values', null)
  }

  get schema(): unknown {
    return this.#schema
  }

  set schema(s: unknown) {
    this.#schema = s
    if (s && typeof s === 'object') {
      const maybeSchema = s as any
      if (typeof maybeSchema.toFormTree === 'function') {
        try {
          const tree = maybeSchema.toFormTree(this.#values)
          if (tree && tree.fieldsByKey) {
            this.fields = Object.values(tree.fieldsByKey) as StructFormField[]
          }
        } catch (err) {
          console.error('Error generating form fields from schema:', err)
        }
      } else if (maybeSchema.descriptor?.fields) {
        this.fields = Object.entries(maybeSchema.descriptor.fields).map(
          ([key, fieldDesc]: [string, any]) => inferFormFieldFromDescriptor(key, fieldDesc),
        )
      }
    }
    this.requestUpdate('schema', null)
  }

  get #formTree(): any {
    if (this.#schema && typeof (this.#schema as any).toFormTree === 'function') {
      try {
        return (this.#schema as any).toFormTree(this.#values)
      } catch (err) {
        console.error('Error generating form tree in UIStructForm:', err)
        return null
      }
    }
    return null
  }

  public getFieldValue(key: string): unknown {
    return this.#values[key]
  }

  public setFieldValue(key: string, value: unknown): void {
    this.#values = {
      ...this.#values,
      [key]: value,
    }
    if (this.#errors[key]) {
      const updated = { ...this.#errors }
      delete updated[key]
      this.#errors = updated
    }
    const detail: StructFormChangeEventDetail = {
      values: this.values,
      fieldKey: key,
      fieldValue: value,
    }
    this.emit('ui-form-change', detail)
    this.#handleFieldDependencies(key)
    this.requestUpdate()
  }

  #initDataSources(): void {
    this.#dependentFields.clear()
    const fieldsToInspect = this.#fields
    for (const field of fieldsToInspect) {
      if (field.dataSource) {
        const deps: string[] = field.dataSource.dependsOn || []
        for (const dep of deps) {
          if (!this.#dependentFields.has(dep)) {
            this.#dependentFields.set(dep, new Set())
          }
          this.#dependentFields.get(dep)!.add(field.key)
        }

        // Trigger initial fetch if not cached
        if (!this.#dataSourceCache.has(field.key)) {
          this.#fetchDataSource(field.key, field.dataSource, {
            page: 1,
            append: false,
            field,
          })
        }
      }
    }
  }

  #handleFieldDependencies(parentKey: string): void {
    const dependents = this.#dependentFields.get(parentKey)
    if (!dependents || dependents.size === 0) return

    for (const depKey of dependents) {
      const depField = this.#fields.find((f) => f.key === depKey)
      if (!depField || !depField.dataSource) continue

      // Reset dependent value in form values
      if (this.#values[depKey] !== undefined) {
        this.#values = { ...this.#values, [depKey]: undefined }
      }

      // Invalidate cache
      this.#dataSourceCache.delete(depKey)

      // Cascading dependency invalidation if another field depends on this one
      this.#handleFieldDependencies(depKey)

      // Fresh fetch with new parent values
      this.#fetchDataSource(depKey, depField.dataSource, {
        page: 1,
        append: false,
        field: depField,
      })
    }
  }

  #interpolateString(str: string, context: Record<string, any>): string {
    return str
      .replace(/\$values\.([a-zA-Z0-9_.-]+)/g, (_, path) => {
        const val = getByDotPath(this.#values, path)
        return val !== undefined && val !== null ? String(val) : ''
      })
      .replace(/\$search/g, context.search ?? '')
      .replace(/\$page/g, String(context.page ?? 1))
      .replace(/\$pageSize/g, String(context.pageSize ?? 20))
      .replace(/\$cursor/g, context.cursor ?? '')
  }

  #interpolateValue(val: unknown, context: Record<string, any>): unknown {
    if (typeof val === 'string') {
      if (val === '$page') return context.page ?? 1
      if (val === '$pageSize') return context.pageSize ?? 20
      if (val === '$search') return context.search ?? ''
      if (val === '$cursor') return context.cursor ?? ''
      if (val.startsWith('$values.')) {
        const path = val.slice('$values.'.length)
        if (!path.includes(' ') && !path.includes('/') && !path.includes('&') && !path.includes('?')) {
          const directVal = getByDotPath(this.#values, path)
          if (directVal !== undefined) return directVal
        }
      }
      return this.#interpolateString(val, context)
    }
    if (Array.isArray(val)) {
      return val.map((item) => this.#interpolateValue(item, context))
    }
    if (typeof val === 'object' && val !== null) {
      const res: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(val)) {
        res[k] = this.#interpolateValue(v, context)
      }
      return res
    }
    return val
  }

  async #fetchDataSource(
    fieldKey: string,
    ds: any,
    options: {
      page?: number
      search?: string
      cursor?: string
      append?: boolean
      field?: StructFormField
    } = {},
  ): Promise<void> {
    if (!ds || typeof ds !== 'object') return

    const deps = ds.dependsOn || []
    const hasUnsatisfiedDep = deps.some((depKey: string) => {
      const val = this.#values[depKey]
      return val === undefined || val === null || val === ''
    })

    if (hasUnsatisfiedDep) {
      this.#dataSourceCache.set(fieldKey, {
        items: [],
        loading: false,
        page: 1,
      })
      this.requestUpdate()
      return
    }

    const field = options.field || this.#fields.find((f) => f.key === fieldKey)
    const pageSize = field?.pagination?.pageSize || 20
    const page = options.page ?? 1
    const search = options.search ?? ''
    const cursor = options.cursor
    const append = Boolean(options.append)

    const context: Record<string, any> = {
      page,
      pageSize,
      search,
      cursor,
      values: this.#values,
    }

    const prevCache = this.#dataSourceCache.get(fieldKey)
    this.#dataSourceCache.set(fieldKey, {
      items: prevCache?.items || [],
      total: prevCache?.total,
      loading: true,
      page,
    })
    this.emit('ui-form-loading', { loading: true, fieldKey })
    this.requestUpdate()

    const prevController = this.#abortControllers.get(fieldKey)
    if (prevController) {
      prevController.abort()
    }
    const controller = new AbortController()
    this.#abortControllers.set(fieldKey, controller)

    try {
      let payload: { items: any[]; total?: number; nextCursor?: string }
      if (ds.type === 'provider') {
        payload = await this.#executeProviderFetch(ds, context)
        if (!this.dataProviders?.[ds.key]) {
          this.#dataSourceCache.set(fieldKey, {
            items: prevCache?.items || [],
            total: prevCache?.total,
            loading: false,
            page,
          })
          this.requestUpdate()
          return
        }
      } else {
        const url = this.#buildHttpUrl(ds.url, ds.query, context)
        const responseData = await this.#executeHttpFetch(url, ds, context, controller.signal)
        payload = this.#extractDataPayload(responseData, ds)
      }

      const widget = field?.collectionView?.mode === 'combobox' ? 'combobox' : field?.widget
      const isOptionPicker =
        widget === 'combobox' ||
        widget === 'select' ||
        widget === 'tags' ||
        !widget ||
        widget === 'text'

      const mappedItems =
        isOptionPicker && widget !== 'table' && widget !== 'list'
          ? this.#normalizeOptionPickerItems(payload.items, ds)
          : payload.items

      const existingItems = (append && this.#dataSourceCache.get(fieldKey)?.items) || []
      const combinedItems = append ? [...existingItems, ...mappedItems] : mappedItems

      this.#dataSourceCache.set(fieldKey, {
        items: combinedItems,
        total: payload.total,
        nextCursor: payload.nextCursor,
        loading: false,
        page,
      })
      this.emit('ui-form-loading', { loading: false, fieldKey })
      this.requestUpdate()
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return
      }
      console.error(`Error fetching data source for field "${fieldKey}":`, err)
      const prev = this.#dataSourceCache.get(fieldKey)
      this.#dataSourceCache.set(fieldKey, {
        items: prev?.items || [],
        total: prev?.total,
        loading: false,
        page: prev?.page || 1,
      })
      this.emit('ui-form-loading', { loading: false, fieldKey })
      this.requestUpdate()
    }
  }

  async #executeProviderFetch(
    dataSource: any,
    context: Record<string, any>,
  ): Promise<{ items: any[]; total?: number; nextCursor?: string }> {
    const provider = this.dataProviders?.[dataSource.key]
    if (!provider) {
      console.warn(`[UIStructForm] Data provider "${dataSource.key}" not found on form`)
      return { items: [] }
    }

    const params = (this.#interpolateValue(dataSource.params || {}, context) as Record<string, unknown>) || {}
    const result = await provider({
      ...params,
      page: context.page,
      pageSize: context.pageSize,
      search: context.search,
      cursor: context.cursor,
    })

    return {
      items: Array.isArray(result?.items) ? result.items : [],
      total: typeof result?.total === 'number' ? result.total : undefined,
      nextCursor: result?.nextCursor,
    }
  }

  #buildHttpUrl(rawUrl: string, queryConfig: any, context: Record<string, any>): string {
    let finalUrl = this.#interpolateString(rawUrl || '', context)
    if (this.baseUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      const base = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl
      const path = finalUrl.startsWith('/') ? finalUrl : `/${finalUrl}`
      finalUrl = `${base}${path}`
    }

    if (queryConfig) {
      const interpolatedQuery = this.#interpolateValue(queryConfig, context) as Record<string, any>
      const isAbsolute = finalUrl.startsWith('http://') || finalUrl.startsWith('https://')
      const urlObj = new URL(finalUrl, isAbsolute ? undefined : 'http://dummy.local')
      for (const [key, value] of Object.entries(interpolatedQuery)) {
        if (value !== undefined && value !== null && value !== '') {
          urlObj.searchParams.set(key, String(value))
        }
      }
      finalUrl = isAbsolute ? urlObj.toString() : urlObj.pathname + urlObj.search
    }

    return finalUrl
  }

  async #executeHttpFetch(
    url: string,
    dataSource: any,
    context: Record<string, any>,
    signal: AbortSignal,
  ): Promise<any> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((this.#interpolateValue(dataSource.headers || {}, context) as Record<string, string>) || {}),
    }

    const method = (dataSource.method || 'GET').toUpperCase()
    let body: string | undefined = undefined
    if (method === 'POST' && dataSource.body) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json'
      body = JSON.stringify(this.#interpolateValue(dataSource.body, context))
    }

    let fetchInit: RequestInit = {
      method,
      headers,
      signal,
      ...(body ? { body } : {}),
    }

    let response: Response
    if (this.fetchInterceptor) {
      const intercepted = await this.fetchInterceptor(url, fetchInit)
      if (intercepted instanceof Response || (intercepted && typeof (intercepted as any).json === 'function')) {
        response = intercepted as Response
      } else if (intercepted && typeof intercepted === 'object') {
        fetchInit = { ...fetchInit, ...(intercepted as RequestInit) }
        response = await fetch(url, fetchInit)
      } else {
        response = await fetch(url, fetchInit)
      }
    } else {
      response = await fetch(url, fetchInit)
    }

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  #extractDataPayload(data: any, dataSource: any): { items: any[]; total?: number; nextCursor?: string } {
    let items: any[] = []
    let total: number | undefined = undefined
    let nextCursor: string | undefined = undefined

    if (dataSource.responseItemsPath) {
      items = getByDotPath(data, dataSource.responseItemsPath) || []
    } else if (Array.isArray(data)) {
      items = data
    } else if (Array.isArray(data?.items)) {
      items = data.items
    } else if (Array.isArray(data?.data)) {
      items = data.data
    }

    if (dataSource.responseTotalPath) {
      const totalCount = getByDotPath(data, dataSource.responseTotalPath)
      if (typeof totalCount === 'number') total = totalCount
    } else if (typeof data?.total === 'number') {
      total = data.total
    } else if (typeof data?.count === 'number') {
      total = data.count
    }

    if (dataSource.responseNextCursorPath) {
      nextCursor = getByDotPath(data, dataSource.responseNextCursorPath)
    } else if (data?.nextCursor) {
      nextCursor = String(data.nextCursor)
    }

    return { items, total, nextCursor }
  }

  #normalizeOptionPickerItems(rawItems: any[], dataSource: any): any[] {
    const valueKey = dataSource.valueKey || 'value'
    const labelKey = dataSource.labelKey || 'label'
    const descKey = dataSource.descriptionKey || 'description'

    return rawItems.map((item: any) => {
      if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
        return { value: item, label: String(item) }
      }
      if (item && typeof item === 'object') {
        const value =
          item[valueKey] !== undefined ? item[valueKey] : item.id !== undefined ? item.id : item.key
        const label =
          item[labelKey] !== undefined
            ? item[labelKey]
            : item.title !== undefined
              ? item.title
              : item.name !== undefined
                ? item.name
                : String(value)
        const description = item[descKey] !== undefined ? item[descKey] : item.description
        return {
          value,
          label: String(label ?? value),
          ...(description ? { description: String(description) } : {}),
          ...item,
        }
      }
      return { value: String(item), label: String(item) }
    })
  }

  async #onFieldGetPage(
    fieldKey: string,
    field: StructFormField,
    detail: { page?: number; search?: string; cursor?: string; append?: boolean },
  ): Promise<void> {
    if (!field.dataSource) return
    await this.#fetchDataSource(fieldKey, field.dataSource, {
      page: detail.page,
      search: detail.search,
      cursor: detail.cursor,
      append: detail.append,
      field,
    })
  }

  #runSchemaValidation(): any[] | undefined {
    if (!this.#schema) return undefined

    // 1. Check if schema has StandardSchema validate
    if (typeof (this.#schema as any)['~standard']?.validate === 'function') {
      try {
        const res = (this.#schema as any)['~standard'].validate(this.#values)
        if (res && res.issues) {
          return res.issues
        }
        return []
      } catch (err) {
        console.error('Error in standard schema validation:', err)
      }
    }

    // 2. Check if schema has validate(values)
    if (typeof (this.#schema as any).validate === 'function') {
      try {
        const res = (this.#schema as any).validate(this.#values)
        if (res && res.issues) {
          return res.issues
        }
        return []
      } catch (err) {
        console.error('Error in schema validate():', err)
      }
    }

    // 3. Fallback: check required fields if no schema validate function
    const issues: any[] = []
    for (const field of this.#fields) {
      if (field.required) {
        const val = this.#values[field.key]
        if (val === undefined || val === null || val === '') {
          issues.push({ path: [field.key], message: `${field.label || field.key} is required` })
        }
      }
    }
    return issues
  }

  #extractIssueKey(issue: any): string {
    if (!issue || !issue.path || !Array.isArray(issue.path)) return ''
    return issue.path
      .map((p: any) => (typeof p === 'object' && p !== null && 'key' in p ? p.key : String(p)))
      .join('.')
  }

  #collectNodeFieldKeys(node: any): string[] {
    const keys: string[] = []
    if (!node) return keys
    if (node.kind === 'field' && (node.key || node.path)) {
      if (node.path) keys.push(node.path)
      if (node.key) keys.push(node.key)
    }
    const children = Array.isArray(node.children)
      ? node.children
      : Array.isArray(node.nodes)
        ? node.nodes
        : []
    for (const child of children) {
      keys.push(...this.#collectNodeFieldKeys(child))
    }
    return Array.from(new Set(keys))
  }

  #findLayoutNode(node: any, targetKey: string, layoutKinds: string[]): any {
    if (!node) return null
    if (node.kind === 'layout' && layoutKinds.includes(node.layoutKind)) {
      if (!targetKey || node.path === targetKey || node.key === targetKey) {
        return node
      }
    }
    const children = Array.isArray(node.children)
      ? node.children
      : Array.isArray(node.nodes)
        ? node.nodes
        : []
    for (const child of children) {
      const found = this.#findLayoutNode(child, targetKey, layoutKinds)
      if (found) return found
    }
    return null
  }

  public validate(): boolean {
    const issues = this.#runSchemaValidation()
    const newErrors: Record<string, string> = {}
    if (issues && Array.isArray(issues)) {
      for (const issue of issues) {
        const key = this.#extractIssueKey(issue)
        if (key && !newErrors[key]) {
          newErrors[key] = issue.message
        }
      }
    }
    this.#errors = newErrors
    this.requestUpdate()
    return Object.keys(newErrors).length === 0
  }

  public validateStep(stepIndexOrNode: number | any, containerKey?: string): boolean {
    let stepNode: any = null
    let cKey = containerKey || ''

    if (typeof stepIndexOrNode === 'number') {
      const tree = this.#formTree
      if (tree) {
        const stepsContainer = this.#findLayoutNode(tree, cKey, ['steps', 'wizard'])
        if (stepsContainer && stepsContainer.children) {
          stepNode = stepsContainer.children[stepIndexOrNode]
          cKey = stepsContainer.path || stepsContainer.key || cKey
        }
      }
    } else if (stepIndexOrNode && typeof stepIndexOrNode === 'object') {
      stepNode = stepIndexOrNode
    }

    if (!stepNode) return true

    // 1. Collect all field keys for this step
    const stepFieldKeys = new Set(this.#collectNodeFieldKeys(stepNode))

    // 2. Run schema validation to get issues
    const issues = this.#runSchemaValidation() || []

    // 3. Filter issues that belong to this step's fields
    const stepErrors: Record<string, string> = {}
    for (const issue of issues) {
      const issueKey = this.#extractIssueKey(issue)
      if (issueKey && stepFieldKeys.has(issueKey)) {
        if (!stepErrors[issueKey]) {
          stepErrors[issueKey] = issue.message
        }
      }
    }


    // Update #errors: clear previous step errors for these fields, then set current
    const updatedErrors = { ...this.#errors }
    for (const k of stepFieldKeys) {
      delete updatedErrors[k]
    }
    delete updatedErrors[`_step_${cKey}`]

    const errorCount = Object.keys(stepErrors).length
    if (errorCount > 0) {
      Object.assign(updatedErrors, stepErrors)
      this.#errors = updatedErrors
      this.#stepErrors = {
        ...this.#stepErrors,
        [cKey]: Object.values(stepErrors),
      }
      this.emit('ui-form-step-error', {
        stepKey: stepNode.key || stepNode.path,
        errors: stepErrors,
      })
      this.requestUpdate()
      return false
    }

    // Step is valid
    this.#errors = updatedErrors
    const updatedStepErrors = { ...this.#stepErrors }
    delete updatedStepErrors[cKey]
    this.#stepErrors = updatedStepErrors
    this.requestUpdate()
    return true
  }

  public submit(): boolean {
    const isValid = this.validate()
    if (!isValid) {
      this.emit('ui-form-invalid', { errors: this.errors, values: this.values })
      return false
    }
    const detail: StructFormSubmitEventDetail = {
      values: this.values,
    }
    this.emit('ui-form-submit', detail)
    return true
  }

  #onSubmit = (event: Event): void => {
    event.preventDefault()
    this.submit()
  }

  #onWidgetEvent = (event: Event): void => {
    const path = event.composedPath()
    const widget = path.find(
      (node): node is HTMLElement => node instanceof HTMLElement && node.hasAttribute('data-key'),
    )
    if (!widget) return
    const key = widget.getAttribute('data-key')
    if (!key) return

    const detail = (event as CustomEvent<{ value?: unknown; checked?: boolean }>).detail
    const tag = widget.tagName.toLowerCase()
    const withValue = widget as HTMLElement & { value?: unknown; checked?: boolean }
    let value: unknown
    if (tag === 'ui-switch') {
      if (detail && typeof detail === 'object' && 'checked' in detail) value = detail.checked
      else value = withValue.checked ?? widget.hasAttribute('checked')
    } else if (detail && typeof detail === 'object' && 'value' in detail) {
      value = detail.value
    } else if ('value' in withValue && withValue.value !== undefined) {
      value = withValue.value
    } else {
      value = widget.getAttribute('value')
    }
    this.setFieldValue(key, value)
  }

  #attrIfDefined(value: unknown): unknown {
    return typeof value === 'number' || typeof value === 'string' ? value : nothing
  }

  #setStep(containerKey: string, idx: number) {
    const current = this.#activeStepIndices[containerKey] || 0
    if (idx > current) {
      const tree = this.#formTree
      const stepsNode = this.#findLayoutNode(tree, containerKey, ['steps', 'wizard'])
      const stepsList = stepsNode?.children || []
      const validateOnNext = stepsNode?.options?.validateOnNext !== false

      if (validateOnNext && stepsList.length) {
        for (let i = current; i < idx; i++) {
          const stepNode = stepsList[i]
          if (stepNode && !this.validateStep(stepNode, containerKey)) {
            // Block navigation! Stay on first failing step
            this.#activeStepIndices = {
              ...this.#activeStepIndices,
              [containerKey]: i,
            }
            this.requestUpdate()
            return
          }
        }
      }
    }

    const updatedStepErrors = { ...this.#stepErrors }
    delete updatedStepErrors[containerKey]
    this.#stepErrors = updatedStepErrors

    this.#activeStepIndices = {
      ...this.#activeStepIndices,
      [containerKey]: idx,
    }
    this.requestUpdate()
  }

  #nextStep(containerKey: string, total: number) {
    const current = this.#activeStepIndices[containerKey] || 0
    const tree = this.#formTree
    const stepsNode = this.#findLayoutNode(tree, containerKey, ['steps', 'wizard'])
    const stepsList = stepsNode?.children || []
    const currentStepNode = stepsList[current]

    const validateOnNext = stepsNode?.options?.validateOnNext !== false

    if (validateOnNext && currentStepNode) {
      const isValid = this.validateStep(currentStepNode, containerKey)
      if (!isValid) {
        return
      }
    }

    if (current < total - 1) {
      this.#setStep(containerKey, current + 1)
    }
  }

  #prevStep(containerKey: string) {
    const current = this.#activeStepIndices[containerKey] || 0
    if (current > 0) {
      this.#setStep(containerKey, current - 1)
    }
  }

  #setTab(containerKey: string, tabKey: string) {
    this.#activeTabs = {
      ...this.#activeTabs,
      [containerKey]: tabKey,
    }
    this.requestUpdate()
  }

  #openSubformDialog(field: StructFormField, index: number = -1, row?: Record<string, unknown>) {
    this.#subformDialogField = field
    this.#subformDialogRowIndex = index
    if (index >= 0 && row) {
      this.#subformDialogValues = { ...row }
    } else {
      const defaultVals: Record<string, unknown> = {}
      const desc = (field as any).descriptor
      if (desc?.items?.fields) {
        for (const [k, f] of Object.entries(desc.items.fields) as [string, any][]) {
          if (f.defaultValue !== undefined) defaultVals[k] = f.defaultValue
          else if (f.kind === 'number' || f.kind === 'integer') defaultVals[k] = 0
          else defaultVals[k] = ''
        }
      } else {
        const props = (field.widgetProps || {}) as Record<string, unknown>
        const columns = Array.isArray(props.columns) ? props.columns : []
        for (const col of columns) {
          defaultVals[col.key] = col.type === 'number' ? 0 : ''
        }
      }
      this.#subformDialogValues = defaultVals
    }
    this.#subformDialogOpen = true
    this.requestUpdate()
  }

  #closeSubformDialog() {
    this.#subformDialogOpen = false
    this.#subformDialogField = null
    this.#subformDialogRowIndex = -1
    this.#subformDialogValues = {}
    this.requestUpdate()
  }

  #onSubformSubmit = (event: CustomEvent<{ values: Record<string, unknown> }>) => {
    event.stopPropagation()
    if (!this.#subformDialogField) return
    const fieldKey = this.#subformDialogField.key
    const currentArray = Array.isArray(this.#values[fieldKey])
      ? [...(this.#values[fieldKey] as Array<Record<string, unknown>>)]
      : []

    const submittedItem = event.detail?.values ?? {}
    if (this.#subformDialogRowIndex >= 0) {
      currentArray[this.#subformDialogRowIndex] = submittedItem
    } else {
      currentArray.push(submittedItem)
    }

    this.setFieldValue(fieldKey, currentArray)
    this.#closeSubformDialog()
  }

  #getSubformSchema(field: StructFormField): unknown {
    const desc = (field as any).descriptor
    if (desc?.items && typeof desc.items === 'object') {
      if (desc.items.fields) {
        return { descriptor: desc.items }
      }
      if (desc.items.descriptor) {
        return desc.items
      }
    }

    // Fallback: construct schema from columns
    const props = (field.widgetProps || {}) as Record<string, unknown>
    const columns = Array.isArray(props.columns) ? props.columns : []
    const fields: Record<string, Record<string, unknown>> = {}
    for (const col of columns) {
      if (col.key === '__actions') continue
      fields[col.key] = {
        kind: col.type === 'number' || col.widget === 'number' ? 'number' : 'string',
        title: col.label || col.key,
        metadata: {
          label: col.label || col.key,
          widget: col.widget || (col.type === 'number' ? 'number' : 'text'),
        },
      }
    }
    return { descriptor: { kind: 'struct', fields } }
  }

  #removeTableRow = (fieldKey: string, rowIndex: number) => {
    const currentArray = Array.isArray(this.#values[fieldKey])
      ? [...(this.#values[fieldKey] as Array<Record<string, unknown>>)]
      : []
    currentArray.splice(rowIndex, 1)
    this.setFieldValue(fieldKey, currentArray)
  }

  #onTagInputKeydown = (fieldKey: string, e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const input = e.target as HTMLInputElement
      const val = input.value.trim()
      if (val) {
        const current = Array.isArray(this.#values[fieldKey])
          ? [...(this.#values[fieldKey] as unknown[])]
          : []
        if (!current.includes(val)) {
          current.push(val)
          this.setFieldValue(fieldKey, current)
        }
        input.value = ''
      }
    }
  }

  #removeTag = (fieldKey: string, tagIndex: number) => {
    const current = Array.isArray(this.#values[fieldKey])
      ? [...(this.#values[fieldKey] as unknown[])]
      : []
    current.splice(tagIndex, 1)
    this.setFieldValue(fieldKey, current)
  }

  #handleButtonAction(action: unknown) {
    if (action === 'submit') {
      this.submit()
    } else if (typeof action === 'function') {
      try {
        action({ values: this.values })
      } catch (e) {
        console.error('Error executing form button action:', e)
      }
    }
  }

  #renderTableWidget(field: StructFormField, value: unknown) {
    const key = field.key
    const label = field.label || key
    const props = (field.widgetProps || {}) as Record<string, unknown>
    let columns = Array.isArray(props.columns)
      ? [...(props.columns as Array<Record<string, unknown>>)]
      : []
    const cached = this.#dataSourceCache.get(key)
    const rows =
      cached?.items && cached.items.length > 0
        ? (cached.items as Array<Record<string, unknown>>)
        : Array.isArray(value)
          ? [...(value as Array<Record<string, unknown>>)]
          : []

    // If columns not explicitly configured, infer from descriptor or first row
    if (columns.length === 0) {
      const desc = (field as any).descriptor
      if (desc?.items?.fields) {
        columns = Object.entries(desc.items.fields).map(([colK, colDesc]: [string, any]) => ({
          key: colK,
          label: colDesc.metadata?.label || colDesc.title || colK,
          type: colDesc.kind,
        }))
      } else if (rows.length > 0 && typeof rows[0] === 'object' && rows[0] !== null) {
        columns = Object.keys(rows[0]).map((colK) => ({
          key: colK,
          label: colK,
          type: typeof (rows[0] as any)[colK] === 'number' ? 'number' : 'text',
        }))
      }
    }

    const aggregations = Array.isArray(props.aggregations)
      ? (props.aggregations as Array<{ column: string; op: string; label?: string }>)
      : []

    // Build columns for <ui-table>, including action column with Edit & Delete triggers
    const tableColumns = [
      ...columns.map((col: any) => ({
        key: col.key,
        label: col.label || col.key,
        width: col.width,
        align: col.align || 'left',
        sortable: col.sortable !== undefined ? Boolean(col.sortable) : true,
      })),
      {
        key: '__actions',
        label: '',
        width: '90px',
        align: 'center' as const,
        sortable: false,
        formatter: (_val: unknown, row: unknown, index: number) => {
          const container = document.createElement('div')
          container.style.display = 'inline-flex'
          container.style.alignItems = 'center'
          container.style.justifyContent = 'center'
          container.style.gap = '6px'

          const editBtn = document.createElement('button')
          editBtn.type = 'button'
          editBtn.className = 'btn-action-edit'
          editBtn.title = 'Edit Entry'
          editBtn.textContent = '✎ Edit'
          editBtn.style.padding = '2px 8px'
          editBtn.style.fontSize = '0.75rem'
          editBtn.style.cursor = 'pointer'
          editBtn.style.background = 'var(--ui-color-surface-hover, oklch(0.26 0.025 260))'
          editBtn.style.border = '1px solid var(--ui-color-border-subtle, oklch(0.35 0.03 260 / 0.7))'
          editBtn.style.borderRadius = 'var(--ui-radius-sm, 0.146em)'
          editBtn.style.color = 'var(--ui-color-text, oklch(0.96 0.01 260))'
          editBtn.onclick = (e) => {
            e.stopPropagation()
            this.#openSubformDialog(field, index, row as Record<string, unknown>)
          }

          const delBtn = document.createElement('button')
          delBtn.type = 'button'
          delBtn.className = 'btn-action-del'
          delBtn.title = 'Delete Entry'
          delBtn.textContent = '✕'
          delBtn.style.padding = '2px 6px'
          delBtn.style.fontSize = '0.75rem'
          delBtn.style.cursor = 'pointer'
          delBtn.style.background = 'transparent'
          delBtn.style.border = 'none'
          delBtn.style.color = 'var(--ui-color-danger, oklch(0.65 0.22 25))'
          delBtn.onclick = (e) => {
            e.stopPropagation()
            this.#removeTableRow(key, index)
          }

          container.appendChild(editBtn)
          container.appendChild(delBtn)
          return container
        },
      },
    ]

    return html`
      <div class="form-table-wrapper" part="table-container">
        <div class="form-table-header-row">
          <div class="form-table-title-group">
            <span class="form-table-title">${label}</span>
            ${field.description
              ? html`<span class="form-table-desc">${field.description}</span>`
              : nothing}
          </div>
          <div class="form-table-top-actions">
            <ui-button
              size="sm"
              variant="secondary"
              class="btn-table-add"
              @click=${() => this.#openSubformDialog(field)}
            >
              + Add ${label || 'Item'}
            </ui-button>
          </div>
        </div>

        <ui-table
          .columns=${tableColumns}
          .data=${rows}
          ?virtual=${Boolean(field.virtual?.enabled ?? field.virtual ?? props.virtual)}
          ?remote=${Boolean(field.dataSource || props.remote)}
          ?loading=${Boolean(cached?.loading || props.loading)}
          .total=${cached?.total ?? (props.total as number | undefined)}
          bordered
          hoverable
          compact
          empty-text="No items added yet. Click '+ Add' to create an entry."
          @ui-get-page=${(e: CustomEvent) => this.#onFieldGetPage(key, field, e.detail)}
          @ui-row-click=${(e: CustomEvent<{ row: Record<string, unknown>; index: number }>) =>
            this.#openSubformDialog(field, e.detail.index, e.detail.row)}
        ></ui-table>

        ${aggregations.length > 0
          ? html`
              <div class="table-foot-aggregations">
                <div class="aggregations-list">
                  ${aggregations.map((agg) => {
                    const nums = rows.map((r) => Number((r as any)?.[agg.column]) || 0)
                    let valStr = '0'
                    if (agg.op === 'sum') {
                      valStr = String(nums.reduce((a, b) => a + b, 0))
                    } else if (agg.op === 'avg') {
                      valStr = nums.length
                        ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)
                        : '0'
                    } else if (agg.op === 'count') {
                      valStr = String(rows.length)
                    } else if (agg.op === 'min') {
                      valStr = nums.length ? String(Math.min(...nums)) : '0'
                    } else if (agg.op === 'max') {
                      valStr = nums.length ? String(Math.max(...nums)) : '0'
                    }
                    return html`
                      <span class="aggregation-badge">
                        <strong>${agg.label || agg.column}:</strong> ${valStr}
                      </span>
                    `
                  })}
                </div>
              </div>
            `
          : nothing}
      </div>
    `
  }

  #renderTagsWidget(field: StructFormField, value: unknown) {
    const key = field.key
    const tags = Array.isArray(value) ? [...value].map(String) : []
    const props = field.widgetProps || {}

    return html`
      <div class="form-tags-wrapper">
        <div class="tags-container">
          ${tags.map(
            (tag, tagIndex) => html`
              <span class="tag-chip">
                <span class="tag-text">${tag}</span>
                <button
                  type="button"
                  class="tag-del-btn"
                  title="Remove tag"
                  @click=${() => this.#removeTag(key, tagIndex)}
                >
                  ✕
                </button>
              </span>
            `,
          )}
          <input
            type="text"
            class="tag-input"
            placeholder=${(props.placeholder as string) || 'Add tag + Enter...'}
            @keydown=${(e: KeyboardEvent) => this.#onTagInputKeydown(key, e)}
          />
        </div>
      </div>
    `
  }

  #resolveFieldOptions(
    field: StructFormField,
    props: Record<string, unknown>,
  ): Array<{ value: string | number; label: string; description?: string }> {
    const cached = this.#dataSourceCache.get(field.key)
    if (cached?.items && Array.isArray(cached.items) && cached.items.length > 0) {
      return cached.items as any[]
    }
    if (Array.isArray(field.options) && field.options.length > 0) {
      return field.options
    }
    if (Array.isArray(props.options) && props.options.length > 0) {
      return props.options as any[]
    }
    const descriptor = (field as any).descriptor
    if (descriptor?.kind === 'enum' && Array.isArray(descriptor.values)) {
      return descriptor.values.map((v: any) => ({
        value: String(v),
        label: descriptor.labels?.[String(v)] || String(v),
      }))
    }
    return []
  }

  #renderSliderWidget(field: StructFormField, valStr: string, props: Record<string, unknown>) {
    const min = typeof props.min === 'number' ? props.min : 0
    const max = typeof props.max === 'number' ? props.max : 100
    const step = typeof props.step === 'number' ? props.step : 1
    const currentValue = valStr || String(min)
    return html`<ui-slider
      data-key=${field.key}
      label=${field.label || field.key}
      min=${min}
      max=${max}
      step=${step}
      value=${currentValue}
      ?disabled=${Boolean(props.disabled)}
    ></ui-slider>`
  }

  #renderNumberWidget(field: StructFormField, valStr: string, props: Record<string, unknown>) {
    const currentValue = valStr !== '' ? valStr : nothing
    return html`<ui-number-input
      data-key=${field.key}
      label=${field.label || field.key}
      min=${this.#attrIfDefined(props.min)}
      max=${this.#attrIfDefined(props.max)}
      step=${this.#attrIfDefined(props.step)}
      value=${currentValue}
      ?invalid=${Boolean(this.#errors[field.key])}
      ?disabled=${Boolean(props.disabled)}
      ?required=${Boolean(field.required)}
    ></ui-number-input>`
  }

  #renderSwitchWidget(field: StructFormField, value: unknown, props: Record<string, unknown>) {
    return html`<ui-switch
      data-key=${field.key}
      ?checked=${Boolean(value)}
      ?disabled=${Boolean(props.disabled)}
    >${field.label || field.key}</ui-switch>`
  }

  #renderComboboxWidget(field: StructFormField, value: unknown, props: Record<string, unknown>) {
    const key = field.key
    const cached = this.#dataSourceCache.get(key)
    const options = this.#resolveFieldOptions(field, props)
    const isVirtual = Boolean(field.virtual?.enabled ?? field.virtual ?? props.virtual)
    const virtualConfig = field.virtual ?? props.virtual ?? isVirtual
    const isRemote = Boolean(field.dataSource || props.remote)
    const isLoading = Boolean(cached?.loading || props.loading)
    const totalCount = cached?.total ?? (props.total as number | undefined)

    return html`<ui-combobox
      data-key=${key}
      label=${field.label || key}
      .value=${value ?? ''}
      .options=${options}
      .placeholder=${field.placeholder || (props.placeholder as string) || 'Select or search...'}
      .virtual=${virtualConfig}
      ?remote=${isRemote}
      ?loading=${isLoading}
      .total=${totalCount}
      .page=${cached?.page || 1}
      ?disabled=${Boolean(props.disabled)}
      ?required=${Boolean(field.required)}
      ?multiple=${Boolean(props.multiple)}
      ?creatable=${Boolean(props.creatable || (field as any).descriptor?.metadata?.creatable)}
      @ui-change=${(e: CustomEvent) => this.setFieldValue(key, e.detail.value)}
      @ui-get-page=${(e: CustomEvent) => this.#onFieldGetPage(key, field, e.detail)}
    ></ui-combobox>`
  }

  #renderSelectWidget(field: StructFormField, valStr: string, props: Record<string, unknown>) {
    const key = field.key
    const cached = this.#dataSourceCache.get(key)
    const options = this.#resolveFieldOptions(field, props)

    return html`<ui-select
      data-key=${key}
      label=${field.label || key}
      value=${valStr}
      .options=${options}
      ?invalid=${Boolean(this.#errors[key])}
      ?disabled=${Boolean(props.disabled || cached?.loading)}
      ?loading=${Boolean(cached?.loading || props.loading)}
      ?required=${Boolean(field.required)}
    >
      ${options.map(
        (option) => html`<option value=${String(option.value)}>${option.label ?? option.value}</option>`,
      )}
    </ui-select>`
  }

  #renderListWidget(field: StructFormField, value: unknown, props: Record<string, unknown>) {
    const key = field.key
    const cached = this.#dataSourceCache.get(key)
    const items =
      cached?.items && cached.items.length > 0
        ? cached.items
        : Array.isArray(value)
          ? value
          : []
    const isVirtual = Boolean(field.virtual?.enabled ?? field.virtual ?? props.virtual)
    const isRemote = Boolean(field.dataSource || props.remote)
    const isLoading = Boolean(cached?.loading || props.loading)

    return html`<ui-list
      data-key=${key}
      .data=${items}
      ?virtual=${isVirtual}
      ?remote=${isRemote}
      ?loading=${isLoading}
      .total=${cached?.total}
      @ui-get-page=${(e: CustomEvent) => this.#onFieldGetPage(key, field, e.detail)}
    ></ui-list>`
  }

  #renderTextareaWidget(field: StructFormField, valStr: string, props: Record<string, unknown>) {
    return html`<textarea
      class="form-textarea"
      data-key=${field.key}
      rows=${(props.rows as number) || 3}
      placeholder=${field.placeholder || ''}
      ?disabled=${Boolean(props.disabled)}
      ?required=${Boolean(field.required)}
      .value=${valStr}
      @input=${(e: Event) => this.setFieldValue(field.key, (e.target as HTMLTextAreaElement).value)}
    ></textarea>`
  }

  #renderInputWidget(field: StructFormField, valStr: string, props: Record<string, unknown>) {
    return html`<ui-input
      data-key=${field.key}
      label=${field.label || field.key}
      value=${valStr}
      placeholder=${field.placeholder ?? ''}
      type=${field.type ?? 'text'}
      ?invalid=${Boolean(this.#errors[field.key])}
      ?disabled=${Boolean(props.disabled)}
      ?required=${Boolean(field.required)}
    ></ui-input>`
  }

  #renderWidget(field: StructFormField, value: unknown) {
    const widget = field.collectionView?.mode === 'combobox' ? 'combobox' : (field.widget || 'text')
    const props = field.widgetProps || {}
    const valStr =
      typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : ''

    switch (widget) {
      case 'slider':
      case 'range':
        return this.#renderSliderWidget(field, valStr, props)
      case 'number':
      case 'stepper':
        return this.#renderNumberWidget(field, valStr, props)
      case 'switch':
        return this.#renderSwitchWidget(field, value, props)
      case 'combobox':
        return this.#renderComboboxWidget(field, value, props)
      case 'select':
        return this.#renderSelectWidget(field, valStr, props)
      case 'list':
        return this.#renderListWidget(field, value, props)
      case 'tags':
        return this.#renderTagsWidget(field, value)
      case 'textarea':
        return this.#renderTextareaWidget(field, valStr, props)
      default:
        return this.#renderInputWidget(field, valStr, props)
    }
  }

  #renderField(field: StructFormField) {
    if (field.widget === 'table') {
      return this.#renderTableWidget(field, this.#values[field.key])
    }

    const cached = this.#dataSourceCache.get(field.key)
    const isLoading = Boolean(cached?.loading || (field as any).loading)
    const label = field.label || field.key
    const desc = field.description
    const errorMsg = this.#errors[field.key] || (field.path ? this.#errors[field.path] : undefined)

    return html`<ui-field
      label=${label}
      hint=${desc ?? nothing}
      helper=${desc ?? nothing}
      error=${errorMsg ?? nothing}
      ?required=${Boolean(field.required)}
      ?loading=${isLoading}
      part="field"
    >
      ${this.#renderWidget(field, this.#values[field.key])}
    </ui-field>`
  }

  #renderLayoutNode(node: any): unknown {
    const layoutKind = node.layoutKind
    const options = node.options || {}
    const children = Array.isArray(node.children) ? node.children : []

    switch (layoutKind) {
      case 'row':
        return html`
          <div
            class="form-row"
            style=${options.gap ? `gap: ${options.gap};` : ''}
          >
            ${children.map((child: any) => this.#renderNode(child))}
          </div>
        `
      case 'grid': {
        const cols = options.columns || 2
        return html`
          <div
            class="form-grid"
            style="grid-template-columns: repeat(${cols}, minmax(0, 1fr)); ${options.gap ? `gap: ${options.gap};` : ''}"
          >
            ${children.map((child: any) => this.#renderNode(child))}
          </div>
        `
      }
      case 'section':
        return html`
          <div class="form-section">
            ${options.title ? html`<h4 class="form-section-title">${options.title}</h4>` : nothing}
            ${options.description ? html`<p class="form-section-desc">${options.description}</p>` : nothing}
            <div class="form-section-body">
              ${children.map((child: any) => this.#renderNode(child))}
            </div>
          </div>
        `
      case 'steps':
      case 'wizard': {
        const containerKey = node.path || node.key
        const stepIndex = this.#activeStepIndices[containerKey] || 0
        const stepsList = children
        const currentStep = stepsList[stepIndex] || stepsList[0]
        const isFirst = stepIndex === 0
        const isLast = stepIndex === stepsList.length - 1

        return html`
          <div class="form-steps-container" part="steps">
            <ui-stepper
              .activeStep=${stepIndex}
              @ui-change=${(e: CustomEvent) => this.#setStep(containerKey, e.detail.activeStep)}
            >
              ${stepsList.map((stepNode: any, idx: number) => {
                const stepTitle =
                  stepNode.options?.title || stepNode.label || stepNode.key || `Step ${idx + 1}`
                const stepDesc = stepNode.options?.description || ''
                return html`
                  <ui-step
                    .step=${idx + 1}
                    .label=${stepTitle}
                    .description=${stepDesc}
                    ?active=${idx === stepIndex}
                    ?completed=${idx < stepIndex}
                    @click=${() => this.#setStep(containerKey, idx)}
                  ></ui-step>
                `
              })}
            </ui-stepper>

            <div class="form-step-content" part="step-content">
              ${this.#stepErrors[containerKey]?.length
                ? html`
                    <ui-alert variant="danger" title="Validation Required" class="step-alert">
                      Please correct the issue(s) before proceeding:
                      <ul class="step-error-list">
                        ${this.#stepErrors[containerKey].map((err) => html`<li>${err}</li>`)}
                      </ul>
                    </ui-alert>
                  `
                : nothing}
              ${currentStep ? this.#renderNode(currentStep) : nothing}
            </div>

            <div class="form-step-actions">
              <ui-button
                variant="secondary"
                size="md"
                class="btn-step-back"
                ?disabled=${isFirst}
                @click=${() => this.#prevStep(containerKey)}
              >
                ← Back
              </ui-button>

              ${isLast
                ? html`
                    <ui-button
                      type="submit"
                      variant="primary"
                      size="md"
                      class="btn-submit"
                      @click=${this.#onSubmit}
                    >
                      ${this.submitLabel || 'Submit'}
                    </ui-button>
                  `
                : html`
                    <ui-button
                      variant="primary"
                      size="md"
                      class="btn-step-next"
                      @click=${() => this.#nextStep(containerKey, stepsList.length)}
                    >
                      Next Step →
                    </ui-button>
                  `}
            </div>
          </div>
        `
      }
      case 'tabs': {
        const containerKey = node.path || node.key
        const tabKey = this.#activeTabs[containerKey] || children[0]?.key || ''
        const activeChild = children.find((c: any) => c.key === tabKey) || children[0]

        return html`
          <div class="form-tabs-container">
            <ui-tabs
              .value=${activeChild?.key || ''}
              @ui-change=${(e: CustomEvent) => this.#setTab(containerKey, e.detail.value)}
            >
              ${children.map((tabNode: any) => {
                const title = tabNode.options?.title || tabNode.label || tabNode.key
                const isActive = tabNode.key === (activeChild?.key)
                return html`
                  <ui-tab
                    .value=${tabNode.key}
                    ?active=${isActive}
                    @click=${() => this.#setTab(containerKey, tabNode.key)}
                  >
                    ${title}
                  </ui-tab>
                `
              })}
            </ui-tabs>
            <div class="form-tab-body">
              ${activeChild ? this.#renderNode(activeChild) : nothing}
            </div>
          </div>
        `
      }
      default:
        return html`
          <div class="form-layout-container layout-${layoutKind}">
            ${children.map((child: any) => this.#renderNode(child))}
          </div>
        `
    }
  }

  #renderUIOnlyNode(node: any): unknown {
    const uiKind = node.uiKind
    const desc = node.descriptor || {}

    switch (uiKind) {
      case 'alert': {
        const tone = desc.tone === 'error' ? 'danger' : desc.tone || 'info'
        return html`
          <ui-alert variant=${tone} title=${desc.title || nothing} class="form-alert">
            ${desc.content || ''}
          </ui-alert>
        `
      }
      case 'heading': {
        const level = typeof desc.level === 'number' ? desc.level : 3
        const title = desc.title || desc.content || ''
        if (level === 1) return html`<h1 class="form-heading">${title}</h1>`
        if (level === 2) return html`<h2 class="form-heading">${title}</h2>`
        if (level === 4) return html`<h4 class="form-heading">${title}</h4>`
        return html`<h3 class="form-heading">${title}</h3>`
      }
      case 'text':
        return html`<p class="form-text">${desc.content || desc.title || ''}</p>`
      case 'divider':
        return html`<hr class="form-divider" />`
      case 'spacer': {
        const sz = typeof desc.size === 'number' ? `${desc.size}px` : desc.size || '1em'
        return html`<div class="form-spacer" style="height: ${sz};"></div>`
      }
      case 'button':
        return html`
          <div class="form-button-container">
            <ui-button
              variant=${desc.variant || 'secondary'}
              @click=${() => this.#handleButtonAction(desc.action)}
            >
              ${desc.title || desc.content || 'Action'}
            </ui-button>
          </div>
        `
      case 'computedDisplay':
        return html`
          <div class="form-computed-box">
            <span class="computed-label">${desc.title || node.key || 'Computed'}:</span>
            <span class="computed-val">${node.computedValue !== undefined ? String(node.computedValue) : '—'}</span>
          </div>
        `
      default:
        return nothing
    }
  }

  #renderNode(node: any): unknown {
    if (!node || typeof node !== 'object') return nothing

    if (node.kind === 'layout') {
      return this.#renderLayoutNode(node)
    }

    if (node.kind === 'ui_only') {
      return this.#renderUIOnlyNode(node)
    }

    if (node.kind === 'field') {
      return this.#renderField(node)
    }

    return nothing
  }

  protected override render(): unknown {
    const layout = this.layout || 'stacked'
    const tree = this.#formTree
    const hasSteps = tree
      ? tree.nodes.some(
          (n: any) =>
            n.kind === 'layout' && (n.layoutKind === 'steps' || n.layoutKind === 'wizard'),
        )
      : false

    return html`
      <form
        class="struct-form-root ${this.bordered ? 'bordered' : ''} ${this.dense ? 'dense' : ''} ${this.isFetching ? 'fetching' : ''}"
        part="form"
        aria-label=${this.ariaLabel || nothing}
        ?aria-busy=${this.isFetching}
        @submit=${this.#onSubmit}
        @ui-input=${this.#onWidgetEvent}
        @ui-change=${this.#onWidgetEvent}
      >
        ${this.isFetching
          ? html`<div class="form-loader-bar" part="loader-bar" role="progressbar" aria-label="Loading form data">
              <div class="form-loader-bar-indicator"></div>
            </div>`
          : nothing}
        <slot name="header"></slot>
        <div class="form-fields-container layout-${layout}" part="fields">
          ${tree
            ? tree.nodes.map((node: any) => this.#renderNode(node))
            : this.#fields.map((field) => this.#renderField(field))}
        </div>
        ${!hasSteps && this.submitLabel
          ? html`
              <div class="form-actions" part="actions">
                <slot name="actions">
                  <ui-button
                    type="submit"
                    variant="primary"
                    size="md"
                    class="btn-submit"
                    @click=${this.#onSubmit}
                    >${this.submitLabel}</ui-button
                  >
                </slot>
              </div>
            `
          : nothing}
      </form>

      <!-- Subform modal for table additions and edits -->
      <ui-dialog
        .open=${this.#subformDialogOpen}
        ?open=${this.#subformDialogOpen}
        title=${this.#subformDialogRowIndex >= 0
          ? `Edit ${this.#subformDialogField?.label || 'Item'}`
          : `Add ${this.#subformDialogField?.label || 'Item'}`}
        @ui-close=${() => this.#closeSubformDialog()}
      >
        <div class="subform-dialog-body">
          ${this.#subformDialogOpen && this.#subformDialogField
            ? html`
                <ui-struct-form
                  class="subform-instance"
                  .schema=${this.#getSubformSchema(this.#subformDialogField)}
                  .values=${this.#subformDialogValues}
                  submit-label=${this.#subformDialogRowIndex >= 0 ? 'Update Item' : 'Add Item'}
                  @ui-form-submit=${this.#onSubformSubmit}
                  @ui-form-change=${(e: Event) => e.stopPropagation()}
                ></ui-struct-form>
              `
            : nothing}
        </div>
      </ui-dialog>
    `
  }
}

if (!customElements.get(UI_TAG_NAMES.STRUCT_FORM)) {
  customElements.define(UI_TAG_NAMES.STRUCT_FORM, UIStructForm)
}
