import { html, css, nothing, type CSSResultGroup, type PropertyDeclarations } from 'lit'
import { UIElement, bool } from '../base.element.ts'
import { UI_TAG_NAMES } from '../constants.ts'

export class UIField extends UIElement {
  static override properties: PropertyDeclarations = {
    label: { type: String, reflect: true },
    helper: { type: String, reflect: true },
    error: { type: String, reflect: true },
    required: bool(),
    loading: bool(),
    orientation: { type: String, reflect: true },
  }

  static override styles: CSSResultGroup = css`
    :host {
      display: block;
      margin-block-end: var(--ui-space-xs, 0.618em);
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
    }

    :host([hidden]) {
      display: none !important;
    }

    .field-container {
      display: flex;
      width: 100%;
    }

    .field-container.orientation-vertical {
      flex-direction: column;
      gap: var(--ui-space-3xs, 0.236em);
    }

    .field-container.orientation-horizontal {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: var(--ui-space-xs, 0.618em);
    }

    .label-wrapper {
      display: inline-flex;
      align-items: center;
      gap: var(--ui-space-4xs, 0.146em);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--ui-color-text-muted, oklch(0.70 0.02 260));
      letter-spacing: 0.02em;
      text-transform: uppercase;
      cursor: pointer;
      user-select: none;
    }

    .required-star {
      color: var(--ui-color-danger, oklch(0.65 0.22 25));
    }

    .control-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .message {
      font-size: 0.75rem;
      margin-block-start: var(--ui-space-4xs, 0.146em);
      line-height: var(--ui-line-height-tight, 1.236);
    }

    .helper-text {
      color: var(--ui-color-text-subtle, oklch(0.55 0.02 260));
    }

    .error-text {
      color: var(--ui-color-danger, oklch(0.65 0.22 25));
      font-weight: 500;
    }

    .field-spinner {
      display: inline-block;
      width: 11px;
      height: 11px;
      border: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
      border-right-color: transparent;
      border-radius: 50%;
      animation: field-spin 600ms linear infinite;
      vertical-align: middle;
      box-sizing: border-box;
      flex-shrink: 0;
      margin-left: var(--ui-space-4xs, 0.146em);
    }

    @keyframes field-spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .field-spinner {
        animation-duration: 1.5s;
      }
    }
  `

  label = ''
  helper = ''
  error = ''
  required = false
  loading = false
  orientation: 'vertical' | 'horizontal' = 'vertical'

  #findControl(): HTMLElement | null {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])')
    const assigned = slot?.assignedElements({ flatten: true }) ?? []
    for (const el of assigned) {
      if (el instanceof HTMLElement) {
        if (el.matches('input, select, textarea, button, ui-input, ui-select, ui-number-input, ui-slider, ui-switch')) {
          return el
        }
        const inner = el.querySelector<HTMLElement>('input, select, textarea, button, ui-input, ui-select, ui-number-input, ui-slider, ui-switch')
        if (inner) return inner
      }
    }
    return null
  }

  #syncControl(): void {
    const control = this.#findControl()
    if (!control) return

    if (this.label && !control.getAttribute('aria-label') && !control.getAttribute('label')) {
      control.setAttribute('aria-label', this.label)
    }

    if (this.required) {
      control.setAttribute('aria-required', 'true')
      if ('required' in control) {
        try {
          (control as unknown as { required: boolean }).required = true
        } catch {}
      }
    } else if (control.getAttribute('aria-required') === 'true') {
      control.removeAttribute('aria-required')
    }

    if (this.error) {
      control.setAttribute('aria-invalid', 'true')
      if ('invalid' in control) {
        try {
          (control as unknown as { invalid: boolean }).invalid = true
        } catch {}
      }
    } else {
      control.removeAttribute('aria-invalid')
      if ('invalid' in control) {
        try {
          (control as unknown as { invalid: boolean }).invalid = false
        } catch {}
      }
    }
  }

  #onLabelClick = (): void => {
    const control = this.#findControl()
    if (control) {
      control.focus()
    }
  }

  protected override updated(): void {
    this.#syncControl()
  }

  protected override render(): unknown {
    return html`
      <div class="field-container orientation-${this.orientation} ${this.loading ? 'loading' : ''}" part="container" ?aria-busy=${this.loading}>
        ${this.label
          ? html`<label class="label-wrapper" part="label" @click=${this.#onLabelClick}>
              <slot name="label">${this.label}</slot>
              ${this.required ? html`<span class="required-star" aria-hidden="true" part="required">*</span>` : nothing}
              ${this.loading ? html`<span class="field-spinner" part="spinner" role="status" aria-label="Loading ${this.label || 'field'}"></span>` : nothing}
            </label>`
          : this.loading
            ? html`<span class="field-spinner" part="spinner" role="status" aria-label="Loading"></span>`
            : nothing}
        <div class="control-wrapper" part="control">
          <slot @slotchange=${this.#syncControl}></slot>
          ${this.error
            ? html`<div class="message error-text" role="alert" aria-live="polite" part="error">${this.error}</div>`
            : this.helper
              ? html`<div class="message helper-text" part="helper">${this.helper}</div>`
              : nothing}
        </div>
      </div>
    `
  }
}

if (!customElements.get(UI_TAG_NAMES.FIELD)) {
  customElements.define(UI_TAG_NAMES.FIELD, UIField)
}

