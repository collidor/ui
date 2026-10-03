import { html, css, nothing, type PropertyValues, type CSSResultGroup, type PropertyDeclarations } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import { UIElement, bool } from '../base.element.ts'
import { UI_TAG_NAMES, type Size } from '../constants.ts'
import { getSmartPaginationPages } from '../dataCollection.utils.ts'

export type PaginationMode = 'full' | 'stepper' | 'discrete' | '-+'
export type StepperFormat = 'arrows' | '-+'

export interface PageChangeEventDetail {
  page: number
  pageSize: number
  totalPages: number
  total: number
}

export interface PageSizeChangeEventDetail {
  pageSize: number
  page: number
}

/**
 * UIPagination Component
 *
 * Standalone pagination bar supporting configurable combo-button page controls:
 * - Stepper controls ('-+' or arrow format)
 * - Discrete numbered pages with ellipsis tokens
 * - Combo button composite roving tabindex:
 *   - Single Tab stop focuses into the button group
 *   - Arrow keys (Left/Right/Up/Down, Home/End) navigate between buttons
 *   - Space (and Enter) activates the focused button
 */
export class UIPagination extends UIElement {
  static override properties: PropertyDeclarations = {
    page: { type: Number, reflect: true },
    pageSize: { type: Number, attribute: 'page-size', reflect: true },
    total: { type: Number, reflect: true },
    pageSizeOptions: { type: Array, attribute: false },
    discretePages: {
      type: Boolean,
      attribute: 'discrete-pages',
      converter: (val: string | null) => val === null ? true : val !== 'false',
      reflect: true,
    },
    stepper: {
      type: Boolean,
      converter: (val: string | null) => val === null ? true : val !== 'false',
      reflect: true,
    },
    firstLast: {
      type: Boolean,
      attribute: 'first-last',
      converter: (val: string | null) => val === null ? true : val !== 'false',
      reflect: true,
    },
    stepperFormat: { type: String, attribute: 'stepper-format', reflect: true },
    mode: { type: String, reflect: true },
    showInfo: {
      type: Boolean,
      attribute: 'show-info',
      converter: (val: string | null) => val === null ? true : val !== 'false',
      reflect: true,
    },
    showPageSize: {
      type: Boolean,
      attribute: 'show-page-size',
      converter: (val: string | null) => val === null ? true : val !== 'false',
      reflect: true,
    },
    disabled: bool(),
    size: { type: String, reflect: true },
    ariaLabel: { type: String, attribute: 'aria-label' },
  }

  static override styles: CSSResultGroup = css`
    :host {
      display: block;
      box-sizing: border-box;
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
      width: 100%;
    }

    :host([hidden]) {
      display: none !important;
    }

    .pagination-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      flex-wrap: wrap;
      gap: var(--ui-space-xs, 0.618em);
    }

    .pagination-left {
      display: flex;
      align-items: center;
      gap: var(--ui-space-xs, 0.618em);
      color: var(--ui-color-text-muted, oklch(0.7 0.02 260));
      font-size: 0.8rem;
    }

    :host([size='sm']) .pagination-left {
      font-size: 0.7rem;
    }

    :host([size='lg']) .pagination-left {
      font-size: 0.9rem;
    }

    .page-size-selector {
      display: inline-flex;
      align-items: center;
      gap: var(--ui-space-4xs, 0.146em);
    }

    .page-size-select {
      background: var(
        --ui-table-page-btn-bg,
        var(--ui-color-surface-hover, oklch(0.24 0.025 260))
      );
      color: var(
        --ui-table-page-btn-color,
        var(--ui-color-text, oklch(0.96 0.01 260))
      );
      border: 1px solid
        var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
      border-radius: var(--ui-radius-sm, 0.146em);
      padding: 2px 6px;
      font-size: 0.75rem;
      outline: none;
      cursor: pointer;
    }

    .page-size-select:focus-visible {
      outline: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
      outline-offset: 1px;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: var(--ui-space-4xs, 0.146em);
    }

    .page-status {
      font-size: 0.8rem;
      color: var(--ui-color-text-muted, oklch(0.7 0.02 260));
      padding: 0 var(--ui-space-3xs, 0.236em);
      user-select: none;
    }

    /* Combo Button Segmented Group */
    .pagination-combo-btn {
      display: inline-flex;
      align-items: stretch;
      vertical-align: middle;
      border-radius: var(--ui-radius-sm, 0.146em);
    }

    .page-btn {
      position: relative;
      min-width: var(--ui-space-md, 1.618em);
      height: var(--ui-space-md, 1.618em);
      padding: 0 var(--ui-space-3xs, 0.236em);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(
        --ui-table-page-btn-bg,
        var(--ui-color-surface-hover, oklch(0.24 0.025 260))
      );
      border: 1px solid
        var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
      color: var(
        --ui-table-page-btn-color,
        var(--ui-color-text, oklch(0.96 0.01 260))
      );
      margin-right: -1px;
      border-radius: 0;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      user-select: none;
      transition:
        background var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
        border-color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
        color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
    }

    :host([size='sm']) .page-btn {
      min-width: 1.382em;
      height: 1.382em;
      font-size: 0.7rem;
    }

    :host([size='lg']) .page-btn {
      min-width: 2.118em;
      height: 2.118em;
      font-size: 0.875rem;
    }

    .pagination-combo-btn > .page-btn:first-of-type,
    .pagination-combo-btn > :first-child.page-btn {
      border-top-left-radius: var(--ui-radius-sm, 0.146em);
      border-bottom-left-radius: var(--ui-radius-sm, 0.146em);
    }

    .pagination-combo-btn > .page-btn:last-of-type,
    .pagination-combo-btn > :last-child.page-btn {
      border-top-right-radius: var(--ui-radius-sm, 0.146em);
      border-bottom-right-radius: var(--ui-radius-sm, 0.146em);
      margin-right: 0;
    }

    .page-btn:hover:not([disabled]):not(.active) {
      background: var(--ui-color-surface-active, oklch(0.28 0.03 260));
      border-color: var(--ui-color-border-hover, oklch(0.44 0.03 260));
      color: var(
        --ui-table-page-btn-color,
        var(--ui-color-text, oklch(0.96 0.01 260))
      );
      z-index: 1;
    }

    .page-btn.active {
      background: var(--ui-color-primary, oklch(0.65 0.19 230));
      color: var(--ui-color-primary-text, oklch(0.98 0.01 260));
      border-color: var(--ui-color-primary, oklch(0.65 0.19 230));
      font-weight: 700;
      z-index: 1;
    }

    .page-btn:focus-visible {
      outline: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
      outline-offset: 1px;
      z-index: 2;
    }

    .page-btn[disabled] {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .page-ellipsis {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      opacity: 0.5;
      border-top: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
      border-bottom: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
      margin-right: -1px;
      font-size: 0.75rem;
      user-select: none;
    }

    @media (forced-colors: active) {
      .page-btn.active {
        outline: 2px solid Highlight;
        background: Highlight;
        color: HighlightText;
      }
      .page-btn:focus-visible {
        outline: 2px solid Highlight;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .page-btn {
        transition: none;
      }
    }
  `

  page = 1
  pageSize = 10
  total = 0
  pageSizeOptions: number[] = [10, 25, 50, 100]
  discretePages = true
  stepper = true
  firstLast = true
  stepperFormat: StepperFormat = 'arrows'
  mode: PaginationMode = 'full'
  showInfo = true
  showPageSize = true
  disabled = false
  size: Size = 'md'
  ariaLabel = 'Pagination Navigation'

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / Math.max(1, this.pageSize)))
  }

  public setPage(newPage: number): void {
    const target = Math.max(1, Math.min(newPage, this.totalPages))
    if (this.page === target) return
    this.page = target
    const detail: PageChangeEventDetail = {
      page: this.page,
      pageSize: this.pageSize,
      totalPages: this.totalPages,
      total: this.total,
    }
    this.dispatchEvent(
      new CustomEvent('ui-page-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  public setPageSize(newPageSize: number): void {
    const size = Math.max(1, newPageSize)
    if (this.pageSize === size) return
    this.pageSize = size
    this.page = Math.max(1, Math.min(this.page, this.totalPages))
    this.dispatchEvent(
      new CustomEvent('ui-page-size-change', {
        detail: {
          pageSize: this.pageSize,
          page: this.page,
        } as PageSizeChangeEventDetail,
        bubbles: true,
        composed: true,
      }),
    )
    this.dispatchEvent(
      new CustomEvent('ui-page-change', {
        detail: {
          page: this.page,
          pageSize: this.pageSize,
          totalPages: this.totalPages,
          total: this.total,
        } as PageChangeEventDetail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  public nextPage(): void {
    if (this.page < this.totalPages) {
      this.setPage(this.page + 1)
    }
  }

  public prevPage(): void {
    if (this.page > 1) {
      this.setPage(this.page - 1)
    }
  }

  public firstPage(): void {
    this.setPage(1)
  }

  public lastPage(): void {
    this.setPage(this.totalPages)
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('mode')) {
      if (this.mode === '-+') {
        this.stepperFormat = '-+'
        this.firstLast = false
      } else if (this.mode === 'stepper') {
        this.discretePages = false
        this.firstLast = false
        this.stepper = true
      } else if (this.mode === 'discrete') {
        this.stepper = false
        this.firstLast = false
        this.discretePages = true
      } else if (this.mode === 'full') {
        this.stepper = true
        this.firstLast = true
        this.discretePages = true
        this.stepperFormat = 'arrows'
      }
    }
  }

  protected override updated(_changed: PropertyValues): void {
    super.updated(_changed)
    this.#updateRovingTabindex()
  }

  #updateRovingTabindex(): void {
    const container = this.shadowRoot?.querySelector('.pagination-combo-btn')
    if (!container) return

    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button.page-btn'),
    )
    if (buttons.length === 0) return

    const activeEl = this.shadowRoot?.activeElement as HTMLButtonElement | null
    const hadFocus = activeEl !== null && buttons.includes(activeEl)

    let targetBtn: HTMLButtonElement | null = null

    if (hadFocus && !activeEl.disabled) {
      targetBtn = activeEl
    } else {
      const activePageBtn = buttons.find(
        (b) => b.classList.contains('active') && !b.disabled,
      )
      if (activePageBtn) {
        targetBtn = activePageBtn
      } else {
        targetBtn = buttons.find((b) => !b.disabled) ?? buttons[0]
      }
    }

    for (const btn of buttons) {
      btn.setAttribute('tabindex', btn === targetBtn ? '0' : '-1')
    }

    // Restore focus if element was recreated during re-render
    if (hadFocus && this.shadowRoot?.activeElement !== targetBtn && targetBtn) {
      targetBtn.focus()
    }
  }

  #onComboKeyDown = (event: KeyboardEvent): void => {
    const container = this.shadowRoot?.querySelector('.pagination-combo-btn')
    if (!container) return

    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button.page-btn:not([disabled])'),
    )
    if (buttons.length === 0) return

    const target = event.target as HTMLButtonElement
    const currentIndex = buttons.indexOf(target)
    if (currentIndex === -1) return

    let nextIndex = -1

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        nextIndex = (currentIndex + 1) % buttons.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length
        break
      case 'Home':
        event.preventDefault()
        nextIndex = 0
        break
      case 'End':
        event.preventDefault()
        nextIndex = buttons.length - 1
        break
      case ' ':
        // Space activates the button and prevents page scroll
        event.preventDefault()
        target.click()
        return
      default:
        return
    }

    if (nextIndex !== -1 && buttons[nextIndex]) {
      const nextBtn = buttons[nextIndex]
      const allButtons = Array.from(
        container.querySelectorAll<HTMLButtonElement>('button.page-btn'),
      )
      for (const b of allButtons) {
        b.setAttribute('tabindex', b === nextBtn ? '0' : '-1')
      }
      nextBtn.focus()
    }
  }

  #onComboFocusIn = (event: FocusEvent): void => {
    const target = event.target as HTMLElement
    if (target && target.tagName === 'BUTTON' && target.classList.contains('page-btn')) {
      const container = this.shadowRoot?.querySelector('.pagination-combo-btn')
      if (!container) return
      const buttons = Array.from(
        container.querySelectorAll<HTMLButtonElement>('button.page-btn'),
      )
      for (const b of buttons) {
        b.setAttribute('tabindex', b === target ? '0' : '-1')
      }
    }
  }

  protected override render(): unknown {
    const { page, totalPages, total, pageSize } = this
    const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
    const endItem = Math.min(page * pageSize, total)
    const isFirstDisabled = page <= 1 || this.disabled
    const isLastDisabled = page >= totalPages || this.disabled
    const isStepperMinusPlus = this.stepperFormat === '-+'

    const prevLabel = isStepperMinusPlus ? '−' : '‹'
    const nextLabel = isStepperMinusPlus ? '+' : '›'

    const pageTokens = this.discretePages
      ? getSmartPaginationPages(page, totalPages)
      : []

    return html`
      <nav
        class="pagination-container"
        part="container"
        aria-label=${this.ariaLabel}
      >
        ${this.showInfo || this.showPageSize
          ? html`
              <div class="pagination-left" part="left">
                ${this.showInfo
                  ? html`
                      <span class="pagination-info" part="info">
                        Showing ${startItem}–${endItem} of ${total}
                      </span>
                    `
                  : nothing}
                ${this.showPageSize
                  ? html`
                      <div class="page-size-selector" part="page-size-selector">
                        <span>Show</span>
                        <select
                          class="page-size-select"
                          part="page-size-select"
                          aria-label="Rows per page"
                          ?disabled=${this.disabled}
                          @change=${(e: Event) => {
                            const select = e.currentTarget
                            if (select instanceof HTMLSelectElement) {
                              this.setPageSize(parseInt(select.value, 10))
                            }
                          }}
                        >
                          ${this.pageSizeOptions.map(
                            (opt) => html`
                              <option
                                value=${opt}
                                ?selected=${opt === pageSize}
                              >
                                ${opt}
                              </option>
                            `,
                          )}
                        </select>
                      </div>
                    `
                  : nothing}
              </div>
            `
          : nothing}

        <div class="pagination-controls" part="controls">
          ${!this.discretePages
            ? html`
                <span
                  class="page-status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  Page ${page} of ${totalPages}
                </span>
              `
            : nothing}

          <div
            class="pagination-combo-btn"
            role="group"
            aria-label="Pagination buttons"
            part="combo-btn"
            @keydown=${this.#onComboKeyDown}
            @focusin=${this.#onComboFocusIn}
          >
            ${this.firstLast && !isStepperMinusPlus
              ? html`
                  <button
                    type="button"
                    class="page-btn page-first"
                    ?disabled=${isFirstDisabled}
                    title="First Page"
                    aria-label="First page"
                    part="page-btn page-first"
                    tabindex="-1"
                    @click=${() => this.firstPage()}
                  >
                    «
                  </button>
                `
              : nothing}
            ${this.stepper
              ? html`
                  <button
                    type="button"
                    class="page-btn page-prev"
                    ?disabled=${isFirstDisabled}
                    title="Previous Page"
                    aria-label="Previous page"
                    part="page-btn page-prev"
                    tabindex="-1"
                    @click=${() => this.prevPage()}
                  >
                    ${prevLabel}
                  </button>
                `
              : nothing}
            ${this.discretePages
              ? pageTokens.map((p) =>
                  p === '...'
                    ? html`
                        <span class="page-ellipsis" aria-hidden="true">…</span>
                      `
                    : html`
                        <button
                          type="button"
                          class="page-btn ${p === page ? 'active' : ''}"
                          ?disabled=${this.disabled}
                          data-page=${p}
                          part="page-btn"
                          aria-label="Page ${p}"
                          aria-current=${ifDefined(
                            p === page ? 'page' : undefined,
                          )}
                          tabindex="-1"
                          @click=${() => this.setPage(Number(p))}
                        >
                          ${p}
                        </button>
                      `,
                )
              : nothing}
            ${this.stepper
              ? html`
                  <button
                    type="button"
                    class="page-btn page-next"
                    ?disabled=${isLastDisabled}
                    title="Next Page"
                    aria-label="Next page"
                    part="page-btn page-next"
                    tabindex="-1"
                    @click=${() => this.nextPage()}
                  >
                    ${nextLabel}
                  </button>
                `
              : nothing}
            ${this.firstLast && !isStepperMinusPlus
              ? html`
                  <button
                    type="button"
                    class="page-btn page-last"
                    ?disabled=${isLastDisabled}
                    title="Last Page"
                    aria-label="Last page"
                    part="page-btn page-last"
                    tabindex="-1"
                    @click=${() => this.lastPage()}
                  >
                    »
                  </button>
                `
              : nothing}
          </div>
        </div>
      </nav>
    `
  }
}

if (!customElements.get(UI_TAG_NAMES.PAGINATION)) {
  customElements.define(UI_TAG_NAMES.PAGINATION, UIPagination)
}
