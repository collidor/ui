import { html, css, nothing } from 'lit'
import { live } from 'lit/directives/live.js'
import { UIElement, bool } from '../base.element.ts'
import { UI_TAG_NAMES, type Size } from '../constants.ts'

export class UISelect extends UIElement {
  static properties = {
    value: { type: String, reflect: true },
    disabled: bool(),
    size: { type: String, reflect: true },
    placeholder: { type: String, reflect: true },
    label: { type: String, reflect: true },
    ariaLabel: { type: String, attribute: 'aria-label', reflect: true },
    ariaLabelledby: { type: String, attribute: 'aria-labelledby', reflect: true },
    ariaDescribedby: { type: String, attribute: 'aria-describedby', reflect: true },
    required: bool(),
    invalid: bool('invalid'),
  }

  static styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
      width: 100%;
    }

    :host([hidden]) {
      display: none !important;
    }

    /* Modern Customizable Select */
    select,
    ::picker(select) {
      appearance: base-select;
    }

    .select-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      box-sizing: border-box;
      width: 100%;
      background: var(
        --ui-input-bg,
        var(--ui-card-bg, var(--ui-color-surface-elevated, oklch(0.14 0.02 260)))
      );
      border: var(--ui-input-border, 1px solid var(--ui-color-border, oklch(0.32 0.03 260)));
      box-shadow: var(--ui-input-shadow, none);
      transition:
        border-color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
        box-shadow var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
        background var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
    }

    .select-wrapper:hover:not(.disabled) {
      border-color: var(--ui-color-border-hover, oklch(0.44 0.03 260));
    }

    .select-wrapper:focus-within:not(.disabled) {
      border-color: var(--ui-color-primary, oklch(0.65 0.19 230));
      box-shadow:
        0 0 0 1px var(--ui-color-primary, oklch(0.65 0.19 230)),
        0 0 0 4px var(--ui-color-focus-ring, oklch(0.65 0.19 230 / 0.5));
    }

    .select-wrapper.invalid {
      border-color: var(--ui-color-danger, oklch(0.65 0.22 25));
    }

    .select-wrapper.invalid:focus-within:not(.disabled) {
      border-color: var(--ui-color-danger, oklch(0.65 0.22 25));
      box-shadow:
        0 0 0 1px var(--ui-color-danger, oklch(0.65 0.22 25)),
        0 0 0 4px var(--ui-color-danger-subtle, oklch(0.65 0.22 25 / 0.3));
    }

    /* --- Golden Ratio Strict Relative Sizing & Padding --- */
    .select-wrapper.size-sm {
      font-size: 0.75rem;
      padding: var(--ui-space-4xs, 0.146em) var(--ui-space-2xs, 0.382em);
      border-radius: var(--ui-input-radius, var(--ui-radius-sm, 0.146em));
    }

    .select-wrapper.size-md {
      font-size: 0.875rem;
      padding: var(--ui-space-3xs, 0.236em) var(--ui-space-xs, 0.618em);
      border-radius: var(--ui-input-radius, var(--ui-radius-md, 0.236em));
    }

    .select-wrapper.size-lg {
      font-size: 1rem;
      padding: var(--ui-space-2xs, 0.382em) var(--ui-space-sm, 1.000em);
      border-radius: var(--ui-input-radius, var(--ui-radius-lg, 0.382em));
    }

    select {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      min-width: 0;
      flex: 1;
      border: none;
      background: transparent;
      color: var(--ui-input-color, var(--ui-color-text, oklch(0.96 0.01 260)));
      font-family: inherit;
      font-size: inherit;
      line-height: var(--ui-line-height-normal, 1.618);
      outline: none;
      cursor: pointer;
      padding: 0;
      margin: 0;
    }

    select::picker-icon {
      color: var(--ui-input-icon-color, var(--ui-color-text-muted, oklch(0.70 0.02 260)));
      font-size: 0.75em;
      margin-inline-start: auto;
      margin-left: auto;
      transition:
        transform var(--ui-transition-base, 236ms cubic-bezier(0.4, 0, 0.2, 1)),
        rotate var(--ui-transition-base, 236ms cubic-bezier(0.4, 0, 0.2, 1)),
        color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
    }

    select:open::picker-icon {
      rotate: 180deg;
      color: var(--ui-color-primary, oklch(0.65 0.19 230));
    }

    ::picker(select) {
      appearance: base-select;
      border: 1px solid var(--ui-color-border, oklch(0.32 0.03 260));
      background: var(
        --ui-color-surface-elevated,
        oklch(0.18 0.025 260)
      );
      backdrop-filter: var(--ui-backdrop-filter, blur(16px));
      border-radius: var(--ui-input-radius, var(--ui-radius-md, 0.236em));
      box-shadow: var(--ui-shadow-lg, 0 10px 25px rgba(0, 0, 0, 0.3));
      padding: var(--ui-space-4xs, 0.146em);
      margin-block: var(--ui-space-4xs, 0.146em);
      min-width: anchor-size(width);
      box-sizing: border-box;
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
      font-size: inherit;
      color: var(--ui-color-text, oklch(0.96 0.01 260));
      opacity: 0;
      transform: translateY(-4px) scale(0.98);
      transition:
        opacity var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
        transform var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
        display var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)) allow-discrete,
        overlay var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)) allow-discrete;
    }

    :open::picker(select) {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    @starting-style {
      :open::picker(select) {
        opacity: 0;
        transform: translateY(-4px) scale(0.98);
      }
    }

    option {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: var(--ui-space-3xs, 0.236em);
      padding: var(--ui-space-3xs, 0.236em) var(--ui-space-xs, 0.618em);
      border-radius: var(--ui-radius-sm, 0.146em);
      color: var(--ui-color-text, oklch(0.96 0.01 260));
      background: transparent;
      cursor: pointer;
      transition:
        background var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
        color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
    }

    option:hover,
    option:focus {
      background: var(--ui-color-surface-hover, oklch(0.28 0.03 260));
      color: var(--ui-color-text, oklch(0.98 0 0));
    }

    option:checked {
      font-weight: var(--ui-font-weight-medium, 500);
      background: var(--ui-color-primary-subtle, oklch(0.65 0.19 230 / 0.15));
      color: var(--ui-color-primary, oklch(0.65 0.19 230));
    }

    option::checkmark {
      order: 1;
      margin-inline-start: auto;
      color: var(--ui-color-primary, oklch(0.65 0.19 230));
    }

    option .icon {
      font-size: 1.25em;
      text-box: trim-both cap alphabetic;
    }

    selectedcontent .icon {
      display: none;
    }

    .disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .disabled select {
      cursor: not-allowed;
      pointer-events: none;
    }

    .hidden-slot {
      display: none !important;
    }

    @media (prefers-reduced-motion: reduce) {
      ::picker(select),
      select::picker-icon {
        transition: none !important;
      }
    }

    @supports not (appearance: base-select) {
      select {
        -webkit-appearance: none;
        appearance: none;
        padding-right: var(--ui-space-lg, 2.618em);
      }

      .fallback-chevron {
        position: absolute;
        right: var(--ui-space-3xs, 0.236em);
        pointer-events: none;
        color: var(--ui-input-color, var(--ui-color-text-muted, oklch(0.7 0.02 260)));
        font-size: 0.7em;
        display: flex;
        align-items: center;
      }

      select option {
        background-color: var(
          --ui-input-bg,
          var(--ui-color-surface-elevated, oklch(0.22 0.025 260))
        );
        color: var(--ui-input-color, var(--ui-color-text, oklch(0.96 0.01 260)));
      }
    }

    @supports (appearance: base-select) {
      .fallback-chevron {
        display: none !important;
      }
    }
  `

  value = ''
  disabled = false
  size: Size = 'md'
  placeholder = ''
  label = ''
  ariaLabel = ''
  ariaLabelledby = ''
  ariaDescribedby = ''
  required = false
  invalid = false

  override focus(options?: FocusOptions): void {
    this.renderRoot.querySelector<HTMLSelectElement>('select')?.focus(options)
  }

  #observer: MutationObserver | null = null
  #optionsRevision = 0
  #renderedRevision = -1

  #onChange = (event: Event): void => {
    event.stopPropagation()
    const select = event.currentTarget
    if (!(select instanceof HTMLSelectElement)) return
    this.value = select.value
    this.emit('ui-change', { value: this.value })
  }

  #onSlotChange = (): void => {
    this.#optionsRevision++
    this.requestUpdate()
  }

  #observeOptions(): void {
    if (!this.#observer) {
      this.#observer = new MutationObserver(() => {
        this.#optionsRevision++
        this.requestUpdate()
      })
    }
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
    })
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.#observeOptions()
  }

  protected override onConnected(): void {
    this.#observeOptions()
  }

  protected override onDisconnected(): void {
    this.#observer?.disconnect()
    this.#observer = null
  }

  #valueFromLightDom(): string {
    if (this.value) return this.value
    let firstEnabled: string | null = null
    for (const node of this.querySelectorAll('option')) {
      if (!(node instanceof HTMLOptionElement) || node.disabled) continue
      const group = node.closest('optgroup')
      if (group instanceof HTMLOptGroupElement && group.disabled) continue
      if (node.selected) return node.value
      if (firstEnabled === null) firstEnabled = node.value
    }
    if (this.placeholder || firstEnabled === null) return ''
    return firstEnabled
  }

  protected override willUpdate(): void {
    const resolved = this.#valueFromLightDom()
    if (resolved !== this.value) this.value = resolved
  }

  #copyOption(source: HTMLOptionElement, currentValue: string): HTMLOptionElement {
    const opt = document.createElement('option')
    opt.value = source.value
    opt.disabled = source.disabled
    if (source.className) opt.className = source.className
    if (source.childNodes.length > 0) {
      opt.replaceChildren(...Array.from(source.childNodes, (child) => child.cloneNode(true)))
    } else {
      opt.textContent = source.textContent
    }
    if (source.value === currentValue || (!currentValue && source.selected)) {
      opt.selected = true
    }
    return opt
  }

  #syncOptions(): void {
    const select = this.shadow.querySelector('select')
    if (!(select instanceof HTMLSelectElement)) return

    const currentValue = this.value
    select.replaceChildren()

    if (this.placeholder) {
      const phOption = document.createElement('option')
      phOption.value = ''
      phOption.disabled = true
      phOption.textContent = this.placeholder
      if (!currentValue) phOption.selected = true
      select.append(phOption)
    }

    const options = Array.from(this.querySelectorAll('option, optgroup'))
    for (const node of options) {
      if (node instanceof HTMLOptionElement) {
        if (node.closest('optgroup')) continue
        select.append(this.#copyOption(node, currentValue))
      } else if (node instanceof HTMLOptGroupElement) {
        const group = document.createElement('optgroup')
        group.label = node.label
        group.disabled = node.disabled
        for (const child of Array.from(node.querySelectorAll('option'))) {
          group.append(this.#copyOption(child, currentValue))
        }
        select.append(group)
      }
    }

    if (currentValue) select.value = currentValue
    if (select.value !== this.value) this.value = select.value
  }

  protected override updated(): void {
    if (this.#renderedRevision === this.#optionsRevision) return
    this.#renderedRevision = this.#optionsRevision
    this.#syncOptions()
  }

  protected override render() {
    const effectiveLabel = this.ariaLabel || this.label || nothing

    return html`
      <div class="select-wrapper size-${this.size} ${this.disabled ? 'disabled' : ''} ${this.invalid ? 'invalid' : ''}" part="wrapper">
        <slot name="prefix" part="prefix"></slot>
        <select
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-label=${effectiveLabel}
          aria-labelledby=${this.ariaLabelledby || nothing}
          aria-describedby=${this.ariaDescribedby || nothing}
          aria-invalid=${this.invalid ? 'true' : nothing}
          aria-required=${this.required ? 'true' : nothing}
          part="select"
          .value=${live(this.value)}
          @change=${this.#onChange}
        ></select>
        <div class="fallback-chevron" part="chevron">▼</div>
        <div class="hidden-slot"><slot @slotchange=${this.#onSlotChange}></slot></div>
      </div>
    `
  }
}

if (!customElements.get(UI_TAG_NAMES.SELECT)) {
  customElements.define(UI_TAG_NAMES.SELECT, UISelect)
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-select': UISelect
  }
}
