import { html, css, nothing, type PropertyValues } from 'lit'
import { bool } from '../base.element.ts'
import { UIHeaderedElement, headerToggleIcon } from '../headerSurface.ts'
import { UI_TAG_NAMES } from '../constants.ts'

export class UIDialog extends UIHeaderedElement {
  static properties = {
    ...UIHeaderedElement.properties,
    open: bool(),
    title: { type: String, reflect: true },
    ariaLabel: { type: String, attribute: 'aria-label' },
    ariaLabelledby: { type: String, attribute: 'aria-labelledby' },
  }

  static styles = [UIHeaderedElement.styles, css`
    :host {
      display: contents;
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
    }

    dialog {
      box-sizing: border-box;
      background-color: var(--ui-dialog-bg, var(--ui-card-bg, var(--ui-color-surface-elevated, oklch(0.22 0.025 260))));
      border: 1px solid var(--ui-color-border, oklch(0.32 0.03 260));
      border-radius: var(--ui-radius-lg, 0.382em);
      color: var(--ui-dialog-color, var(--ui-card-color, var(--ui-color-text, oklch(0.96 0.01 260))));
      box-shadow: 0 var(--ui-space-md, 1.618em) var(--ui-space-xl, 4.236em) rgba(0, 0, 0, 0.6);
      padding: 0;
      max-width: min(90vw, 540px);
      width: 100%;
      outline: none;
    }

    dialog::backdrop {
      background-color: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(6px);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--ui-space-3xs, 0.236em) var(--ui-space-sm, 1.000em);
      background-color: var(--ui-header-bg, var(--ui-dialog-header-bg, var(--ui-card-header-bg, var(--ui-color-surface, oklch(0.14 0.02 260)))));
      border-bottom: var(--ui-header-border, 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5)));
      font-size: 1rem;
      font-weight: 600;
      color: var(--ui-header-color, var(--ui-dialog-header-color, var(--ui-card-header-color, var(--ui-color-text, oklch(0.96 0.01 260)))));
    }

    .title {
      margin: 0;
      font-size: inherit;
      font-weight: inherit;
      line-height: inherit;
      color: inherit;
      flex: 1;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--ui-header-color-muted, var(--ui-color-text-muted, oklch(0.70 0.02 260)));
      cursor: pointer;
      font-size: 1.1em;
      padding: var(--ui-space-4xs, 0.146em);
      border-radius: var(--ui-radius-sm, 0.146em);
      transition: color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
    }

    .close-btn:hover {
      color: var(--ui-header-color, var(--ui-color-text, oklch(0.96 0.01 260)));
    }

    .close-btn:focus-visible {
      outline: 2px solid var(--ui-color-primary, oklch(0.65 0.24 260));
      outline-offset: 2px;
      color: var(--ui-header-color, var(--ui-color-text, oklch(0.96 0.01 260)));
    }

    .body {
      padding: var(--ui-space-sm, 1.000em);
      line-height: var(--ui-line-height-normal, 1.618);
      color: var(--ui-dialog-color, var(--ui-card-color, var(--ui-color-text, oklch(0.96 0.01 260))));
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--ui-space-xs, 0.618em);
      padding: var(--ui-space-3xs, 0.236em) var(--ui-space-sm, 1.000em);
      background-color: var(--ui-dialog-footer-bg, var(--ui-card-footer-bg, var(--ui-color-surface, oklch(0.14 0.02 260))));
      color: var(--ui-dialog-footer-color, var(--ui-color-text-muted, oklch(0.70 0.02 260)));
      border-top: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
    }

    .footer:empty {
      display: none;
    }
  `]

  open = false
  title = ''
  override ariaLabel: string | null = null
  ariaLabelledby?: string

  #titleId = `dialog-title-${Math.random().toString(36).slice(2, 8)}`

  /** `show()` is modeless; attribute changes and `showModal()` are modal. */
  #presentation: 'modal' | 'modeless' = 'modal'
  /** Set while `updated()` calls `dialog.close()` so the native close event does not emit again. */
  #syncing = false
  #pointerDownInside = false

  #onDialogPointerDown = (event: PointerEvent): void => {
    const dialog = event.currentTarget as HTMLElement
    const rect = dialog.getBoundingClientRect()
    this.#pointerDownInside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
  }

  #onDialogClick = (event: MouseEvent): void => {
    const dialog = event.currentTarget as HTMLElement
    const rect = dialog.getBoundingClientRect()
    const clickedInside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    if (!clickedInside && !this.#pointerDownInside) this.close()
    this.#pointerDownInside = false
  }

  #onDialogClose = (): void => {
    if (this.#syncing || !this.open) return
    this.open = false
  }

  showModal(): void {
    this.#presentation = 'modal'
    this.#requestOpen()
  }

  show(): void {
    this.#presentation = 'modeless'
    this.#requestOpen()
  }

  close(): void {
    if (!this.open) {
      const dialog = this.#dialog()
      if (dialog?.open) {
        this.#closeNative()
        this.emit('ui-close')
      }
      return
    }
    this.open = false
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (!changed.has('open')) return
    const previous = changed.get('open')
    const opened = this.open && previous !== true
    const closed = !this.open && previous === true
    if (!opened && !closed) return

    const dialog = this.#dialog()
    if (!dialog) return

    if (opened) {
      if (!dialog.open) this.#showNative()
      this.emit('ui-open')
      return
    }

    if (dialog.open) this.#closeNative()
    this.emit('ui-close')
  }

  protected override render() {
    return html`
      <dialog
        part="dialog"
        aria-labelledby=${this.ariaLabelledby ?? (this.ariaLabel ? nothing : this.#titleId)}
        aria-label=${this.ariaLabel ?? nothing}
        @close=${this.#onDialogClose}
        @pointerdown=${this.#onDialogPointerDown}
        @click=${this.#onDialogClick}
      >
        <div
          class="header"
          part="header"
          role=${this.collapsible ? 'button' : nothing}
          tabindex=${this.collapsible ? '0' : nothing}
          aria-expanded=${this.collapsible ? String(!this.collapsed) : nothing}
          @click=${this.onHeaderClick}
          @keydown=${this.onHeaderKeydown}
        >
          <h2 id=${this.#titleId} class="title"><slot name="title">${this.title}</slot></h2>
          ${headerToggleIcon(this.collapsible)}
          <button
            class="close-btn"
            type="button"
            aria-label="Close dialog"
            part="close-btn"
            data-header-action
            @click=${this.close}
          >
            ✕
          </button>
        </div>
        <div class="body" part="body">
          <slot></slot>
        </div>
        <div class="footer" part="footer">
          <slot name="footer"></slot>
        </div>
      </dialog>
    `
  }

  #requestOpen(): void {
    if (this.open) {
      const dialog = this.#dialog()
      if (dialog && !dialog.open) {
        this.#showNative()
        this.emit('ui-open')
      }
      return
    }
    this.open = true
  }

  #dialog(): HTMLDialogElement | null {
    return this.shadow.querySelector('dialog')
  }

  #showNative(): void {
    const dialog = this.#dialog()
    if (!dialog || dialog.open) return
    if (this.#presentation === 'modeless') {
      if (typeof dialog.show === 'function') dialog.show()
      else dialog.open = true
      return
    }
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.open = true
  }

  #closeNative(): void {
    const dialog = this.#dialog()
    if (!dialog || !dialog.open) return
    this.#syncing = true
    try {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.open = false
    } finally {
      this.#syncing = false
    }
  }
}

if (!customElements.get(UI_TAG_NAMES.DIALOG)) {
  customElements.define(UI_TAG_NAMES.DIALOG, UIDialog)
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-dialog': UIDialog
  }
}
