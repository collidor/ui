import { html, css, nothing, type CSSResultGroup, type PropertyDeclarations } from 'lit'
import { live } from 'lit/directives/live.js'
import { UIElement, bool } from '../base.element.ts'
import { UI_TAG_NAMES, type Size } from '../constants.ts'

export class UIInput extends UIElement {
  static override properties: PropertyDeclarations = {
    value: { type: String, reflect: true },
    type: { type: String, reflect: true },
    placeholder: { type: String, reflect: true },
    disabled: bool(),
    readonly: bool(),
    size: { type: String, reflect: true },
    clearable: bool(),
    label: { type: String, reflect: true },
    ariaLabel: { type: String, attribute: 'aria-label', reflect: true },
    ariaLabelledby: { type: String, attribute: 'aria-labelledby', reflect: true },
    ariaDescribedby: { type: String, attribute: 'aria-describedby', reflect: true },
    required: bool(),
    invalid: bool('invalid'),
  }

  static override styles: CSSResultGroup = css`
    :host {
      display: inline-block;
      vertical-align: middle;
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
      width: 100%;
    }

    :host([hidden]) {
      display: none !important;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      box-sizing: border-box;
      width: 100%;
      background: var(
        --ui-input-bg,
        var(--ui-card-bg, var(--ui-color-surface-elevated, oklch(0.14 0.02 260)))
      );
      border: var(--ui-input-border, 1px solid var(--ui-color-border, oklch(0.32 0.03 260)));
      box-shadow: var(--ui-input-shadow, none);
      transition:
        border-color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
        box-shadow var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
        background var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
    }

    .input-wrapper:hover:not(.disabled) {
      border-color: var(--ui-color-border-hover, oklch(0.44 0.03 260));
    }

    .input-wrapper:focus-within:not(.disabled) {
      border-color: var(--ui-color-primary, oklch(0.65 0.19 230));
      box-shadow:
        0 0 0 1px var(--ui-color-primary, oklch(0.65 0.19 230)),
        0 0 0 4px var(--ui-color-focus-ring, oklch(0.65 0.19 230 / 0.5));
    }

    .input-wrapper.invalid {
      border-color: var(--ui-color-danger, oklch(0.65 0.22 25));
    }

    .input-wrapper.invalid:focus-within:not(.disabled) {
      border-color: var(--ui-color-danger, oklch(0.65 0.22 25));
      box-shadow:
        0 0 0 1px var(--ui-color-danger, oklch(0.65 0.22 25)),
        0 0 0 4px var(--ui-color-danger-subtle, oklch(0.65 0.22 25 / 0.3));
    }

    /* --- Golden Ratio Strict Relative Sizing & Padding --- */
    .input-wrapper.size-sm {
      font-size: 0.75rem;
      padding: var(--ui-space-4xs, 0.146em) var(--ui-space-2xs, 0.382em);
      gap: var(--ui-space-4xs, 0.146em);
      border-radius: var(--ui-input-radius, var(--ui-radius-sm, 0.146em));
    }

    .input-wrapper.size-md {
      font-size: 0.875rem;
      padding: var(--ui-space-3xs, 0.236em) var(--ui-space-xs, 0.618em);
      gap: var(--ui-space-3xs, 0.236em);
      border-radius: var(--ui-input-radius, var(--ui-radius-md, 0.236em));
    }

    .input-wrapper.size-lg {
      font-size: 1rem;
      padding: var(--ui-space-2xs, 0.382em) var(--ui-space-sm, 1.000em);
      gap: var(--ui-space-2xs, 0.382em);
      border-radius: var(--ui-input-radius, var(--ui-radius-lg, 0.382em));
    }

    input {
      flex: 1;
      width: 100%;
      min-width: 0;
      background: transparent;
      border: none;
      outline: none;
      color: var(--ui-input-color, var(--ui-color-text, oklch(0.96 0.01 260)));
      font-family: inherit;
      font-size: inherit;
      line-height: var(--ui-line-height-normal, 1.618);
      padding: 0;
      margin: 0;
    }

    input::placeholder {
      color: var(--ui-input-placeholder-color, var(--ui-color-text-subtle, oklch(0.55 0.02 260)));
    }

    .disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .disabled input {
      cursor: not-allowed;
    }

    .clear-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: var(--ui-color-text-muted, oklch(0.70 0.02 260));
      cursor: pointer;
      padding: 0;
      margin: 0;
      font-size: inherit;
      line-height: 1;
      opacity: 0.7;
      transition: opacity var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
    }

    .clear-btn:hover {
      opacity: 1;
      color: var(--ui-color-text, oklch(0.96 0.01 260));
    }
  `

  value = ''
  type = 'text'
  placeholder = ''
  disabled = false
  readonly = false
  size: Size = 'md'
  clearable = false
  label = ''
  ariaLabel = ''
  ariaLabelledby = ''
  ariaDescribedby = ''
  required = false
  invalid = false

  override focus(options?: FocusOptions): void {
    this.renderRoot.querySelector<HTMLInputElement>('input')?.focus(options)
  }

  #onInput = (event: Event): void => {
    event.stopPropagation()
    const input = event.currentTarget
    if (!(input instanceof HTMLInputElement)) return
    this.value = input.value
    this.emit('ui-input', { value: this.value })
  }

  #onChange = (event: Event): void => {
    event.stopPropagation()
    const input = event.currentTarget
    if (!(input instanceof HTMLInputElement)) return
    this.value = input.value
    this.emit('ui-change', { value: this.value })
  }

  #onClear = (event: Event): void => {
    event.preventDefault()
    event.stopPropagation()
    this.value = ''
    this.emit('ui-input', { value: '' })
    this.emit('ui-change', { value: '' })
  }

  protected override render(): unknown {
    const showClear = this.clearable && Boolean(this.value) && !this.disabled && !this.readonly
    const effectiveLabel = this.ariaLabel || this.label || nothing

    return html`
      <div class="input-wrapper size-${this.size} ${this.disabled ? 'disabled' : ''} ${this.invalid ? 'invalid' : ''}" part="wrapper">
        <slot name="prefix" part="prefix"></slot>
        <input
          type=${this.type}
          placeholder=${this.placeholder}
          .value=${live(this.value)}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          aria-label=${effectiveLabel}
          aria-labelledby=${this.ariaLabelledby || nothing}
          aria-describedby=${this.ariaDescribedby || nothing}
          aria-invalid=${this.invalid ? 'true' : nothing}
          aria-required=${this.required ? 'true' : nothing}
          part="input"
          @input=${this.#onInput}
          @change=${this.#onChange}
        />
        ${showClear
          ? html`<button
              class="clear-btn"
              type="button"
              aria-label="Clear"
              part="clear-button"
              @click=${this.#onClear}
            >✕</button>`
          : nothing}
        <slot name="suffix" part="suffix"></slot>
      </div>
    `
  }
}

if (!customElements.get(UI_TAG_NAMES.INPUT)) {
  customElements.define(UI_TAG_NAMES.INPUT, UIInput)
}

