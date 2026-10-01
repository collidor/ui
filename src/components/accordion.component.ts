import { html, css, nothing } from 'lit'
import { UIElement, bool } from '../base.element.ts'
import { headerSurfaceProperty, headerSurfaceStyle } from '../headerSurface.ts'
import { UI_TAG_NAMES } from '../constants.ts'

export class UIAccordionItem extends UIElement {
  static properties = {
    headerSurface: headerSurfaceProperty,
    title: { type: String, reflect: true },
    open: bool(),
    disabled: bool(),
    icon: { type: String, reflect: true },
  }

  static styles = [headerSurfaceStyle, css`
    :host {
      display: block;
      box-sizing: border-box;
      border-bottom: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
    }

    :host(:last-of-type) {
      border-bottom: none;
    }

    .accordion-heading {
      margin: 0;
      padding: 0;
      font-size: inherit;
      font-weight: inherit;
    }

    button.accordion-header {
      appearance: none;
      -webkit-appearance: none;
      box-sizing: border-box;
      width: 100%;
      border: none;
      outline: none;
      text-align: left;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--ui-space-sm, 1.000em);
      cursor: pointer;
      opacity: 1;
      user-select: none;
      background: var(--ui-header-bg, transparent);
      color: var(--ui-header-color, var(--ui-color-text, oklch(0.96 0.01 260)));
      border-bottom: var(--ui-header-border, 0);
      font-family: var(--ui-font-heading, inherit);
      font-size: 0.9rem;
      font-weight: 600;
      transition: background-color var(--ui-transition-fast, 0.15s ease);
    }

    button.accordion-header:focus-visible {
      outline: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
      outline-offset: -2px;
    }

    button.accordion-header.disabled {
      cursor: not-allowed;
      opacity: 0.4;
    }

    button.accordion-header:hover:not(.disabled) {
      background: var(--ui-color-surface-hover, oklch(0.26 0.025 260 / 0.5));
    }

    .header-title-group {
      display: flex;
      align-items: center;
      gap: var(--ui-space-xs, 0.618em);
    }

    .header-icon {
      font-size: 1rem;
    }

    .chevron {
      font-size: 0.75rem;
      color: var(--ui-header-color-muted, var(--ui-color-text-muted, oklch(0.70 0.02 260)));
      transition: transform var(--ui-transition-base, 0.2s ease);
      transform: rotate(0deg);
    }

    :host([open]) .chevron {
      transform: rotate(90deg);
    }

    @media (prefers-reduced-motion: reduce) {
      button.accordion-header,
      .chevron {
        transition: none !important;
      }
    }

    .accordion-content {
      display: none;
      padding: 0 var(--ui-space-sm, 1.000em) var(--ui-space-sm, 1.000em);
      font-size: 0.85rem;
      line-height: var(--ui-line-height-normal, 1.618);
      color: var(--ui-color-text-muted, oklch(0.85 0.01 260));
    }

    :host([open]) .accordion-content {
      display: block;
    }
  `]

  static #idCounter = 0
  #panelId = `ui-accordion-panel-${++UIAccordionItem.#idCounter}`
  #headerId = `ui-accordion-header-${UIAccordionItem.#idCounter}`

  headerSurface = ''
  title = ''
  open = false
  disabled = false
  icon = ''

  override focus(options?: FocusOptions): void {
    this.renderRoot.querySelector<HTMLButtonElement>('button.accordion-header')?.focus(options)
  }

  #onHeaderClick = (): void => {
    this.toggle()
  }

  public toggle(): void {
    if (this.disabled) return
    this.open = !this.open
    this.emit('ui-accordion-change', { item: this, open: this.open })
  }

  protected override render() {
    return html`
      <h3 class="accordion-heading" part="heading">
        <button
          type="button"
          id=${this.#headerId}
          class="accordion-header${this.disabled ? ' disabled' : ''}"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-controls=${this.#panelId}
          ?disabled=${this.disabled}
          part="header"
          @click=${this.#onHeaderClick}
        >
          <div class="header-title-group">
            ${this.icon ? html`<span class="header-icon" aria-hidden="true" part="icon">${this.icon}</span>` : nothing}
            <slot name="title"><span class="header-title" part="title">${this.title}</span></slot>
          </div>
          <span class="chevron" aria-hidden="true" part="chevron">▶</span>
        </button>
      </h3>
      <div
        id=${this.#panelId}
        class="accordion-content"
        role="region"
        aria-labelledby=${this.#headerId}
        part="content"
      >
        <slot></slot>
      </div>
    `
  }
}

if (!customElements.get(UI_TAG_NAMES.ACCORDION_ITEM)) {
  customElements.define(UI_TAG_NAMES.ACCORDION_ITEM, UIAccordionItem)
}

export class UIAccordion extends UIElement {
  static properties = {
    multiple: bool(),
  }

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      border: 1px solid var(--ui-color-border, oklch(0.32 0.03 260));
      border-radius: var(--ui-radius-md, 0.236em);
      background: var(--ui-card-bg, var(--ui-color-surface-elevated, oklch(0.22 0.025 260)));
      overflow: hidden;
    }

    :host([hidden]) {
      display: none !important;
    }
  `

  multiple = false

  #onChange = (event: Event): void => {
    const detail = (event as CustomEvent<{ item: UIAccordionItem; open: boolean }>).detail
    if (!detail?.open || this.multiple) return
    const items = this.querySelectorAll<UIAccordionItem>(UI_TAG_NAMES.ACCORDION_ITEM)
    items.forEach((item) => {
      if (item !== detail.item) item.open = false
    })
  }

  #onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') return
    const items = Array.from(this.querySelectorAll<UIAccordionItem>(UI_TAG_NAMES.ACCORDION_ITEM)).filter((i) => !i.disabled)
    if (!items.length) return
    const targetItem = event.composedPath().find(
      (el) => el instanceof HTMLElement && el.tagName.toLowerCase() === UI_TAG_NAMES.ACCORDION_ITEM,
    ) as UIAccordionItem | undefined
    const currentIndex = targetItem ? items.indexOf(targetItem) : -1
    if (currentIndex === -1) return

    let nextIndex = currentIndex
    if (event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % items.length
    } else if (event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + items.length) % items.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = items.length - 1
    }

    if (nextIndex !== currentIndex && items[nextIndex]) {
      event.preventDefault()
      items[nextIndex].focus()
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('ui-accordion-change', this.#onChange)
    this.addEventListener('keydown', this.#onKeydown)
  }

  override disconnectedCallback(): void {
    this.removeEventListener('ui-accordion-change', this.#onChange)
    this.removeEventListener('keydown', this.#onKeydown)
    super.disconnectedCallback()
  }

  protected override render() {
    return html`<slot></slot>`
  }
}

if (!customElements.get(UI_TAG_NAMES.ACCORDION)) {
  customElements.define(UI_TAG_NAMES.ACCORDION, UIAccordion)
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-accordion-item': UIAccordionItem
    'ui-accordion': UIAccordion
  }
}
