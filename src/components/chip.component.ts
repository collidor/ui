import { html, css, nothing, type CSSResultGroup, type PropertyDeclarations } from 'lit'
import { UIElement, bool } from '../base.element.ts'
import { UI_TAG_NAMES, type Variant, type Size } from '../constants.ts'
import {
  UI_EVENTS,
  type UIChipEventMap,
  type UIChipGroupEventMap,
} from '../events.ts'

export class UIChip extends UIElement<UIChipEventMap> {
  static override properties: PropertyDeclarations = {
    value: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    closable: bool(),
    selected: bool(),
    selectable: bool(),
    icon: { type: String, reflect: true },
    avatar: { type: String, reflect: true },
  }

  static override styles: CSSResultGroup = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ui-space-4xs, 0.146em);
      padding: 4px 10px;
      font-size: 0.8rem;
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
      font-weight: 500;
      border-radius: var(--ui-radius-full, 9999px);
      box-sizing: border-box;
      user-select: none;
      cursor: default;
      transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      border: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.6));
      background: var(--ui-color-surface, oklch(0.18 0.02 260));
      color: var(--ui-color-text, oklch(0.96 0.01 260));
    }

    :host([size='sm']) {
      padding: 2px 8px;
      font-size: 0.7rem;
    }

    :host([size='lg']) {
      padding: 6px 14px;
      font-size: 0.9rem;
    }

    :host([selectable]) {
      cursor: pointer;
    }

    :host([selected]) {
      border-color: var(--ui-chip-accent, var(--ui-color-primary, oklch(0.65 0.19 230)));
      background: color-mix(
        in oklch,
        var(--ui-chip-accent, var(--ui-color-primary, oklch(0.65 0.19 230))) 25%,
        var(--ui-color-surface-elevated, oklch(0.22 0.025 260))
      );
      color: var(--ui-chip-accent, var(--ui-color-primary, oklch(0.85 0.15 230)));
    }

    :host([hidden]) {
      display: none !important;
    }

    :host(:focus-visible) {
      outline: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        transition: none !important;
      }
    }

    :host(:hover) {
      border-color: var(--ui-color-primary, oklch(0.65 0.19 230 / 0.8));
    }

    .chip-avatar {
      width: 1.2em;
      height: 1.2em;
      border-radius: 50%;
      object-fit: cover;
    }

    .chip-icon {
      font-size: 0.9em;
      line-height: 1;
    }

    .chip-label {
      display: inline-flex;
      align-items: center;
    }

    .chip-close-btn {
      background: transparent;
      border: none;
      color: var(--ui-color-text-muted, oklch(0.70 0.02 260));
      font-size: 0.8em;
      cursor: pointer;
      padding: 0;
      margin-left: 2px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .chip-close-btn:hover {
      color: var(--ui-color-text, oklch(0.96 0.01 260));
    }
  `

  value = ''
  variant: Variant = 'secondary'
  size: Size = 'md'
  closable = false
  selected = false
  selectable = false
  icon = ''
  avatar = ''

  /** Whether this chip participates in keyboard focus / group roving tabindex. */
  get isInteractive(): boolean {
    return this.selectable || this.closable
  }

  #parentGroup(): UIChipGroup | null {
    const group = this.closest(UI_TAG_NAMES.CHIP_GROUP)
    return group instanceof UIChipGroup ? group : null
  }

  #onClick = (event: Event): void => {
    if (
      event.composedPath().some((node) => node instanceof Element && node.classList.contains('chip-close-btn'))
    ) {
      return
    }
    this.toggle()
  }

  #wasInGroup = false

  #onKeydown = (event: KeyboardEvent): void => {
    if (
      event.composedPath().some((node) => node instanceof Element && node.classList.contains('chip-close-btn'))
    ) {
      return
    }
    if (this.selectable && (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault()
      this.toggle()
      return
    }
    if (this.closable && (event.key === 'Delete' || event.key === 'Backspace')) {
      event.preventDefault()
      this.close()
    }
  }

  #onClose = (event: Event): void => {
    event.stopPropagation()
    this.close()
  }

  #syncAria(): void {
    const inGroup = this.#parentGroup() !== null

    if (this.selectable) {
      this.setAttribute('role', 'checkbox')
      this.setAttribute('aria-checked', String(this.selected))
    } else {
      if (this.getAttribute('role') === 'checkbox') this.removeAttribute('role')
      this.removeAttribute('aria-checked')
    }

    if (this.closable) {
      this.setAttribute('aria-keyshortcuts', 'Delete Backspace')
    } else {
      this.removeAttribute('aria-keyshortcuts')
    }

    if (!this.isInteractive) {
      this.removeAttribute('tabindex')
    } else if (!inGroup) {
      // Standalone closable-only chips expose a single Tab stop on the close button
      if (this.selectable) {
        this.setAttribute('tabindex', '0')
      } else {
        this.removeAttribute('tabindex')
      }
    } else if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '-1')
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    const inGroup = this.#parentGroup() !== null
    if (inGroup !== this.#wasInGroup) {
      this.#wasInGroup = inGroup
      this.requestUpdate()
    }
    this.#syncAria()
    this.addEventListener('click', this.#onClick)
    this.addEventListener('keydown', this.#onKeydown)
    this.#parentGroup()?.syncRovingTabindex()
  }

  override disconnectedCallback(): void {
    this.removeEventListener('click', this.#onClick)
    this.removeEventListener('keydown', this.#onKeydown)
    super.disconnectedCallback()
  }

  public toggle(): void {
    if (!this.selectable) return
    this.selected = !this.selected
    this.emit(UI_EVENTS.SELECT, { value: this.value, selected: this.selected })
  }

  public close(): void {
    this.emit(UI_EVENTS.DISMISS, { value: this.value })
    this.remove()
  }

  protected override updated(): void {
    this.style.setProperty(
      '--ui-chip-accent',
      `var(--ui-color-${this.variant}, var(--ui-color-primary, oklch(0.65 0.19 230)))`,
    )
    this.#syncAria()
    this.#parentGroup()?.syncRovingTabindex()
  }

  protected override render(): unknown {
    const closeLabel = this.value ? `Remove ${this.value}` : 'Remove'
    const inGroup = this.#parentGroup() !== null

    return html`
      ${this.avatar
        ? html`<img class="chip-avatar" src=${this.avatar} alt="" part="avatar" />`
        : nothing}
      ${this.icon ? html`<span class="chip-icon" part="icon">${this.icon}</span>` : nothing}
      <span class="chip-label" part="label"><slot></slot></span>
      ${this.closable
        ? html`<button
            type="button"
            class="chip-close-btn"
            title=${closeLabel}
            aria-label=${closeLabel}
            part="close-button"
            tabindex=${inGroup ? '-1' : '0'}
            @click=${this.#onClose}
          >✕</button>`
        : nothing}
    `
  }
}

if (!customElements.get(UI_TAG_NAMES.CHIP)) {
  customElements.define(UI_TAG_NAMES.CHIP, UIChip)
}

export class UIChipGroup extends UIElement<UIChipGroupEventMap> {
  static override properties: PropertyDeclarations = {
    wrap: bool(),
  }

  static override styles: CSSResultGroup = css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--ui-space-3xs, 0.236em);
      flex-wrap: nowrap;
      overflow-x: auto;
      box-sizing: border-box;
    }

    :host([wrap]) {
      flex-wrap: wrap;
      overflow-x: visible;
    }
  `

  /** Omitted attribute wraps; `wrap="false"` keeps a single scrolling row. */
  wrap = true

  #interactiveChips(): UIChip[] {
    return Array.from(this.querySelectorAll<UIChip>(UI_TAG_NAMES.CHIP)).filter(
      (chip) => chip.isInteractive && !chip.hidden,
    )
  }

  #rootActiveElement(): Element | null {
    const root = this.getRootNode()
    if (root instanceof Document || root instanceof ShadowRoot) {
      return root.activeElement
    }
    return document.activeElement
  }

  /**
   * Maintains a single Tab stop across interactive chips in the group using
   * roving tabindex (Arrow keys / Home / End navigate between chips).
   */
  public syncRovingTabindex(preferred?: UIChip | null): void {
    const chips = this.#interactiveChips()
    if (chips.length === 0) return

    const activeEl = this.#rootActiveElement()
    let target: UIChip | null = null

    if (preferred && chips.includes(preferred)) {
      target = preferred
    } else if (activeEl instanceof UIChip && chips.includes(activeEl)) {
      target = activeEl
    } else {
      target =
        chips.find((c) => c.getAttribute('tabindex') === '0') ??
        chips.find((c) => c.selected) ??
        chips[0]
    }

    for (const chip of chips) {
      chip.setAttribute('tabindex', chip === target ? '0' : '-1')
    }
  }

  #onFocusIn = (event: FocusEvent): void => {
    const target = event.target
    if (target instanceof UIChip && target.isInteractive) {
      this.syncRovingTabindex(target)
    }
  }

  #onKeydown = (event: KeyboardEvent): void => {
    const chips = this.#interactiveChips()
    if (chips.length === 0) return

    const current = event.target instanceof HTMLElement
      ? event.target.closest<UIChip>(UI_TAG_NAMES.CHIP)
      : null
    const currentIndex = current ? chips.indexOf(current) : -1
    if (currentIndex === -1) return

    let nextIndex = -1
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % chips.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + chips.length) % chips.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = chips.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    const nextChip = chips[nextIndex]
    if (nextChip) {
      this.syncRovingTabindex(nextChip)
      nextChip.focus()
    }
  }

  #onChipDismiss = (event: Event): void => {
    const dismissed = event.target
    if (!(dismissed instanceof UIChip)) return

    const chips = this.#interactiveChips()
    const idx = chips.indexOf(dismissed)
    if (idx === -1) return

    const activeEl = this.#rootActiveElement()
    const hadFocus =
      activeEl === dismissed ||
      (activeEl instanceof Node && dismissed.contains(activeEl)) ||
      dismissed.shadowRoot?.activeElement != null
    const wasActiveTabStop = dismissed.getAttribute('tabindex') === '0'

    if (!hadFocus && !wasActiveTabStop) return

    const remaining = chips.filter((c) => c !== dismissed)
    const nextChip = remaining[idx] ?? remaining[idx - 1] ?? null
    if (nextChip) {
      for (const chip of remaining) {
        chip.setAttribute('tabindex', chip === nextChip ? '0' : '-1')
      }
      if (hadFocus) {
        nextChip.focus()
      }
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'group')
    this.addEventListener('focusin', this.#onFocusIn)
    this.addEventListener('keydown', this.#onKeydown)
    this.addEventListener(UI_EVENTS.DISMISS, this.#onChipDismiss)
    this.syncRovingTabindex()
  }

  override disconnectedCallback(): void {
    this.removeEventListener('focusin', this.#onFocusIn)
    this.removeEventListener('keydown', this.#onKeydown)
    this.removeEventListener(UI_EVENTS.DISMISS, this.#onChipDismiss)
    super.disconnectedCallback()
  }

  protected override render(): unknown {
    return html`<slot @slotchange=${() => this.syncRovingTabindex()}></slot>`
  }
}

if (!customElements.get(UI_TAG_NAMES.CHIP_GROUP)) {
  customElements.define(UI_TAG_NAMES.CHIP_GROUP, UIChipGroup)
}
