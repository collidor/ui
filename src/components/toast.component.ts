import { html, css, nothing } from 'lit'
import { UIElement, bool } from '../base.element.ts'
import { UI_TAG_NAMES, type Variant } from '../constants.ts'
import { announceLive } from '../announcer.ts'

export interface ToastOptions {
  title?: string
  message: string
  variant?: Variant
  duration?: number
  icon?: string
}

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

export class UIToast extends UIElement {
  static properties = {
    variant: { type: String, reflect: true },
    title: { type: String, reflect: true },
    duration: { type: Number, reflect: true },
    closable: bool(),
    icon: { type: String, reflect: true },
  }

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
      transition: opacity 0.25s ease, transform 0.25s ease;
    }

    .toast-box {
      display: flex;
      align-items: flex-start;
      gap: var(--ui-space-xs, 0.618em);
      padding: var(--ui-space-xs, 0.618em) var(--ui-space-sm, 1.000em);
      background: var(--ui-card-bg, var(--ui-color-surface-elevated, oklch(0.22 0.025 260)));
      color: var(--ui-color-text, oklch(0.96 0.01 260));
      border: 1px solid var(--ui-color-border, oklch(0.32 0.03 260));
      border-left: 4px solid var(--ui-toast-accent, var(--ui-color-info));
      border-radius: var(--ui-radius-sm, 0.146em);
      box-shadow: var(--ui-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.6));
      box-sizing: border-box;
      min-width: 260px;
      max-width: 420px;
    }

    .toast-icon {
      font-size: 1rem;
      color: var(--ui-toast-accent, var(--ui-color-info));
      line-height: 1.2;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .toast-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.8rem;
      line-height: 1.4;
    }

    .toast-title {
      font-family: var(--ui-font-heading, inherit);
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--ui-color-text, oklch(0.96 0.01 260));
    }

    .toast-close-btn {
      background: transparent;
      border: none;
      color: var(--ui-color-text-muted, oklch(0.70 0.02 260));
      font-size: 0.9rem;
      cursor: pointer;
      padding: 2px;
      line-height: 1;
      border-radius: var(--ui-radius-sm, 0.146em);
    }

    .toast-close-btn:hover {
      color: var(--ui-color-text, oklch(0.96 0.01 260));
    }

    .toast-close-btn:focus-visible {
      outline: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
      outline-offset: -2px;
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        transition: none !important;
      }
    }
  `

  variant: Variant = 'info'
  title = ''
  duration = 4000
  closable = true
  icon = ''

  #timer: ReturnType<typeof setTimeout> | null = null

  public dismiss(): void {
    if (this.#timer) clearTimeout(this.#timer)
    this.#timer = null
    this.emit('ui-toast-close', {})
    this.style.opacity = '0'
    this.style.transform = 'translateY(10px)'
    setTimeout(() => this.remove(), 250)
  }

  protected override onConnected(): void {
    const text = [this.title, this.textContent?.trim()].filter(Boolean).join(': ')
    if (text) {
      announceLive(text, this.variant === 'danger' ? 'assertive' : 'polite')
    }
    if (this.duration > 0) {
      this.#timer = setTimeout(() => this.dismiss(), this.duration)
    }
  }

  protected override onDisconnected(): void {
    if (this.#timer) clearTimeout(this.#timer)
    this.#timer = null
  }

  protected override willUpdate(): void {
    this.style.setProperty('--ui-toast-accent', accentValue(this.variant))
  }

  protected override render() {
    const icon = this.icon || DEFAULT_ICONS[this.variant] || 'ℹ'
    const role = this.variant === 'danger' ? 'alert' : 'status'
    return html`
      <div class="toast-box" role=${role} part="box">
        <span class="toast-icon" aria-hidden="true" part="icon">${icon}</span>
        <div class="toast-content" part="content">
          ${this.title ? html`<div class="toast-title" part="title">${this.title}</div>` : nothing}
          <slot></slot>
        </div>
        ${this.closable
          ? html`<button
              type="button"
              class="toast-close-btn"
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

if (!customElements.get(UI_TAG_NAMES.TOAST)) {
  customElements.define(UI_TAG_NAMES.TOAST, UIToast)
}

export class UIToastContainer extends UIElement {
  static properties = {
    placement: { type: String, reflect: true },
  }

  static styles = css`
    :host {
      position: fixed;
      z-index: 11000;
      display: flex;
      flex-direction: column;
      gap: var(--ui-space-xs, 0.618em);
      pointer-events: none;
      box-sizing: border-box;
      bottom: 1rem;
      right: 1rem;
    }

    :host([placement='top-right']) {
      top: 1rem;
      right: 1rem;
      bottom: auto;
      left: auto;
    }

    :host([placement='top-left']) {
      top: 1rem;
      left: 1rem;
      bottom: auto;
      right: auto;
    }

    :host([placement='bottom-right']) {
      bottom: 1rem;
      right: 1rem;
      top: auto;
      left: auto;
    }

    :host([placement='bottom-left']) {
      bottom: 1rem;
      left: 1rem;
      top: auto;
      right: auto;
    }

    :host([placement='top-center']) {
      top: 1rem;
      left: 50%;
      right: auto;
      bottom: auto;
      transform: translateX(-50%);
    }

    :host([placement='bottom-center']) {
      bottom: 1rem;
      left: 50%;
      right: auto;
      top: auto;
      transform: translateX(-50%);
    }

    ::slotted(*) {
      pointer-events: auto;
    }
  `

  placement = 'bottom-right'

  public notify(options: ToastOptions): UIToast {
    const toast = document.createElement(UI_TAG_NAMES.TOAST) as UIToast
    if (options.title) toast.title = options.title
    if (options.variant) toast.variant = options.variant
    if (options.duration !== undefined) toast.duration = options.duration
    if (options.icon) toast.icon = options.icon
    toast.textContent = options.message

    this.appendChild(toast)
    return toast
  }

  protected override render() {
    return html`<slot></slot>`
  }
}

if (!customElements.get(UI_TAG_NAMES.TOAST_CONTAINER)) {
  customElements.define(UI_TAG_NAMES.TOAST_CONTAINER, UIToastContainer)
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-toast': UIToast
    'ui-toast-container': UIToastContainer
  }
}
