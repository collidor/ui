import { html, css, nothing, type CSSResultGroup, type PropertyDeclarations } from 'lit'
import { UIElement, bool } from '../base.element.ts'
import { UI_TAG_NAMES, type Variant } from '../constants.ts'
import { announceLive } from '../announcer.ts'

const DEFAULT_ICONS: Record<string, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  danger: '✕',
  accent: '✦',
}

const COLOR_VARIANTS = new Set<string>([
  'primary',
  'secondary',
  'outline',
  'ghost',
  'danger',
  'accent',
  'info',
  'success',
  'warning',
  'neutral',
])

function accentValue(variant: string): string {
  const name = COLOR_VARIANTS.has(variant) ? variant : 'info'
  return `var(--ui-color-${name}, var(--ui-color-info))`
}

export class UIAlert extends UIElement {
  static override properties: PropertyDeclarations = {
    variant: { type: String, reflect: true },
    title: { type: String, reflect: true },
    closable: bool(),
    icon: { type: String, reflect: true },
  }

  static override styles: CSSResultGroup = css`
    :host {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      width: 100%;
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
    }

    :host([hidden]) {
      display: none !important;
    }

    .alert-box {
      display: flex;
      align-items: flex-start;
      gap: var(--ui-space-xs, 0.618em);
      padding: var(--ui-space-xs, 0.618em) var(--ui-space-sm, 1.000em);
      background: color-mix(in oklch, var(--ui-alert-accent, var(--ui-color-info)) 12%, var(--ui-color-surface-elevated, oklch(0.22 0.025 260)));
      border: 1px solid color-mix(in oklch, var(--ui-alert-accent, var(--ui-color-info)) 40%, transparent);
      border-left: 4px solid var(--ui-alert-accent, var(--ui-color-info));
      border-radius: var(--ui-radius-sm, 0.146em);
      color: var(--ui-color-text, oklch(0.96 0.01 260));
      box-sizing: border-box;
    }

    .alert-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      color: var(--ui-alert-accent, var(--ui-color-info));
      line-height: 1.2;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .alert-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.825rem;
      line-height: var(--ui-line-height-normal, 1.618);
    }

    .alert-title {
      font-family: var(--ui-font-heading, inherit);
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--ui-color-text, oklch(0.96 0.01 260));
    }

    .alert-close-btn {
      background: transparent;
      border: none;
      color: var(--ui-color-text-muted, oklch(0.70 0.02 260));
      font-size: 1rem;
      cursor: pointer;
      padding: 2px;
      line-height: 1;
      border-radius: var(--ui-radius-sm, 0.146em);
    }

    .alert-close-btn:hover {
      color: var(--ui-color-text, oklch(0.96 0.01 260));
    }

    .alert-close-btn:focus-visible {
      outline: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
      outline-offset: -2px;
    }
  `

  variant: Variant = 'info'
  title = ''
  closable = false
  icon = ''

  override connectedCallback(): void {
    super.connectedCallback()
    const text = [this.title, this.textContent?.trim()].filter(Boolean).join(': ')
    if (text) {
      announceLive(text, this.variant === 'danger' ? 'assertive' : 'polite')
    }
  }

  public dismiss(): void {
    this.emit('ui-alert-close', {})
    this.remove()
  }

  protected override willUpdate(): void {
    this.style.setProperty('--ui-alert-accent', accentValue(this.variant))
  }

  protected override render(): unknown {
    const icon = this.icon || DEFAULT_ICONS[this.variant] || 'ℹ'
    const role = this.variant === 'danger' ? 'alert' : 'status'
    return html`
      <div class="alert-box variant-${this.variant}" role=${role} part="box">
        <span class="alert-icon" aria-hidden="true" part="icon">${icon}</span>
        <div class="alert-content" part="content">
          ${this.title ? html`<div class="alert-title" part="title">${this.title}</div>` : nothing}
          <slot></slot>
        </div>
        ${this.closable
          ? html`<button
              type="button"
              class="alert-close-btn"
              title="Dismiss"
              aria-label="Dismiss"
              part="close-button"
              @click=${this.dismiss}
            >
              ✕
            </button>`
          : nothing}
      </div>
    `
  }
}

if (!customElements.get(UI_TAG_NAMES.ALERT)) {
  customElements.define(UI_TAG_NAMES.ALERT, UIAlert)
}

