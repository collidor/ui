import { html, css, nothing, type PropertyValues, type CSSResultGroup, type PropertyDeclarations } from 'lit'
import { styleMap } from 'lit/directives/style-map.js'
import { UIElement, bool } from '../base.element.ts'
import { UI_TAG_NAMES, type Size } from '../constants.ts'

export class UISegmentItem extends UIElement {
  static override properties: PropertyDeclarations = {
    value: { type: String, reflect: true },
    disabled: bool(),
  }

  static override styles: CSSResultGroup = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      box-sizing: border-box;
      cursor: pointer;
      user-select: none;
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
      font-size: 0.8rem;
      font-weight: 600;
      padding: 4px 12px;
      text-align: center;
      color: inherit;
      outline: none;
    }

    :host(:focus-visible) {
      outline: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
      outline-offset: -2px;
    }

    :host([disabled]) {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
  `

  value = ''
  disabled = false

  override connectedCallback(): void {
    super.connectedCallback()
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'radio')
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('disabled')) {
      if (this.disabled) this.setAttribute('aria-disabled', 'true')
      else this.removeAttribute('aria-disabled')
    }
  }

  protected override render(): unknown {
    return html`<slot></slot>`
  }
}

if (!customElements.get(UI_TAG_NAMES.SEGMENT_ITEM)) {
  customElements.define(UI_TAG_NAMES.SEGMENT_ITEM, UISegmentItem)
}

export class UISegmentedControl extends UIElement {
  static override properties: PropertyDeclarations = {
    value: { type: String, reflect: true },
    size: { type: String, reflect: true },
    fullWidth: bool('full-width'),
    ariaLabel: { type: String, attribute: 'aria-label' },
    ariaLabelledby: { type: String, attribute: 'aria-labelledby' },
  }

  static override styles: CSSResultGroup = css`
    :host {
      display: inline-flex;
      box-sizing: border-box;
      width: auto;
    }

    :host([full-width]) {
      display: flex;
      width: 100%;
    }

    :host([hidden]) {
      display: none !important;
    }

    .segment-track {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      background: var(--ui-color-surface, oklch(0.14 0.02 260));
      border: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
      border-radius: var(--ui-radius-full, 9999px);
      box-sizing: border-box;
      gap: 2px;
    }

    ::slotted(ui-segment-item) {
      border-radius: var(--ui-radius-full, 9999px);
      transition:
        background-color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
        color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
      color: var(--ui-color-text-muted, oklch(0.70 0.02 260));
    }

    ::slotted(ui-segment-item:hover:not([disabled])) {
      color: var(--ui-color-text, oklch(0.96 0.01 260));
    }

    ::slotted(ui-segment-item.active) {
      background-color: var(--ui-color-surface-elevated, oklch(0.26 0.025 260));
      color: var(--ui-color-text, oklch(0.96 0.01 260));
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    }

    @media (prefers-reduced-motion: reduce) {
      ::slotted(ui-segment-item) {
        transition: none !important;
      }
    }
  `

  value = ''
  size: Size = 'md'
  fullWidth = false
  override ariaLabel: string | null = null
  ariaLabelledby?: string

  setValue(val: string): void {
    if (this.value === val) return
    this.value = val
    this.emit('ui-change', { value: val })
  }

  #pad(): string {
    if (this.size === 'sm') return '2px'
    if (this.size === 'lg') return '4px'
    return '3px'
  }

  #onClick = (event: Event): void => {
    const item = event
      .composedPath()
      .find((node): node is UISegmentItem => node instanceof UISegmentItem)
    if (item === undefined || item.disabled) return
    if (item.closest(UI_TAG_NAMES.SEGMENTED_CONTROL) !== this) return
    this.setValue(item.value)
  }

  #onKeyDown = (event: KeyboardEvent): void => {
    const items = Array.from(
      this.querySelectorAll<UISegmentItem>(UI_TAG_NAMES.SEGMENT_ITEM),
    ).filter((item) => !item.disabled)

    if (items.length === 0) return

    const currentIndex = items.findIndex(
      (item) => item === document.activeElement || item.contains(document.activeElement),
    )

    let nextIndex = -1
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % items.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        nextIndex =
          currentIndex === -1 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length
        break
      case 'Home':
        event.preventDefault()
        nextIndex = 0
        break
      case 'End':
        event.preventDefault()
        nextIndex = items.length - 1
        break
      case ' ':
        if (currentIndex !== -1) {
          event.preventDefault()
          this.setValue(items[currentIndex].value)
        }
        return
      default:
        return
    }

    if (nextIndex !== -1 && items[nextIndex]) {
      const nextItem = items[nextIndex]
      this.setValue(nextItem.value)
      nextItem.focus()
    }
  }

  #onSlotChange = (): void => {
    this.#updateActiveItem()
  }

  #updateActiveItem(): void {
    const current = this.value
    const items = Array.from(this.querySelectorAll<UISegmentItem>(UI_TAG_NAMES.SEGMENT_ITEM))
    const hasActive = items.some((item) => item.value === current && !item.disabled)
    let assignedFocus = false

    items.forEach((item, index) => {
      const active = item.value === current
      item.classList.toggle('active', active)
      item.setAttribute('aria-checked', active ? 'true' : 'false')
      if (item.disabled) {
        item.setAttribute('tabindex', '-1')
        item.setAttribute('aria-disabled', 'true')
      } else if (active) {
        item.setAttribute('tabindex', '0')
        assignedFocus = true
      } else if (!hasActive && !assignedFocus && index === 0) {
        item.setAttribute('tabindex', '0')
        assignedFocus = true
      } else {
        item.setAttribute('tabindex', '-1')
      }
    })
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('click', this.#onClick)
    this.addEventListener('keydown', this.#onKeyDown)
  }

  override disconnectedCallback(): void {
    this.removeEventListener('click', this.#onClick)
    this.removeEventListener('keydown', this.#onKeyDown)
    super.disconnectedCallback()
  }

  protected override updated(): void {
    this.#updateActiveItem()
  }

  protected override render(): unknown {
    return html`
      <div
        class="segment-track"
        role="radiogroup"
        aria-label=${this.ariaLabel ?? nothing}
        aria-labelledby=${this.ariaLabelledby ?? nothing}
        part="track"
        style=${styleMap({ padding: this.#pad() })}
      >
        <slot @slotchange=${this.#onSlotChange}></slot>
      </div>
    `
  }
}

if (!customElements.get(UI_TAG_NAMES.SEGMENTED_CONTROL)) {
  customElements.define(UI_TAG_NAMES.SEGMENTED_CONTROL, UISegmentedControl)
}

