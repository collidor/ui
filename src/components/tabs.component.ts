import { html, css, type PropertyValues } from 'lit'
import { UIElement, bool } from '../base.element.ts'
import { UI_TAG_NAMES } from '../constants.ts'

export class UITab extends UIElement {
  static properties = {
    value: { type: String, reflect: true },
    active: bool(),
    disabled: bool(),
    controls: { type: String, attribute: 'aria-controls', reflect: true },
  }

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      user-select: none;
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--ui-tab-text-color, var(--ui-color-text-muted, oklch(0.70 0.02 260)));
      padding: var(--ui-space-3xs, 0.236em) var(--ui-space-xs, 0.618em);
      position: relative;
      transition: color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)), background-color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
      outline: none;
    }

    :host(:focus-visible) {
      outline: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
      outline-offset: -2px;
      border-radius: var(--ui-radius-sm, 0.236em);
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        transition: none !important;
      }
    }

    :host(:hover:not([disabled])) {
      color: var(--ui-color-text, oklch(0.96 0.01 260));
    }

    :host([active]) {
      color: var(--ui-tab-active-color, var(--ui-color-primary, oklch(0.65 0.19 230)));
      background-color: var(--ui-tab-active-bg, transparent);
    }

    :host([active])::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background-color: var(--ui-tab-active-border, var(--ui-color-primary, oklch(0.65 0.19 230)));
      border-radius: var(--ui-radius-full, 9999px);
    }

    :host([disabled]) {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }
  `

  value = ''
  active = false
  disabled = false
  controls = ''

  #onClick = (event: Event): void => {
    if (this.disabled) {
      event.preventDefault()
      return
    }
    this.emit('tab-selected', { value: this.value })
  }

  #onKeydown = (event: KeyboardEvent): void => {
    if (this.disabled) return
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      this.emit('tab-selected', { value: this.value })
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'tab')
    this.#syncAria()
    this.addEventListener('click', this.#onClick)
    this.addEventListener('keydown', this.#onKeydown)
  }

  override disconnectedCallback(): void {
    this.removeEventListener('click', this.#onClick)
    this.removeEventListener('keydown', this.#onKeydown)
    super.disconnectedCallback()
  }

  protected override updated(): void {
    this.#syncAria()
  }

  #syncAria(): void {
    this.setAttribute('tabindex', this.disabled ? '-1' : this.active ? '0' : '-1')
    this.setAttribute('aria-selected', String(this.active))
    if (this.disabled) {
      this.setAttribute('aria-disabled', 'true')
    } else {
      this.removeAttribute('aria-disabled')
    }
    if (this.controls) {
      this.setAttribute('aria-controls', this.controls)
    }
  }

  protected override render() {
    return html`<slot></slot>`
  }
}

export class UITabs extends UIElement {
  static properties = {
    value: { type: String, reflect: true },
  }

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--ui-space-3xs, 0.236em);
      border-bottom: 1px solid var(--ui-color-border, oklch(0.32 0.03 260));
      box-sizing: border-box;
      width: 100%;
    }

    :host([hidden]) {
      display: none !important;
    }
  `

  value = ''

  #onTabSelected = (event: Event): void => {
    const detail = (event as CustomEvent<{ value?: string }>).detail
    if (detail?.value === undefined) return
    this.value = detail.value
    this.#updateActiveTab()
    this.emit('ui-change', { value: this.value })
  }

  #onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return
    const tabs = Array.from(this.querySelectorAll<UITab>(UI_TAG_NAMES.TAB)).filter((tab) => !tab.disabled)
    if (!tabs.length) return

    const activeEl = (this.getRootNode() as Document | ShadowRoot).activeElement
    const currentIndex = tabs.findIndex((tab) => tab === activeEl || tab.shadowRoot?.activeElement === activeEl)
    if (currentIndex === -1) return

    let nextIndex = currentIndex
    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1
    }

    if (nextIndex !== currentIndex && tabs[nextIndex]) {
      event.preventDefault()
      const nextTab = tabs[nextIndex]
      nextTab.focus()
      const tabVal = nextTab.value || String(Array.from(this.querySelectorAll<UITab>(UI_TAG_NAMES.TAB)).indexOf(nextTab))
      this.value = tabVal
      this.#updateActiveTab()
      this.emit('ui-change', { value: this.value })
    }
  }

  #onSlotChange = (): void => {
    this.#updateActiveTab()
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'tablist')
    this.setAttribute('aria-orientation', 'horizontal')
    this.addEventListener('tab-selected', this.#onTabSelected)
    this.addEventListener('keydown', this.#onKeydown)
  }

  override disconnectedCallback(): void {
    this.removeEventListener('tab-selected', this.#onTabSelected)
    this.removeEventListener('keydown', this.#onKeydown)
    super.disconnectedCallback()
  }

  protected override onConnected(): void {
    this.#updateActiveTab()
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('value')) this.#updateActiveTab()
  }

  #updateActiveTab(): void {
    const tabs = this.querySelectorAll<UITab>(UI_TAG_NAMES.TAB)
    const currentVal = this.value
    tabs.forEach((tab, index) => {
      const tabVal = tab.value || String(index)
      tab.active = tabVal === currentVal
    })
  }

  protected override render() {
    return html`<slot @slotchange=${this.#onSlotChange}></slot>`
  }
}

if (!customElements.get(UI_TAG_NAMES.TAB)) {
  customElements.define(UI_TAG_NAMES.TAB, UITab)
}
if (!customElements.get(UI_TAG_NAMES.TABS)) {
  customElements.define(UI_TAG_NAMES.TABS, UITabs)
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-tab': UITab
    'ui-tabs': UITabs
  }
}
