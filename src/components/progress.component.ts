import { html, css, nothing } from 'lit'
import { styleMap } from 'lit/directives/style-map.js'
import { bool } from '../base.element.ts'
import { UIHeaderedElement, headerToggleIcon } from '../headerSurface.ts'
import { UI_TAG_NAMES, type Variant, type Size } from '../constants.ts'

export class UIProgress extends UIHeaderedElement {
  static properties = {
    ...UIHeaderedElement.properties,
    value: { type: Number, reflect: true },
    max: { type: Number, reflect: true },
    min: { type: Number, reflect: true },
    buffer: { type: Number, reflect: true },
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    striped: bool(),
    animated: bool(),
    showValue: bool('show-value'),
    label: { type: String, reflect: true },
    ariaLabel: { type: String, attribute: 'aria-label' },
    ariaLabelledby: { type: String, attribute: 'aria-labelledby' },
    valueText: { type: String, attribute: 'value-text', reflect: true },
  }

  static styles = [UIHeaderedElement.styles, css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--ui-space-4xs, 0.146em);
      box-sizing: border-box;
      width: 100%;
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
    }

    :host([hidden]) {
      display: none !important;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--ui-header-bg, transparent);
      color: var(--ui-header-color, var(--ui-color-text, oklch(0.96 0.01 260)));
      border-bottom: var(--ui-header-border, 0);
    }

    .progress-header:focus-visible {
      outline: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
      outline-offset: 2px;
      border-radius: var(--ui-radius-xs, 0.146em);
    }

    .progress-label {
      letter-spacing: 0.04em;
    }

    .progress-value-text {
      font-family: var(--ui-font-mono, monospace);
      color: var(--ui-header-color-muted, var(--ui-color-text-muted, oklch(0.70 0.02 260)));
    }

    .progress-track {
      position: relative;
      width: 100%;
      height: 0.618rem;
      background: var(--ui-progress-track-bg, var(--ui-color-surface, oklch(0.14 0.02 260)));
      border: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
      border-radius: var(--ui-radius-full, 9999px);
      overflow: hidden;
      box-sizing: border-box;
    }

    :host([size='sm']) .progress-track {
      height: 0.382rem; /* Golden Ratio scale */
    }

    :host([size='lg']) .progress-track {
      height: 1.000rem;
    }

    .progress-buffer {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      background: var(--ui-color-border, oklch(0.38 0.03 260 / 0.7));
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: inherit;
    }

    .progress-fill {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      background-color: var(--ui-progress-color, var(--ui-color-primary, oklch(0.65 0.19 230)));
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: inherit;
      box-shadow: 0 0 8px color-mix(in oklch, var(--ui-progress-color, var(--ui-color-primary)) 40%, transparent);
    }

    .progress-fill.striped {
      background-image: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.15) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0.15) 75%,
        transparent 75%,
        transparent
      );
      background-size: 1rem 1rem;
    }

    .progress-fill.animated {
      animation: progress-stripes 1s linear infinite;
    }

    @keyframes progress-stripes {
      0% { background-position: 1rem 0; }
      100% { background-position: 0 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .progress-fill.animated {
        animation: none;
      }
    }
  `]

  value = 0
  max = 100
  min = 0
  buffer: number | null = null
  variant: Variant = 'primary'
  size: Size = 'md'
  striped = false
  animated = false
  showValue = false
  label = ''
  override ariaLabel: string | null = null
  ariaLabelledby?: string
  valueText?: string

  #labelId = `progress-label-${Math.random().toString(36).slice(2, 8)}`

  protected override updated(): void {
    this.style.setProperty(
      '--ui-progress-color',
      `var(--ui-color-${this.variant}, var(--ui-color-primary, oklch(0.65 0.19 230)))`,
    )
  }

  protected override render() {
    const min = this.min
    const max = Math.max(min + 1, this.max)
    const val = Math.min(max, Math.max(min, this.value))
    const percent = Math.round(((val - min) / (max - min)) * 100)
    const bufferPercent =
      this.buffer != null
        ? Math.round(((Math.min(max, Math.max(min, this.buffer)) - min) / (max - min)) * 100)
        : null

    return html`
      ${this.label || this.showValue || this.collapsible
        ? html`<div
            class="progress-header"
            part="header"
            role=${this.collapsible ? 'button' : nothing}
            tabindex=${this.collapsible ? '0' : nothing}
            aria-expanded=${this.collapsible ? String(!this.collapsed) : nothing}
            @click=${this.onHeaderClick}
            @keydown=${this.onHeaderKeydown}
          >
            <span id=${this.#labelId} class="progress-label" part="label">${this.label}</span>
            ${this.showValue
              ? html`<span class="progress-value-text" part="value">${val}/${max} (${percent}%)</span>`
              : nothing}
            ${headerToggleIcon(this.collapsible)}
          </div>`
        : nothing}
      <div
        class="progress-track"
        role="progressbar"
        aria-valuenow=${val}
        aria-valuemin=${min}
        aria-valuemax=${max}
        aria-valuetext=${this.valueText ?? `${percent}%`}
        aria-labelledby=${this.ariaLabelledby ?? (this.ariaLabel ? nothing : (this.label ? this.#labelId : nothing))}
        aria-label=${this.ariaLabel ?? (this.label || this.ariaLabelledby ? nothing : 'Progress')}
        part="track"
      >
        ${bufferPercent != null
          ? html`<div
              class="progress-buffer"
              part="buffer"
              style=${styleMap({ width: `${bufferPercent}%` })}
            ></div>`
          : nothing}
        <div
          class="progress-fill ${this.striped ? 'striped' : ''} ${this.animated ? 'animated' : ''}"
          part="fill"
          style=${styleMap({ width: `${percent}%` })}
        ></div>
      </div>
    `
  }
}

if (!customElements.get(UI_TAG_NAMES.PROGRESS)) {
  customElements.define(UI_TAG_NAMES.PROGRESS, UIProgress)
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-progress': UIProgress
  }
}
