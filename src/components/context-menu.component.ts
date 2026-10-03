import { html,
  css,
  type CSSResultGroup,
  type PropertyDeclarations,
  type PropertyValues, } from 'lit'
import { UIElement, bool } from '../base.element.ts'
import { UI_TAG_NAMES } from '../constants.ts'
import { UIMenuItem } from './menu.component.ts'

export class UIContextMenu extends UIElement {
  static override properties: PropertyDeclarations = {
    target: { type: String, reflect: true },
    disabled: bool(),
    open: bool(),
    ariaLabel: { type: String, attribute: 'aria-label' },
  }

  static override styles: CSSResultGroup = css`
    :host {
      display: contents;
    }

    .context-menu-panel {
      margin: 0;
      padding: 4px;
      min-width: 180px;
      max-width: 320px;
      background: var(
        --ui-card-bg,
        var(--ui-color-surface-elevated, oklch(0.22 0.025 260))
      );
      color: var(--ui-color-text, oklch(0.96 0.01 260));
      border: 1px solid var(--ui-color-border, oklch(0.32 0.03 260));
      border-radius: var(--ui-radius-sm, 0.236em);
      box-shadow: var(--ui-shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.5));
      font-family: var(--ui-font-family, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif);
      box-sizing: border-box;
      z-index: 10000;

      /* Discrete Top-Layer Transition */
      opacity: 0;
      transform: scale(0.94);
      transition-property: opacity, transform, display, overlay;
      transition-duration: 0.12s;
      transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
      transition-behavior: allow-discrete;
    }

    :host([open]) .context-menu-panel,
    .context-menu-panel:popover-open {
      inset: auto;
      margin: 0;
      opacity: 1;
      transform: scale(1);
    }

    @starting-style {
      .context-menu-panel:popover-open {
        opacity: 0;
        transform: scale(0.94);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .context-menu-panel {
        transform: none !important;
        transition: none !important;
      }
    }
  `

  target = ''
  disabled = false
  open = false
  ariaLabel = ''

  #x = 0
  #y = 0
  #positioned = false
  #focusedIndex = -1
  #currentTargetEl: HTMLElement | null = null
  #returnFocusEl: HTMLElement | null = null

  #onContextMenu = (event: MouseEvent): void => {
    if (this.disabled) return
    event.preventDefault()
    event.stopPropagation()
    let x = event.clientX
    let y = event.clientY
    if (x === 0 && y === 0 && this.#currentTargetEl) {
      const rect = this.#currentTargetEl.getBoundingClientRect()
      x = rect.left + Math.min(rect.width / 2, 20)
      y = rect.top + Math.min(rect.height / 2, 20)
    }
    this.showAt(x, y)
  }

  #onItemClick = (event: Event): void => {
    const item = menuItemFromEvent(event)
    if (!item || !this.contains(item)) return
    event.stopPropagation()
    if (item.disabled) return
    this.emit('ui-menu-select', { value: item.value, item })
    this.close()
  }

  #onKeyDown = (event: KeyboardEvent): void => {
    if (!this.isOpen()) return

    const items = this.#menuItems()
    if (items.length === 0) return

    const activeEl = (this.getRootNode() as Document | ShadowRoot).activeElement ?? document.activeElement
    let currentIndex = items.findIndex((item) => item === activeEl || item.shadowRoot?.activeElement === activeEl)
    if (currentIndex === -1) currentIndex = this.#focusedIndex

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      this.#focusedIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % items.length
      this.#focusItem(items, this.#focusedIndex)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      this.#focusedIndex = currentIndex === -1 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length
      this.#focusItem(items, this.#focusedIndex)
    } else if (event.key === 'Home') {
      event.preventDefault()
      this.#focusedIndex = 0
      this.#focusItem(items, this.#focusedIndex)
    } else if (event.key === 'End') {
      event.preventDefault()
      this.#focusedIndex = items.length - 1
      this.#focusItem(items, this.#focusedIndex)
    } else if (event.key === 'Enter' || event.key === ' ') {
      if (currentIndex >= 0 && items[currentIndex]) {
        event.preventDefault()
        items[currentIndex]?.click()
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      this.close()
    } else if (event.key === 'Tab') {
      this.close()
    }
  }

  #focusItem(items: UIMenuItem[], index: number): void {
    items.forEach((item, idx) => {
      item.setAttribute('tabindex', idx === index ? '0' : '-1')
    })
    items[index]?.focus()
  }

  // Custom light-dismiss that does NOT close if right-clicking to open a new one
  #onPointerDown = (event: PointerEvent): void => {
    if (!this.isOpen()) return
    const path = event.composedPath()
    const panel = this.#panel()
    if (path.includes(this) || (panel !== null && path.includes(panel))) return
    if (event.button === 2 && this.#currentTargetEl && path.includes(this.#currentTargetEl)) return
    this.close()
  }

  #onWindowBlur = (): void => {
    if (this.isOpen()) this.close()
  }

  public showAt(x: number, y: number): void {
    if (this.disabled) return
    if (document.activeElement instanceof HTMLElement) {
      this.#returnFocusEl = document.activeElement
    }
    this.#x = x
    this.#y = y
    this.#positioned = true
    this.#focusedIndex = -1
    if (!this.open) {
      this.open = true
      return
    }
    this.#positioned = false
    this.#reveal()
    this.emit('ui-context-menu-open', { x, y })
  }

  public close(): void {
    this.#focusedIndex = -1
    if (!this.open) {
      this.#hideNative()
      return
    }
    this.open = false
    if (this.#returnFocusEl) {
      this.#returnFocusEl.focus()
      this.#returnFocusEl = null
    }
  }

  public isOpen(): boolean {
    const popover = this.#panel()
    if (popover && typeof popover.matches === 'function') {
      try {
        if (popover.matches(':popover-open')) return true
      } catch {
        // Pseudo-class not supported or test environment
      }
    }
    return this.open
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.#bindTarget()
  }

  #onDocumentContextMenu = (event: MouseEvent): void => {
    if (this.disabled) return
    if (!this.target) return
    const path = event.composedPath()
    const matched = path.find(
      (el): el is HTMLElement =>
        el instanceof HTMLElement && typeof el.matches === 'function' && el.matches(this.target)
    )
    if (matched) {
      this.#currentTargetEl = matched
      this.#onContextMenu(event)
    }
  }

  protected override onConnected(): void {
    this.#bindTarget()
    this.addEventListener('click', this.#onItemClick)
    window.addEventListener('keydown', this.#onKeyDown)
    window.addEventListener('pointerdown', this.#onPointerDown)
    window.addEventListener('blur', this.#onWindowBlur)
    window.addEventListener('contextmenu', this.#onDocumentContextMenu)
  }

  protected override onDisconnected(): void {
    this.#unbindTarget()
    this.removeEventListener('click', this.#onItemClick)
    window.removeEventListener('keydown', this.#onKeyDown)
    window.removeEventListener('pointerdown', this.#onPointerDown)
    window.removeEventListener('blur', this.#onWindowBlur)
    window.removeEventListener('contextmenu', this.#onDocumentContextMenu)
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('target') && this.hasUpdated) this.#bindTarget()
    if (!changed.has('open')) return
    const previous = changed.get('open')
    const opened = this.open && previous !== true
    const closed = !this.open && previous === true
    if (opened) {
      if (this.disabled) {
        this.#positioned = false
        return
      }
      if (!this.#positioned) {
        this.#x = 100
        this.#y = 100
      }
      this.#positioned = false
      this.#focusedIndex = -1
      this.#reveal()
      this.emit('ui-context-menu-open', { x: this.#x, y: this.#y })
    } else if (closed) {
      this.#hideNative()
      this.#focusedIndex = -1
      if (this.#returnFocusEl) {
        this.#returnFocusEl.focus()
        this.#returnFocusEl = null
      }
      this.emit('ui-context-menu-close')
    }
  }

  protected override render(): unknown {
    return html`
      <div
        popover="manual"
        class="context-menu-panel"
        part="panel"
        role="menu"
        aria-orientation="vertical"
        tabindex="-1"
        aria-label="${this.ariaLabel || 'Context Menu'}"
      >
        <slot></slot>
      </div>
    `
  }

  #bindTarget(): void {
    this.#unbindTarget()
    const root = this.getRootNode() as Document | ShadowRoot
    const targetEl = this.target
      ? (root?.querySelector?.<HTMLElement>(this.target) ?? document.querySelector<HTMLElement>(this.target))
      : this.parentElement
    if (!targetEl) return
    this.#currentTargetEl = targetEl
    targetEl.addEventListener('contextmenu', this.#onContextMenu)
  }

  #unbindTarget(): void {
    if (!this.#currentTargetEl) return
    this.#currentTargetEl.removeEventListener('contextmenu', this.#onContextMenu)
    this.#currentTargetEl = null
  }

  #menuItems(): UIMenuItem[] {
    return Array.from(this.querySelectorAll<UIMenuItem>(UI_TAG_NAMES.MENU_ITEM)).filter((item) => !item.disabled)
  }

  #panel(): HTMLElement | null {
    return this.shadow.querySelector('.context-menu-panel')
  }

  #reveal(): void {
    const popover = this.#panel()
    if (!popover) return
    const x = this.#x
    const y = this.#y
    popover.style.position = 'fixed'
    popover.style.inset = 'auto'
    popover.style.margin = '0'
    popover.style.left = `${x}px`
    popover.style.top = `${y}px`
    popover.style.right = 'auto'
    popover.style.bottom = 'auto'
    this.#showNative(popover)

    // Viewport clamping
    requestAnimationFrame(() => {
      if (!this.isOpen()) return
      const rect = popover.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight

      let adjX = x
      let adjY = y

      if (adjX + rect.width > vw) adjX = Math.max(8, vw - rect.width - 8)
      if (adjY + rect.height > vh) adjY = Math.max(8, vh - rect.height - 8)

      popover.style.left = `${adjX}px`
      popover.style.top = `${adjY}px`
    })

    requestAnimationFrame(() => {
      if (!this.isOpen()) return
      const items = this.#menuItems()
      if (items.length > 0) {
        this.#focusedIndex = 0
        this.#focusItem(items, 0)
      }
    })
  }

  #showNative(popover: HTMLElement): void {
    if (typeof popover.showPopover !== 'function') return
    try {
      if (popover.matches(':popover-open')) return
    } catch {
      // Pseudo-class not supported.
    }
    try {
      popover.showPopover()
    } catch {
      // Fallback
    }
  }

  #hideNative(): void {
    const popover = this.#panel()
    if (!popover || typeof popover.hidePopover !== 'function') return
    try {
      popover.hidePopover()
    } catch {
      // Fallback
    }
  }
}

function menuItemFromEvent(event: Event): UIMenuItem | null {
  for (const node of event.composedPath()) {
    if (
      node instanceof HTMLElement &&
      (node instanceof UIMenuItem || node.tagName?.toLowerCase() === UI_TAG_NAMES.MENU_ITEM)
    ) {
      return node as UIMenuItem
    }
  }
  return null
}

if (!customElements.get(UI_TAG_NAMES.CONTEXT_MENU)) {
  customElements.define(UI_TAG_NAMES.CONTEXT_MENU, UIContextMenu)
}

