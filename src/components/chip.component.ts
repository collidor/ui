import { html, css, nothing, type CSSResultGroup, type PropertyDeclarations } from 'lit'
import { UIElement, bool } from '../base.element.ts'
import { UI_TAG_NAMES, type Variant, type Size } from '../constants.ts'

export class UIChip extends UIElement {
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

  #onClick = (event: Event): void => {
    if (
      event.composedPath().some((node) => node instanceof Element && node.classList.contains('chip-close-btn'))
    ) {
      return
    }
    this.toggle()
  }

  #onKeydown = (event: KeyboardEvent): void => {
    if (!this.selectable) return
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      this.toggle()
    }
  }

  #onClose = (event: Event): void => {
    event.stopPropagation()
    this.close()
  }

  #syncAria(): void {
    if (this.selectable) {
      this.setAttribute('role', 'checkbox')
      this.setAttribute('aria-checked', String(this.selected))
      this.setAttribute('tabindex', '0')
    } else {
      if (this.getAttribute('role') === 'checkbox') this.removeAttribute('role')
      this.removeAttribute('aria-checked')
      this.removeAttribute('tabindex')
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.#syncAria()
    this.addEventListener('click', this.#onClick)
    this.addEventListener('keydown', this.#onKeydown)
  }

  override disconnectedCallback(): void {
    this.removeEventListener('click', this.#onClick)
    this.removeEventListener('keydown', this.#onKeydown)
    super.disconnectedCallback()
  }

  public toggle(): void {
    if (!this.selectable) return
    this.selected = !this.selected
    this.emit('ui-chip-select', { value: this.value, selected: this.selected })
  }

  public close(): void {
    this.emit('ui-chip-close', { value: this.value })
    this.remove()
  }

  protected override updated(): void {
    this.style.setProperty(
      '--ui-chip-accent',
      `var(--ui-color-${this.variant}, var(--ui-color-primary, oklch(0.65 0.19 230)))`,
    )
    this.#syncAria()
  }

  protected override render(): unknown {
    const closeLabel = this.value ? `Remove ${this.value}` : 'Remove'

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
            @click=${this.#onClose}
          >✕</button>`
        : nothing}
    `
  }
}

if (!customElements.get(UI_TAG_NAMES.CHIP)) {
  customElements.define(UI_TAG_NAMES.CHIP, UIChip)
}

export class UIChipGroup extends UIElement {
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

  override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'group')
  }

  protected override render(): unknown {
    return html`<slot></slot>`
  }
}

if (!customElements.get(UI_TAG_NAMES.CHIP_GROUP)) {
  customElements.define(UI_TAG_NAMES.CHIP_GROUP, UIChipGroup)
}

