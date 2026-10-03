import { html, css, type PropertyValues, type CSSResultGroup, type PropertyDeclarations } from 'lit'
import { UIElement } from '../base.element.ts'
import { UI_TAG_NAMES } from '../constants.ts'

let tooltipIdCounter = 0

export class UITooltip extends UIElement {
  static override properties: PropertyDeclarations = {
    content: { type: String, reflect: true },
    position: { type: String, reflect: true },
  }

  static override styles: CSSResultGroup = css`
    :host {
      display: inline-block;
      position: relative;
    }

    :host([hidden]) {
      display: none !important;
    }

    .tooltip-bubble {
      position: absolute;
      z-index: 10000;
      margin: 0;
      inset: auto;
      background-color: var(
        --ui-tooltip-bg,
        var(--ui-color-surface-elevated, oklch(0.22 0.025 260))
      );
      color: var(
        --ui-tooltip-color,
        var(--ui-color-text, oklch(0.96 0.01 260))
      );
      border: 1px solid var(--ui-color-border, oklch(0.32 0.03 260));
      border-radius: var(--ui-radius-sm, 0.146em);
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
      font-size: 0.75rem;
      line-height: var(--ui-line-height-tight, 1.236);
      white-space: nowrap;
      pointer-events: none;
      box-shadow: var(--ui-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.5));
      opacity: 0;
      visibility: hidden;
      transition:
        opacity var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
        visibility var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
      padding: var(--ui-space-4xs, 0.146em) var(--ui-space-3xs, 0.236em);
    }

    /* Fallback relative positioning when not yet positioned in top-layer */
    .tooltip-bubble.position-top {
      bottom: calc(100% + var(--ui-space-3xs, 0.236em));
      left: 50%;
      transform: translateX(-50%);
    }

    .tooltip-bubble.position-bottom {
      top: calc(100% + var(--ui-space-3xs, 0.236em));
      left: 50%;
      transform: translateX(-50%);
    }

    .tooltip-bubble.position-left {
      right: calc(100% + var(--ui-space-3xs, 0.236em));
      top: 50%;
      transform: translateY(-50%);
    }

    .tooltip-bubble.position-right {
      left: calc(100% + var(--ui-space-3xs, 0.236em));
      top: 50%;
      transform: translateY(-50%);
    }

    /* Visible State: popover open, hover, or focus */
    .tooltip-bubble:popover-open {
      inset: auto;
      margin: 0;
    }

    .tooltip-bubble:popover-open,
    :host(:hover) .tooltip-bubble,
    :host(:focus-within) .tooltip-bubble {
      opacity: 1;
      visibility: visible;
    }

    :host([data-dismissed]) .tooltip-bubble {
      opacity: 0 !important;
      visibility: hidden !important;
    }

    @media (prefers-reduced-motion: reduce) {
      .tooltip-bubble {
        transition: none !important;
      }
    }
  `

  content = ''
  position: 'top' | 'bottom' | 'left' | 'right' = 'top'

  #bubbleId = `ui-tooltip-bubble-${++tooltipIdCounter}`
  #isListeningToWindow = false

  #trigger(): HTMLElement | null {
    const slot = this.shadow.querySelector<HTMLSlotElement>('slot:not([name])')
    const assigned = slot?.assignedElements({ flatten: true }) ?? []
    for (const el of assigned) {
      if (el instanceof HTMLElement) return el
    }
    return null
  }

  #syncTrigger = (): void => {
    const trigger = this.#trigger()
    if (!trigger) return
    trigger.setAttribute('aria-describedby', this.#bubbleId)
    if (this.content) {
      trigger.setAttribute('aria-description', this.content)
    }
  }

  #updatePosition = (): void => {
    const bubble = this.#bubble()
    if (!bubble) return
    const trigger = this.#trigger() ?? this
    const targetRect = trigger.getBoundingClientRect()
    if (targetRect.width === 0 && targetRect.height === 0) return

    const offset = 8
    const bubbleRect = bubble.getBoundingClientRect()
    const bw = bubbleRect.width || 120
    const bh = bubbleRect.height || 30
    const vw = window.innerWidth
    const vh = window.innerHeight

    let pos = this.position || 'top'

    // Viewport collision auto-flip
    if (pos === 'top' && targetRect.top - bh - offset < 0) {
      pos = 'bottom'
    } else if (pos === 'bottom' && targetRect.bottom + bh + offset > vh) {
      pos = 'top'
    } else if (pos === 'left' && targetRect.left - bw - offset < 0) {
      pos = 'right'
    } else if (pos === 'right' && targetRect.right + bw + offset > vw) {
      pos = 'left'
    }

    let top = 0
    let left = 0
    let transform = ''

    if (pos === 'top') {
      top = targetRect.top - offset
      left = targetRect.left + targetRect.width / 2
      transform = 'translate(-50%, -100%)'
    } else if (pos === 'bottom') {
      top = targetRect.bottom + offset
      left = targetRect.left + targetRect.width / 2
      transform = 'translate(-50%, 0)'
    } else if (pos === 'left') {
      top = targetRect.top + targetRect.height / 2
      left = targetRect.left - offset
      transform = 'translate(-100%, -50%)'
    } else {
      // right
      top = targetRect.top + targetRect.height / 2
      left = targetRect.right + offset
      transform = 'translate(0, -50%)'
    }

    // Clamp horizontally for top/bottom
    if (pos === 'top' || pos === 'bottom') {
      const halfW = bw / 2
      if (left - halfW < 8) {
        left = 8 + halfW
      } else if (left + halfW > vw - 8) {
        left = vw - 8 - halfW
      }
    } else {
      const halfH = bh / 2
      if (top - halfH < 8) {
        top = 8 + halfH
      } else if (top + halfH > vh - 8) {
        top = vh - 8 - halfH
      }
    }

    bubble.style.position = 'fixed'
    bubble.style.inset = 'auto'
    bubble.style.margin = '0'
    bubble.style.top = `${top}px`
    bubble.style.left = `${left}px`
    bubble.style.transform = transform
  }

  #onScrollOrResize = (): void => {
    this.#updatePosition()
  }

  #onShow = (): void => {
    if (this.hasAttribute('data-dismissed')) return
    const bubble = this.#bubble()
    if (!bubble) return

    if (typeof bubble.showPopover === 'function') {
      try {
        bubble.showPopover()
      } catch {
        // ignore if already showing
      }
    }

    this.#updatePosition()

    if (!this.#isListeningToWindow) {
      window.addEventListener('scroll', this.#onScrollOrResize, {
        capture: true,
        passive: true,
      })
      window.addEventListener('resize', this.#onScrollOrResize, { passive: true })
      this.#isListeningToWindow = true
    }
  }

  #onHide = (): void => {
    if (this.#isListeningToWindow) {
      window.removeEventListener('scroll', this.#onScrollOrResize, { capture: true })
      window.removeEventListener('resize', this.#onScrollOrResize)
      this.#isListeningToWindow = false
    }

    const bubble = this.#bubble()
    if (!bubble) return

    if (typeof bubble.hidePopover === 'function') {
      try {
        bubble.hidePopover()
      } catch {
        // ignore if not showing
      }
    }
  }

  #onLeave = (event: MouseEvent | FocusEvent): void => {
    const related = (event as MouseEvent).relatedTarget as Node | null
    if (related && (this.contains(related) || this.shadowRoot?.contains(related))) {
      return
    }
    this.removeAttribute('data-dismissed')
    this.#onHide()
  }

  #onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.setAttribute('data-dismissed', '')
      this.#onHide()
    }
  }

  protected override onConnected(): void {
    this.addEventListener('mouseenter', this.#onShow)
    this.addEventListener('mouseleave', this.#onLeave)
    this.addEventListener('focusin', this.#onShow)
    this.addEventListener('focusout', this.#onLeave)
    this.addEventListener('keydown', this.#onKeydown)
  }

  protected override onDisconnected(): void {
    this.#onHide()
    this.removeEventListener('mouseenter', this.#onShow)
    this.removeEventListener('mouseleave', this.#onLeave)
    this.removeEventListener('focusin', this.#onShow)
    this.removeEventListener('focusout', this.#onLeave)
    this.removeEventListener('keydown', this.#onKeydown)
    const trigger = this.#trigger()
    if (trigger?.getAttribute('aria-describedby') === this.#bubbleId) {
      trigger.removeAttribute('aria-describedby')
      trigger.removeAttribute('aria-description')
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    this.#syncTrigger()
  }

  protected override render(): unknown {
    return html`
      <slot @slotchange=${this.#syncTrigger}></slot>
      <div
        id=${this.#bubbleId}
        popover="manual"
        class="tooltip-bubble position-${this.position}"
        part="bubble"
        role="tooltip"
      >
        <slot name="content">${this.content}</slot>
      </div>
    `
  }

  #bubble(): HTMLElement | null {
    return this.shadow.querySelector('.tooltip-bubble')
  }
}

if (!customElements.get(UI_TAG_NAMES.TOOLTIP)) {
  customElements.define(UI_TAG_NAMES.TOOLTIP, UITooltip)
}

