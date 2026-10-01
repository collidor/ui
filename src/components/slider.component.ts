import { html, css, nothing } from 'lit'
import { live } from 'lit/directives/live.js'
import { styleMap } from 'lit/directives/style-map.js'
import { UIElement, bool } from '../base.element.ts'
import { UI_TAG_NAMES } from '../constants.ts'

export class UISlider extends UIElement {
  static properties = {
    value: { type: Number, reflect: true },
    min: { type: Number, reflect: true },
    max: { type: Number, reflect: true },
    step: { type: Number, reflect: true },
    disabled: bool(),
    showValue: bool('show-value'),
    label: { type: String, reflect: true },
    ariaLabel: { type: String, attribute: 'aria-label', reflect: true },
    ariaLabelledby: { type: String, attribute: 'aria-labelledby', reflect: true },
    ariaDescribedby: { type: String, attribute: 'aria-describedby', reflect: true },
  }

  static styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
      width: 100%;
    }

    :host([hidden]) {
      display: none !important;
    }

    .slider-container {
      display: flex;
      align-items: center;
      gap: var(--ui-space-3xs, 0.236em);
      width: 100%;
    }

    .slider-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      flex: 1;
      height: var(--ui-space-md, 1.618em);
    }

    input[type="range"] {
      --track-percent: 0%;
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: var(--ui-space-3xs, 0.236em);
      background: linear-gradient(
        to right,
        var(--ui-color-primary, oklch(0.65 0.19 230)) var(--track-percent),
        var(--ui-color-border, oklch(0.22 0.025 260)) var(--track-percent)
      );
      border-radius: var(--ui-radius-full, 9999px);
      outline: none;
      margin: 0;
      cursor: pointer;
      transition: background var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: var(--ui-space-xs, 0.618em);
      height: var(--ui-space-xs, 0.618em);
      border-radius: 50%;
      background: var(--ui-color-text, #ffffff);
      border: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
      box-shadow: 0 0 var(--ui-space-3xs, 0.236em) rgba(0, 0, 0, 0.4);
      cursor: pointer;
      transition:
        transform var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
        border-color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
    }

    input[type="range"]::-moz-range-thumb {
      width: var(--ui-space-xs, 0.618em);
      height: var(--ui-space-xs, 0.618em);
      border-radius: 50%;
      background: var(--ui-color-text, #ffffff);
      border: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
      box-shadow: 0 0 var(--ui-space-3xs, 0.236em) rgba(0, 0, 0, 0.4);
      cursor: pointer;
    }

    input[type="range"]:hover:not(:disabled)::-webkit-slider-thumb {
      transform: scale(1.15);
      border-color: var(--ui-color-primary-hover, oklch(0.73 0.19 230));
    }

    input[type="range"]:focus-visible {
      box-shadow:
        0 0 0 2px var(--ui-color-surface, oklch(0.14 0.02 260)),
        0 0 0 4px var(--ui-color-focus-ring, oklch(0.65 0.19 230 / 0.5));
      border-radius: var(--ui-radius-full, 9999px);
    }

    .value-display {
      font-size: 0.75rem;
      font-family: var(--ui-font-mono, monospace);
      color: var(--ui-color-text, oklch(0.7 0.02 260));
      min-width: var(--ui-space-lg, 2.618em);
      text-align: right;
    }

    .disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .disabled input {
      cursor: not-allowed;
      pointer-events: none;
    }
  `

  value = 0
  min = 0
  max = 100
  step = 1
  disabled = false
  showValue = false
  label = ''
  ariaLabel = ''
  ariaLabelledby = ''
  ariaDescribedby = ''

  override focus(options?: FocusOptions): void {
    this.renderRoot.querySelector<HTMLInputElement>('input[type="range"]')?.focus(options)
  }

  #trackPercent(): string {
    const span = this.max - this.min || 1
    const percent = ((this.value - this.min) / span) * 100
    return `${Math.min(100, Math.max(0, percent))}%`
  }

  #readValue(event: Event): number | null {
    const input = event.currentTarget
    if (!(input instanceof HTMLInputElement)) return null
    return parseFloat(input.value) || 0
  }

  #onInput = (event: Event): void => {
    event.stopPropagation()
    const val = this.#readValue(event)
    if (val === null) return
    this.value = val
    this.emit('ui-input', { value: this.value })
  }

  #onChange = (event: Event): void => {
    event.stopPropagation()
    const val = this.#readValue(event)
    if (val === null) return
    this.value = val
    this.emit('ui-change', { value: this.value })
  }

  protected override render() {
    const effectiveLabel = this.ariaLabel || this.label || nothing

    return html`
      <div class="slider-container ${this.disabled ? 'disabled' : ''}" part="container">
        <slot name="prefix" part="prefix"></slot>
        <div class="slider-wrapper" part="track-wrapper">
          <input
            type="range"
            min=${this.min}
            max=${this.max}
            step=${this.step}
            .value=${live(String(this.value))}
            ?disabled=${this.disabled}
            aria-label=${effectiveLabel}
            aria-labelledby=${this.ariaLabelledby || nothing}
            aria-describedby=${this.ariaDescribedby || nothing}
            aria-valuenow=${this.value}
            aria-valuemin=${this.min}
            aria-valuemax=${this.max}
            part="range"
            style=${styleMap({ '--track-percent': this.#trackPercent() })}
            @input=${this.#onInput}
            @change=${this.#onChange}
          />
        </div>
        ${this.showValue
          ? html`<span class="value-display" part="value">${this.value}</span>`
          : nothing}
        <slot name="suffix" part="suffix"></slot>
      </div>
    `
  }
}

if (!customElements.get(UI_TAG_NAMES.SLIDER)) {
  customElements.define(UI_TAG_NAMES.SLIDER, UISlider)
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-slider': UISlider
  }
}
