import { html, css, nothing, type CSSResultGroup, type PropertyDeclarations } from 'lit'
import { UIElement, bool } from '../base.element.ts'
import { UI_TAG_NAMES } from '../constants.ts'

export type StructFormWidgetType =
  | 'text'
  | 'number'
  | 'stepper'
  | 'slider'
  | 'switch'
  | 'select'
  | 'textarea'
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
}

export interface StructFormChangeEventDetail {
  values: Record<string, unknown>
  fieldKey: string
  fieldValue: unknown
}

export interface StructFormSubmitEventDetail {
  values: Record<string, unknown>
}

export class UIStructForm extends UIElement {
  static override properties: PropertyDeclarations = {
    submitLabel: { type: String, attribute: 'submit-label', reflect: true },
    bordered: bool(),
    dense: bool(),
    layout: { type: String, reflect: true },
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
      display: flex;
      flex-direction: column;
      gap: var(--ui-space-sm, 1em);
      box-sizing: border-box;
      background: var(--ui-card-bg, var(--ui-color-surface-elevated, oklch(0.22 0.025 260)));
      color: var(--ui-card-color, var(--ui-color-text, oklch(0.96 0.01 260)));
      border: none;
      border-radius: var(--ui-radius-md, 0.236em);
      padding: 0;
    }

    .struct-form-root.bordered {
      border: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.7));
      padding: var(--ui-space-sm, 1em);
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
  layout: 'stacked' | 'grid' = 'stacked'
  ariaLabel = ''

  #fields: StructFormField[] = []
  #values: Record<string, unknown> = {}
  #schema: unknown = null

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
    this.requestUpdate('fields', null)
  }

  get values(): Record<string, unknown> {
    return { ...this.#values }
  }

  set values(v: Record<string, unknown>) {
    this.#values = typeof v === 'object' && v !== null ? { ...v } : {}
    this.requestUpdate('values', null)
  }

  get schema(): unknown {
    return this.#schema
  }

  set schema(s: unknown) {
    this.#schema = s
    if (s && typeof s === 'object') {
      const maybeSchema = s as {
        descriptor?: { kind?: string; fields?: Record<string, Record<string, unknown>> }
      }
      if (maybeSchema.descriptor?.fields) {
        const inferred: StructFormField[] = Object.entries(maybeSchema.descriptor.fields).map(
          ([key, fieldDesc]) => {
            const meta = (fieldDesc?.metadata as Record<string, unknown> | undefined) || {}
            let widget: StructFormWidgetType = typeof meta.widget === 'string' ? meta.widget : 'text'
            const kind = fieldDesc.kind
            const min = typeof fieldDesc.min === 'number' ? fieldDesc.min : undefined
            const max = typeof fieldDesc.max === 'number' ? fieldDesc.max : undefined
            const step = typeof fieldDesc.step === 'number' ? fieldDesc.step : undefined

            if (!meta.widget) {
              if (kind === 'number' || kind === 'integer') {
                if (min !== undefined && max !== undefined) widget = 'slider'
                else widget = 'number'
              } else if (kind === 'boolean') {
                widget = 'switch'
              } else if (kind === 'enum') {
                widget = 'select'
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
            }
          },
        )
        this.fields = inferred
      }
    }
    this.requestUpdate('schema', null)
  }

  public getFieldValue(key: string): unknown {
    return this.#values[key]
  }

  public setFieldValue(key: string, value: unknown): void {
    this.#values[key] = value
    const detail: StructFormChangeEventDetail = {
      values: this.values,
      fieldKey: key,
      fieldValue: value,
    }
    this.emit('ui-form-change', detail)
  }

  public submit(): void {
    const detail: StructFormSubmitEventDetail = {
      values: this.values,
    }
    this.emit('ui-form-submit', detail)
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

  #renderWidget(field: StructFormField, value: unknown) {
    const key = field.key
    const label = field.label || key
    const widget = field.widget || 'text'
    const props = field.widgetProps || {}
    const valStr =
      typeof value === 'string'
        ? value
        : typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : ''

    switch (widget) {
      case 'slider': {
        const minNum = typeof props.min === 'number' ? props.min : 0
        const maxNum = typeof props.max === 'number' ? props.max : 100
        const stepNum = typeof props.step === 'number' ? props.step : 1
        const curVal = valStr || String(minNum)
        return html`<ui-slider
          data-key=${key}
          label=${label}
          min=${minNum}
          max=${maxNum}
          step=${stepNum}
          value=${curVal}
          ?disabled=${Boolean(props.disabled)}
        ></ui-slider>`
      }
      case 'number':
      case 'stepper': {
        const curVal = valStr || '0'
        return html`<ui-number-input
          data-key=${key}
          label=${label}
          min=${this.#attrIfDefined(props.min)}
          max=${this.#attrIfDefined(props.max)}
          step=${this.#attrIfDefined(props.step)}
          value=${curVal}
          ?disabled=${Boolean(props.disabled)}
          ?required=${Boolean(field.required)}
        ></ui-number-input>`
      }
      case 'switch':
        return html`<ui-switch
          data-key=${key}
          ?checked=${Boolean(value)}
          ?disabled=${Boolean(props.disabled)}
        >${label}</ui-switch>`
      case 'select':
        return html`<ui-select
          data-key=${key}
          label=${label}
          value=${valStr}
          ?disabled=${Boolean(props.disabled)}
          ?required=${Boolean(field.required)}
        >
          ${(field.options ?? []).map(
            (option) => html`<option value=${String(option.value)}>${option.label}</option>`,
          )}
        </ui-select>`
      default:
        return html`<ui-input
          data-key=${key}
          label=${label}
          value=${valStr}
          placeholder=${field.placeholder ?? ''}
          type=${field.type ?? 'text'}
          ?disabled=${Boolean(props.disabled)}
          ?required=${Boolean(field.required)}
        ></ui-input>`
    }
  }

  #renderField(field: StructFormField) {
    const label = field.label || field.key
    const desc = field.description
    return html`<ui-field
      label=${label}
      hint=${desc ?? nothing}
      helper=${desc ?? nothing}
      ?required=${Boolean(field.required)}
      part="field"
    >
      ${this.#renderWidget(field, this.#values[field.key])}
    </ui-field>`
  }

  protected override render(): unknown {
    const layout = this.layout || 'stacked'
    return html`
      <form
        class="struct-form-root ${this.bordered ? 'bordered' : ''} ${this.dense ? 'dense' : ''}"
        part="form"
        aria-label=${this.ariaLabel || nothing}
        @submit=${this.#onSubmit}
        @ui-input=${this.#onWidgetEvent}
        @ui-change=${this.#onWidgetEvent}
      >
        <slot name="header"></slot>
        <div class="form-fields-container layout-${layout}" part="fields">
          ${this.#fields.map((field) => this.#renderField(field))}
        </div>
        <div class="form-actions" part="actions">
          <slot name="actions">
            ${this.submitLabel
              ? html`<ui-button
                  type="submit"
                  variant="primary"
                  size="md"
                  class="btn-submit"
                  @click=${this.#onSubmit}
                  >${this.submitLabel}</ui-button
                >`
              : nothing}
          </slot>
        </div>
      </form>
    `
  }
}

if (!customElements.get(UI_TAG_NAMES.STRUCT_FORM)) {
  customElements.define(UI_TAG_NAMES.STRUCT_FORM, UIStructForm)
}

