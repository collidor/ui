import { html, css, nothing, type CSSResultGroup, type PropertyDeclarations, type PropertyValues } from 'lit'
import { UIElement, bool } from '../base.element.ts'
import { UI_TAG_NAMES, type Size } from '../constants.ts'
import { calculateVirtualWindow, type VirtualWindowResult } from '../dataCollection.utils.ts'

export interface ComboboxOption {
  value: string | number
  label: string
  description?: string
  disabled?: boolean
  [key: string]: unknown
}

export interface ComboboxVirtualConfig {
  enabled: boolean
  itemHeight?: number
  overscan?: number
  viewportHeight?: string
  threshold?: number
}

export class UICombobox extends UIElement {
  static override properties: PropertyDeclarations = {
    value: { type: Object },
    options: { type: Array },
    multiple: bool(),
    searchable: {
      type: Boolean,
      attribute: 'searchable',
      converter: (val: string | null) => (val === null ? true : val !== 'false'),
    },
    creatable: bool(),
    remote: bool(),
    loading: bool(),
    total: { type: Number },
    page: { type: Number },
    pageSize: { type: Number, attribute: 'page-size' },
    virtual: {
      converter: (val: string | null) => {
        if (val === null) return false
        if (val === '' || val === 'true') return true
        if (val === 'false') return false
        try {
          return JSON.parse(val)
        } catch {
          return true
        }
      },
    },
    debounceMs: { type: Number, attribute: 'debounce-ms' },
    placeholder: { type: String },
    label: { type: String },
    disabled: bool(),
    required: bool(),
    invalid: bool('invalid'),
    size: { type: String, reflect: true },
    open: { type: Boolean, reflect: true },
  }

  declare value: string | number | (string | number)[]
  declare options: ComboboxOption[]
  declare multiple: boolean
  declare searchable: boolean
  declare creatable: boolean
  declare remote: boolean
  declare loading: boolean
  declare total: number
  declare page: number
  declare pageSize: number
  declare virtual: ComboboxVirtualConfig | boolean
  declare debounceMs: number
  declare placeholder: string
  declare label: string
  declare disabled: boolean
  declare required: boolean
  declare invalid: boolean
  declare size: Size
  declare open: boolean

  #searchQuery = ''
  #debounceTimer: ReturnType<typeof setTimeout> | null = null
  #hydrationCache = new Map<string, ComboboxOption>()
  #scrollTop = 0
  #focusedIndex = -1

  constructor() {
    super()
    this.value = ''
    this.options = []
    this.multiple = false
    this.searchable = true
    this.creatable = false
    this.remote = false
    this.loading = false
    this.total = 0
    this.page = 1
    this.pageSize = 50
    this.virtual = false
    this.debounceMs = 250
    this.placeholder = ''
    this.label = ''
    this.disabled = false
    this.required = false
    this.invalid = false
    this.size = 'md'
    this.open = false
  }

  static override styles: CSSResultGroup = css`
    :host {
      display: inline-block;
      vertical-align: middle;
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
      width: 100%;
      position: relative;
      box-sizing: border-box;
    }

    :host([hidden]) {
      display: none !important;
    }

    .combobox-container {
      position: relative;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
      box-sizing: border-box;
      width: 100%;
      min-height: 2.25rem;
      padding: 3px 8px;
      background: var(
        --ui-input-bg,
        var(--ui-card-bg, var(--ui-color-surface-elevated, oklch(0.14 0.02 260)))
      );
      border: var(--ui-input-border, 1px solid var(--ui-color-border, oklch(0.32 0.03 260)));
      border-radius: var(--ui-input-radius, var(--ui-radius-md, 0.382em));
      box-shadow: var(--ui-input-shadow, none);
      cursor: text;
      transition:
        border-color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
        box-shadow var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
        background var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
    }

    .combobox-container:hover:not(.disabled) {
      border-color: var(--ui-color-border-hover, oklch(0.44 0.03 260));
    }

    .combobox-container.focus:not(.disabled),
    .combobox-container:focus-within:not(.disabled) {
      border-color: var(--ui-color-primary, oklch(0.65 0.19 230));
      box-shadow:
        0 0 0 1px var(--ui-color-primary, oklch(0.65 0.19 230)),
        0 0 0 4px var(--ui-color-focus-ring, oklch(0.65 0.19 230 / 0.5));
    }

    .combobox-container.invalid {
      border-color: var(--ui-color-danger, oklch(0.65 0.22 25));
    }

    .combobox-container.invalid:focus-within:not(.disabled) {
      border-color: var(--ui-color-danger, oklch(0.65 0.22 25));
      box-shadow:
        0 0 0 1px var(--ui-color-danger, oklch(0.65 0.22 25)),
        0 0 0 4px var(--ui-color-danger-subtle, oklch(0.65 0.22 25 / 0.3));
    }

    .combobox-container.disabled {
      opacity: 0.55;
      cursor: not-allowed;
      background: var(--ui-color-surface-dim, oklch(0.12 0.01 260));
    }

    /* Selected Tags in Multiple mode */
    .chip-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 1px 8px;
      font-size: 0.8rem;
      border-radius: var(--ui-radius-full, 9999px);
      background: color-mix(
        in oklch,
        var(--ui-color-primary, oklch(0.65 0.19 230)) 20%,
        var(--ui-color-surface-elevated, oklch(0.22 0.025 260))
      );
      color: var(--ui-color-text, oklch(0.96 0.01 260));
      border: 1px solid var(--ui-color-primary-subtle, oklch(0.65 0.19 230 / 0.4));
      user-select: none;
    }

    .chip-del-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      padding: 0;
      color: inherit;
      cursor: pointer;
      font-size: 0.75rem;
      opacity: 0.7;
    }

    .chip-del-btn:hover {
      opacity: 1;
    }

    /* Search input inside the trigger */
    .combobox-search-input {
      flex: 1 1 80px;
      min-width: 60px;
      background: transparent;
      border: none;
      outline: none;
      color: var(--ui-color-text, oklch(0.96 0.01 260));
      font-family: inherit;
      font-size: 0.875rem;
      padding: 2px 0;
    }

    .combobox-search-input::placeholder {
      color: var(--ui-color-text-muted, oklch(0.65 0.02 260));
      opacity: 0.85;
    }

    /* Dropdown Arrow & Loading Spinner */
    .combobox-icons {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
      color: var(--ui-color-text-muted, oklch(0.65 0.02 260));
    }

    .arrow-icon {
      width: 12px;
      height: 12px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: transform 150ms ease;
    }

    .arrow-icon.open {
      transform: rotate(180deg);
    }

    .spinner {
      width: 12px;
      height: 12px;
      border: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 600ms linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* Popover Dropdown */
    .combobox-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      z-index: 1000;
      background: var(
        --ui-color-surface-elevated,
        var(--ui-card-bg, oklch(0.18 0.025 260))
      );
      border: 1px solid var(--ui-color-border, oklch(0.32 0.03 260));
      border-radius: var(--ui-radius-md, 0.382em);
      box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.45);
      overflow: hidden;
      animation: fadeIn 120ms ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .combobox-dropdown-list {
      max-height: 240px;
      overflow-y: auto;
      scrollbar-width: thin;
    }

    .combobox-option {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--ui-color-text, oklch(0.96 0.01 260));
      border-bottom: 1px solid var(--ui-color-border-subtle, oklch(0.28 0.02 260 / 0.3));
      box-sizing: border-box;
      transition: background 100ms ease;
    }

    .combobox-option:hover,
    .combobox-option.focused {
      background: var(--ui-color-surface-hover, oklch(0.24 0.03 260));
    }

    .combobox-option.selected {
      background: color-mix(
        in oklch,
        var(--ui-color-primary, oklch(0.65 0.19 230)) 22%,
        var(--ui-color-surface-elevated, oklch(0.18 0.025 260))
      );
      color: var(--ui-color-primary-text, oklch(0.98 0.01 260));
      font-weight: 500;
    }

    .combobox-option.disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .option-label {
      line-height: 1.25;
    }

    .option-desc {
      font-size: 0.75rem;
      color: var(--ui-color-text-muted, oklch(0.65 0.02 260));
      margin-top: 2px;
    }

    .combobox-empty,
    .combobox-loading-state {
      padding: 12px;
      text-align: center;
      font-size: 0.825rem;
      color: var(--ui-color-text-muted, oklch(0.65 0.02 260));
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .inline-spinner {
      display: inline-block;
      vertical-align: middle;
      flex-shrink: 0;
    }

    .virtual-sizer {
      position: relative;
      width: 100%;
    }

    .combobox-create-option {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--ui-color-primary, oklch(0.65 0.19 230));
      border-top: 1px dashed var(--ui-color-border-subtle, oklch(0.28 0.02 260 / 0.3));
      box-sizing: border-box;
      transition: background 100ms ease;
    }

    .combobox-create-option:hover,
    .combobox-create-option.focused {
      background: var(--ui-color-surface-hover, oklch(0.24 0.03 260));
    }

    .create-icon {
      font-weight: bold;
      font-size: 1rem;
    }
  `

  override connectedCallback(): void {
    super.connectedCallback()
    window.addEventListener('click', this.#onWindowClick)
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    window.removeEventListener('click', this.#onWindowClick)
    if (this.#debounceTimer) {
      clearTimeout(this.#debounceTimer)
    }
  }

  override willUpdate(changed: PropertyValues): void {
    if (changed.has('options')) {
      if (Array.isArray(this.options)) {
        for (const opt of this.options) {
          if (opt && opt.value !== undefined) {
            this.#hydrationCache.set(String(opt.value), opt)
          }
        }
      }
    }
  }

  #onWindowClick = (e: MouseEvent): void => {
    if (!this.open) return
    const path = e.composedPath()
    if (!path.includes(this)) {
      this.open = false
      this.#searchQuery = ''
      this.requestUpdate()
    }
  }

  #toggleOpen = (): void => {
    if (this.disabled) return
    this.open = !this.open
    if (this.open) {
      this.updateComplete.then(() => {
        const input = this.shadowRoot?.querySelector<HTMLInputElement>('.combobox-search-input')
        input?.focus()
      })
    }
  }

  #onSearchInput = (e: Event): void => {
    const input = e.target as HTMLInputElement
    this.#searchQuery = input.value
    this.#focusedIndex = -1
    this.#scrollTop = 0

    if (!this.open) {
      this.open = true
    }

    if (this.remote) {
      this.page = 1
      if (this.#debounceTimer) clearTimeout(this.#debounceTimer)
      this.#debounceTimer = setTimeout(() => {
        this.dispatchEvent(
          new CustomEvent('ui-get-page', {
            bubbles: true,
            composed: true,
            detail: {
              page: 1,
              pageSize: this.pageSize || 50,
              search: this.#searchQuery,
              append: false,
            },
          }),
        )
      }, this.debounceMs || 250)
    }

    this.requestUpdate()
  }

  #hasExactMatch(): boolean {
    const q = this.#searchQuery.trim().toLowerCase()
    if (!q) return true
    return (this.options || []).some(
      (opt) => opt.label.toLowerCase() === q || String(opt.value).toLowerCase() === q,
    )
  }

  #canCreate(): boolean {
    return Boolean(this.creatable && this.#searchQuery.trim() && !this.#hasExactMatch())
  }

  #createAndSelectOption(text: string): void {
    const trimmed = text.trim()
    if (!trimmed) return
    const newOpt: ComboboxOption = { value: trimmed, label: trimmed }
    this.#hydrationCache.set(trimmed, newOpt)
    if (!this.remote) {
      this.options = [...(this.options || []), newOpt]
    }
    this.dispatchEvent(
      new CustomEvent('ui-create', {
        bubbles: true,
        composed: true,
        detail: { value: trimmed, label: trimmed },
      }),
    )
    this.#selectOption(newOpt)
  }

  #onKeyDown = (e: KeyboardEvent): void => {
    const filteredOptions = this.#getFilteredOptions()
    const canCreate = this.#canCreate()
    const totalCount = filteredOptions.length + (canCreate ? 1 : 0)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        this.#navigateFocusDown(totalCount)
        break
      case 'ArrowUp':
        e.preventDefault()
        this.#navigateFocusUp()
        break
      case 'Enter':
        e.preventDefault()
        this.#handleEnterKey(filteredOptions, canCreate)
        break
      case 'Escape':
        this.#closeDropdown()
        break
    }
  }

  #navigateFocusDown(totalCount: number): void {
    if (!this.open) {
      this.open = true
      return
    }
    this.#focusedIndex = Math.min(totalCount - 1, this.#focusedIndex + 1)
    this.requestUpdate()
  }

  #navigateFocusUp(): void {
    this.#focusedIndex = Math.max(0, this.#focusedIndex - 1)
    this.requestUpdate()
  }

  #handleEnterKey(filteredOptions: ComboboxOption[], canCreate: boolean): void {
    if (!this.open) {
      this.open = true
      return
    }
    const isCreateOptionFocused = canCreate && this.#focusedIndex === filteredOptions.length
    const hasOnlyCreateOption = canCreate && filteredOptions.length === 0

    if (isCreateOptionFocused || hasOnlyCreateOption) {
      this.#createAndSelectOption(this.#searchQuery)
      return
    }

    if (this.#focusedIndex >= 0 && this.#focusedIndex < filteredOptions.length) {
      const selected = filteredOptions[this.#focusedIndex]
      if (selected && !selected.disabled) {
        this.#selectOption(selected)
      }
    }
  }

  #closeDropdown(): void {
    this.open = false
    this.#searchQuery = ''
    this.requestUpdate()
  }

  #selectOption(option: ComboboxOption): void {
    if (option.disabled) return
    this.#hydrationCache.set(String(option.value), option)

    if (this.multiple) {
      const cur = Array.isArray(this.value) ? [...this.value] : []
      const strVal = String(option.value)
      const existsIdx = cur.findIndex((v) => String(v) === strVal)

      if (existsIdx >= 0) {
        cur.splice(existsIdx, 1)
      } else {
        cur.push(option.value)
      }
      this.value = cur
      this.#searchQuery = ''
    } else {
      this.value = option.value
      this.open = false
      this.#searchQuery = ''
    }

    this.#emitChange()
    this.requestUpdate()
  }

  #removeSelectedValue(val: string | number, e: MouseEvent): void {
    e.stopPropagation()
    if (this.disabled) return
    if (this.multiple && Array.isArray(this.value)) {
      this.value = this.value.filter((v) => String(v) !== String(val))
      this.#emitChange()
      this.requestUpdate()
    }
  }

  #emitChange(): void {
    const selectedOptions = this.#getSelectedOptions()
    this.dispatchEvent(
      new CustomEvent('ui-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value, selectedOptions },
      }),
    )
    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value, selectedOptions },
      }),
    )
  }

  #getSelectedOptions(): ComboboxOption[] {
    if (this.multiple) {
      const vals = Array.isArray(this.value) ? this.value : []
      return vals.map((v) => {
        const strV = String(v)
        return this.#hydrationCache.get(strV) || { value: v, label: strV }
      })
    }
    if (this.value !== undefined && this.value !== null && this.value !== '') {
      const singleVal = Array.isArray(this.value) ? this.value[0] : this.value
      const strV = String(singleVal)
      return [this.#hydrationCache.get(strV) || { value: singleVal, label: strV }]
    }
    return []
  }

  #getFilteredOptions(): ComboboxOption[] {
    if (this.remote || !this.#searchQuery) {
      return this.options || []
    }
    const q = this.#searchQuery.toLowerCase()
    return (this.options || []).filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        String(opt.value).toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q)),
    )
  }

  #onDropdownScroll = (e: Event): void => {
    const list = e.target as HTMLElement
    this.#scrollTop = list.scrollTop

    // Check for infinite scroll trigger when remote
    if (this.remote && !this.loading) {
      const threshold = 60
      if (list.scrollTop + list.clientHeight >= list.scrollHeight - threshold) {
        const currentCount = (this.options || []).length
        if (this.total > currentCount) {
          const nextPage = (this.page || 1) + 1
          this.page = nextPage
          this.dispatchEvent(
            new CustomEvent('ui-get-page', {
              bubbles: true,
              composed: true,
              detail: {
                page: nextPage,
                pageSize: this.pageSize || 50,
                search: this.#searchQuery,
                append: true,
              },
            }),
          )
        }
      }
    }

    if (this.#isVirtualActive()) {
      this.requestUpdate()
    }
  }

  #isVirtualActive(): boolean {
    if (!this.virtual) return false
    const threshold =
      typeof this.virtual === 'object' && this.virtual !== null && typeof this.virtual.threshold === 'number'
        ? this.virtual.threshold
        : 100
    const filtered = this.#getFilteredOptions()
    return filtered.length >= threshold
  }

  #computePlaceholder(selectedOptions: ComboboxOption[]): string {
    const singleSelected = !this.multiple && selectedOptions.length ? selectedOptions[0] : null
    if (singleSelected) return singleSelected.label
    return this.placeholder || (this.multiple ? 'Select options...' : 'Select...')
  }

  #isOptionSelected(optionValue: string | number): boolean {
    const targetValue = String(optionValue)
    if (this.multiple) {
      return Array.isArray(this.value) && this.value.some((val) => String(val) === targetValue)
    }
    return String(this.value) === targetValue
  }

  #renderSelectedChips(selectedOptions: ComboboxOption[]) {
    return selectedOptions.map(
      (opt) => html`
        <span class="chip-tag">
          <span>${opt.label}</span>
          <button
            type="button"
            class="chip-del-btn"
            title="Remove"
            @click=${(e: MouseEvent) => this.#removeSelectedValue(opt.value, e)}
          >
            ✕
          </button>
        </span>
      `,
    )
  }

  #renderVirtualOptions(virtualWindow: VirtualWindowResult<ComboboxOption>) {
    return html`
      <div class="virtual-sizer" style="height: ${virtualWindow.totalHeight}px;">
        ${virtualWindow.visibleItems.map((option, localIndex) => {
          const absoluteIndex = virtualWindow.startIndex + localIndex
          const isSelected = this.#isOptionSelected(option.value)
          const isFocused = this.#focusedIndex === absoluteIndex

          return html`
            <div
              class="combobox-option ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''} ${option.disabled ? 'disabled' : ''}"
              style="position: absolute; top: ${absoluteIndex * virtualWindow.itemHeight}px; left: 0; right: 0; height: ${virtualWindow.itemHeight}px;"
              role="option"
              aria-selected=${isSelected}
              @click=${() => this.#selectOption(option)}
            >
              <span class="option-label">${option.label}</span>
              ${option.description ? html`<span class="option-desc">${option.description}</span>` : nothing}
            </div>
          `
        })}
      </div>
    `
  }

  #renderStandardOptions(filteredOptions: ComboboxOption[], canCreate: boolean) {
    if (filteredOptions.length === 0) {
      if (canCreate) return nothing
      return html`
        <div class="combobox-empty">
          ${this.loading
            ? html`<span class="spinner inline-spinner" role="status" aria-label="Loading"></span> Loading options...`
            : 'No options found'}
        </div>
      `
    }

    return filteredOptions.map((option, index) => {
      const isSelected = this.#isOptionSelected(option.value)
      const isFocused = this.#focusedIndex === index

      return html`
        <div
          class="combobox-option ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''} ${option.disabled ? 'disabled' : ''}"
          role="option"
          aria-selected=${isSelected}
          @click=${() => this.#selectOption(option)}
        >
          <span class="option-label">${option.label}</span>
          ${option.description ? html`<span class="option-desc">${option.description}</span>` : nothing}
        </div>
      `
    })
  }

  #renderCreateOption(focusedIndexMatch: number) {
    const isFocused = this.#focusedIndex === focusedIndexMatch
    return html`
      <div
        class="combobox-create-option ${isFocused ? 'focused' : ''}"
        role="option"
        @click=${() => this.#createAndSelectOption(this.#searchQuery)}
      >
        <span class="create-icon">＋</span>
        <span>Create "${this.#searchQuery.trim()}"</span>
      </div>
    `
  }

  #renderDropdown(
    filteredOptions: ComboboxOption[],
    virtualWindow: VirtualWindowResult<ComboboxOption>,
    canCreate: boolean,
  ) {
    const viewportHeight =
      typeof this.virtual === 'object' && this.virtual !== null && typeof this.virtual.viewportHeight === 'string'
        ? this.virtual.viewportHeight
        : '240px'

    return html`
      <div class="combobox-dropdown" @click=${(e: MouseEvent) => e.stopPropagation()}>
        <div
          class="combobox-dropdown-list"
          style="max-height: ${viewportHeight};"
          role="listbox"
          @scroll=${this.#onDropdownScroll}
        >
          ${virtualWindow.isVirtual
            ? this.#renderVirtualOptions(virtualWindow)
            : this.#renderStandardOptions(filteredOptions, canCreate)}

          ${canCreate ? this.#renderCreateOption(filteredOptions.length) : nothing}

          ${this.loading && filteredOptions.length > 0
            ? html`<div class="combobox-loading-state"><span class="spinner inline-spinner" role="status" aria-label="Loading"></span> Loading more...</div>`
            : nothing}
        </div>
      </div>
    `
  }

  override render() {
    const selectedOptions = this.#getSelectedOptions()
    const filteredOptions = this.#getFilteredOptions()
    const canCreate = this.#canCreate()

    const virtualWindow = calculateVirtualWindow(
      filteredOptions,
      this.#scrollTop,
      240,
      this.virtual,
      36,
      5,
      typeof this.virtual === 'object' && this.virtual !== null && typeof this.virtual.threshold === 'number'
        ? this.virtual.threshold
        : 100,
    )

    const placeholderText = this.#computePlaceholder(selectedOptions)

    return html`
      <div
        class="combobox-container ${this.open ? 'focus' : ''} ${this.disabled ? 'disabled' : ''} ${this.loading ? 'loading' : ''} ${this.invalid ? 'invalid' : ''}"
        role="combobox"
        aria-expanded=${this.open}
        aria-haspopup="listbox"
        ?aria-busy=${this.loading}
        @click=${this.#toggleOpen}
        @keydown=${this.#onKeyDown}
      >
        ${this.multiple ? this.#renderSelectedChips(selectedOptions) : nothing}

        <input
          type="text"
          class="combobox-search-input"
          .value=${this.#searchQuery}
          placeholder=${this.multiple && selectedOptions.length ? '' : placeholderText}
          ?disabled=${this.disabled}
          @input=${this.#onSearchInput}
          @click=${(e: MouseEvent) => e.stopPropagation()}
        />

        <div class="combobox-icons">
          ${this.loading
            ? html`<span class="spinner" part="spinner" role="status" aria-label="Loading options"></span>`
            : nothing}
          <svg class="arrow-icon ${this.open ? 'open' : ''}" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        ${this.open ? this.#renderDropdown(filteredOptions, virtualWindow, canCreate) : nothing}
      </div>
    `
  }
}

if (!customElements.get(UI_TAG_NAMES.COMBOBOX)) {
  customElements.define(UI_TAG_NAMES.COMBOBOX, UICombobox)
}
