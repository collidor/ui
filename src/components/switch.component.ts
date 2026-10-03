import { html, css, type CSSResultGroup, type PropertyDeclarations } from 'lit'
import { UIElement, bool } from '../base.element.ts'
import { UI_TAG_NAMES, type Size } from '../constants.ts'

export class UISwitch extends UIElement {
  static override properties: PropertyDeclarations = {
    checked: bool(),
    disabled: bool(),
    size: { type: String, reflect: true },
    label: { type: String, reflect: true },
    ariaLabel: { type: String, attribute: 'aria-label', reflect: true },
    ariaLabelledby: { type: String, attribute: 'aria-labelledby', reflect: true },
    ariaDescribedby: { type: String, attribute: 'aria-describedby', reflect: true },
  }

  static override styles: CSSResultGroup = css`
    :host {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
      cursor: pointer;
      user-select: none;
      outline: none;
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
      gap: var(--ui-space-2xs, 0.382em);
      padding: 2px 0;
      line-height: 1;
    }

    :host([hidden]) {
      display: none !important;
    }

    :host(:focus-visible) .track {
      box-shadow:
        0 0 0 2px var(--ui-color-surface, oklch(0.14 0.02 260)),
        0 0 0 4px var(--ui-color-focus-ring, oklch(0.65 0.19 230 / 0.5));
    }

    .track {
      --switch-height: 1.375rem;
      --switch-width: calc(var(--switch-height) * 1.618);
      --switch-padding: var(--ui-switch-padding, 2px);
      --switch-border: 1px;
      position: relative;
      box-sizing: border-box;
      width: var(--switch-width);
      height: var(--switch-height);
      background-color: var(
        --ui-switch-bg,
        var(--ui-color-surface-elevated, oklch(0.22 0.025 260))
      );
      border: var(--switch-border) solid
        var(--ui-switch-border, var(--ui-color-border, oklch(0.32 0.03 260)));
      border-radius: var(--ui-switch-radius, var(--ui-radius-full, 9999px));
      transition:
        background-color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
        border-color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
      flex-shrink: 0;
    }

    /* --- Golden Ratio Track Dimensions (Width ≈ 1.618 x Height) --- */
    :host([size='sm']) .track,
    .track.size-sm {
      --switch-height: 1.125rem;
      --switch-width: calc(var(--switch-height) * 1.618);
      --switch-padding: var(--ui-switch-padding-sm, 2px);
    }

    :host([size='md']) .track,
    .track.size-md {
      --switch-height: 1.375rem;
      --switch-width: calc(var(--switch-height) * 1.618);
      --switch-padding: var(--ui-switch-padding-md, 2px);
    }

    :host([size='lg']) .track,
    .track.size-lg {
      --switch-height: 1.75rem;
      --switch-width: calc(var(--switch-height) * 1.618);
      --switch-padding: var(--ui-switch-padding-lg, 2.5px);
    }

    .thumb {
      position: absolute;
      box-sizing: border-box;
      top: var(--switch-padding);
      left: var(--switch-padding);
      width: calc(
        var(--switch-height) - (var(--switch-border) * 2) -
          (var(--switch-padding) * 2)
      );
      height: calc(
        var(--switch-height) - (var(--switch-border) * 2) -
          (var(--switch-padding) * 2)
      );
      border-radius: var(--ui-switch-thumb-radius, var(--ui-radius-full, 9999px));
      background-color: var(
        --ui-switch-thumb-bg,
        var(--ui-color-text-muted, oklch(0.70 0.02 260))
      );
      box-shadow: var(--ui-shadow-xs, 0 1px 3px rgba(0, 0, 0, 0.4));
      transform: translateX(0);
      transition:
        transform var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
        background-color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
    }

    /* --- Checked State --- */
    .track.checked {
      background-color: var(
        --ui-switch-bg-checked,
        var(--ui-color-primary, oklch(0.65 0.19 230))
      );
      border-color: var(
        --ui-switch-border-checked,
        var(--ui-color-primary-border, oklch(0.65 0.19 230 / 0.45))
      );
    }

    .track.checked .thumb {
      background-color: var(
        --ui-switch-thumb-bg-checked,
        var(--ui-color-primary-text, oklch(0.98 0 0))
      );
      transform: translateX(
        calc(var(--switch-width) - var(--switch-height))
      );
    }

    /* --- Label Typography --- */
    .label {
      font-size: 0.875rem;
      color: var(--ui-color-text, oklch(0.96 0.01 260));
      line-height: 1.25;
    }

    :host([size='sm']) .label {
      font-size: 0.8125rem;
    }

    :host([size='lg']) .label {
      font-size: 1rem;
    }

    :host([disabled]) {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }

    @media (forced-colors: active) {
      .track {
        border: 2px solid ButtonText;
      }
      .track.checked {
        background-color: Highlight;
      }
      .thumb {
        background-color: ButtonText;
      }
      .track.checked .thumb {
        background-color: HighlightText;
      }
      :host(:focus-visible) .track {
        outline: 2px solid Highlight;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .track,
      .thumb {
        transition: none;
      }
    }
  `

  checked = false
  disabled = false
  size: Size = 'md'
  label = ''
  ariaLabel = ''
  ariaLabelledby = ''
  ariaDescribedby = ''

  #onClick = (event: Event): void => {
    event.preventDefault()
    this.toggle()
  }

  #onKeydown = (event: KeyboardEvent): void => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      this.toggle()
    }
  }

  toggle(): void {
    if (this.disabled) return
    this.checked = !this.checked
    this.emit('ui-change', { checked: this.checked })
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'switch')
    this.setAttribute('aria-checked', String(this.checked))
    this.setAttribute('tabindex', this.disabled ? '-1' : '0')
    const effectiveLabel = this.ariaLabel || this.label
    if (effectiveLabel && !this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', effectiveLabel)
    }
    this.addEventListener('click', this.#onClick)
    this.addEventListener('keydown', this.#onKeydown)
  }

  override disconnectedCallback(): void {
    this.removeEventListener('click', this.#onClick)
    this.removeEventListener('keydown', this.#onKeydown)
    super.disconnectedCallback()
  }

  protected override updated(): void {
    this.setAttribute('role', 'switch')
    this.setAttribute('aria-checked', String(this.checked))
    this.setAttribute('tabindex', this.disabled ? '-1' : '0')
    const effectiveLabel = this.ariaLabel || this.label
    if (effectiveLabel) {
      this.setAttribute('aria-label', effectiveLabel)
    }
    if (this.ariaLabelledby) {
      this.setAttribute('aria-labelledby', this.ariaLabelledby)
    }
    if (this.ariaDescribedby) {
      this.setAttribute('aria-describedby', this.ariaDescribedby)
    }
  }

  protected override render(): unknown {
    return html`
      <div class="track size-${this.size} ${this.checked ? 'checked' : ''}" part="track">
        <div class="thumb" part="thumb"></div>
      </div>
      <span class="label" part="label"><slot>${this.label}</slot></span>
    `
  }
}

if (!customElements.get(UI_TAG_NAMES.SWITCH)) {
  customElements.define(UI_TAG_NAMES.SWITCH, UISwitch)
}

