import { html, nothing, render as litRender, unsafeCSS, type CSSResultGroup, type PropertyDeclarations } from 'lit'
import { UIElement, adoptLightStyles, bool } from '../base.element.ts'
import { UI_TAG_NAMES } from '../constants.ts'

let nextFieldUid = 0

const CONTROL_SELECTOR =
  'input, select, textarea, button, ui-input, ui-select, ui-combobox, ui-number-input, ui-slider, ui-switch'

const FIELD_LIGHT_STYLES = `
ui-field {
  display: flex;
  flex-direction: column;
  gap: var(--ui-space-3xs, 0.236em);
  margin-block-end: var(--ui-space-xs, 0.618em);
  font-family: var(--ui-font-family, ui-sans-serif, system-ui);
  width: 100%;
  box-sizing: border-box;
}

ui-field[hidden] {
  display: none !important;
}

ui-field[orientation='horizontal'] {
  display: grid;
  grid-template-columns: minmax(100px, auto) minmax(0, 1fr);
  column-gap: var(--ui-space-xs, 0.618em);
  row-gap: var(--ui-space-4xs, 0.146em);
  align-items: center;
}

ui-field[orientation='horizontal']:has(> .ui-field-label-host:empty) {
  grid-template-columns: minmax(0, 1fr);
}

ui-field[orientation='horizontal'] > .ui-field-label-host {
  grid-column: 1;
  grid-row: 1;
}

ui-field[orientation='horizontal'] > :not([data-ui-field-chrome]) {
  grid-column: 2;
}

ui-field[orientation='horizontal']:has(> .ui-field-label-host:empty) > :not([data-ui-field-chrome]),
ui-field[orientation='horizontal']:has(> .ui-field-label-host:empty) > .ui-field-message-host {
  grid-column: 1;
}

ui-field[orientation='horizontal'] > .ui-field-message-host {
  grid-column: 2;
}

ui-field > .ui-field-label-host:empty,
ui-field > .ui-field-message-host:empty {
  display: none;
}

ui-field > .ui-field-label-host .label-wrapper {
  display: inline-flex;
  align-items: center;
  gap: var(--ui-space-4xs, 0.146em);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ui-color-text-muted, oklch(0.70 0.02 260));
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
  user-select: none;
}

ui-field > .ui-field-label-host .required-star {
  color: var(--ui-color-danger, oklch(0.65 0.22 25));
}

ui-field > .ui-field-message-host .message {
  font-size: 0.75rem;
  line-height: var(--ui-line-height-tight, 1.236);
}

ui-field > .ui-field-message-host .helper-text {
  color: var(--ui-color-text-subtle, oklch(0.55 0.02 260));
}

ui-field > .ui-field-message-host .error-text {
  color: var(--ui-color-danger, oklch(0.65 0.22 25));
  font-weight: 500;
}

ui-field > .ui-field-label-host .field-spinner {
  display: inline-block;
  width: 11px;
  height: 11px;
  border: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
  border-right-color: transparent;
  border-radius: 50%;
  animation: ui-field-spin 600ms linear infinite;
  vertical-align: middle;
  box-sizing: border-box;
  flex-shrink: 0;
  margin-left: var(--ui-space-4xs, 0.146em);
}

@keyframes ui-field-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  ui-field > .ui-field-label-host .field-spinner {
    animation-duration: 1.5s;
  }
}
`

export class UIField extends UIElement {
  static override properties: PropertyDeclarations = {
    label: { type: String, reflect: true },
    helper: { type: String, reflect: true },
    error: { type: String, reflect: true },
    required: bool(),
    loading: bool(),
    orientation: { type: String, reflect: true },
  }

  static override styles: CSSResultGroup = unsafeCSS(FIELD_LIGHT_STYLES)

  label = ''
  helper = ''
  error = ''
  required = false
  loading = false
  orientation: 'vertical' | 'horizontal' = 'vertical'

  readonly #uid = ++nextFieldUid
  #labelHost: HTMLDivElement | null = null
  #messageHost: HTMLDivElement | null = null
  #customLabelNodes: Element[] = []
  #observer: MutationObserver | null = null
  #managedAriaLabel: string | null = null

  get #messageId(): string {
    return `ui-field-msg-${this.#uid}`
  }

  #withObserverPaused(fn: () => void): void {
    fn()
    this.#observer?.takeRecords()
  }

  #ensureLabelHost(): HTMLDivElement {
    if (!this.#labelHost) {
      this.#labelHost = document.createElement('div')
      this.#labelHost.className = 'ui-field-label-host'
      this.#labelHost.setAttribute('data-ui-field-chrome', 'label')
    }
    if (this.#labelHost.parentNode !== this || this.firstElementChild !== this.#labelHost) {
      this.#withObserverPaused(() => {
        this.insertBefore(this.#labelHost!, this.firstChild)
      })
    }
    return this.#labelHost
  }

  #ensureMessageHost(): HTMLDivElement {
    if (!this.#messageHost) {
      this.#messageHost = document.createElement('div')
      this.#messageHost.className = 'ui-field-message-host'
      this.#messageHost.setAttribute('data-ui-field-chrome', 'message')
    }
    if (this.#messageHost.parentNode !== this || this.lastElementChild !== this.#messageHost) {
      this.#withObserverPaused(() => {
        this.appendChild(this.#messageHost!)
      })
    }
    return this.#messageHost
  }

  #captureCustomLabelNodes(): boolean {
    let changed = false
    this.#withObserverPaused(() => {
      for (const child of Array.from(this.children)) {
        if (child.hasAttribute('data-ui-field-chrome')) continue
        if (child.getAttribute('slot') === 'label') {
          child.removeAttribute('slot')
          child.remove()
          this.#customLabelNodes.push(child)
          changed = true
        }
      }
    })
    return changed
  }

  protected override createRenderRoot(): HTMLElement {
    return this.#ensureLabelHost()
  }

  override connectedCallback(): void {
    adoptLightStyles(this, 'ui-field', FIELD_LIGHT_STYLES)
    this.#captureCustomLabelNodes()
    this.#ensureLabelHost()
    this.#ensureMessageHost()
    super.connectedCallback()

    if (!this.#observer && typeof MutationObserver !== 'undefined') {
      this.#observer = new MutationObserver(() => {
        const captured = this.#captureCustomLabelNodes()
        this.#ensureLabelHost()
        this.#ensureMessageHost()
        if (captured) {
          this.requestUpdate()
        } else {
          this.#syncControl()
        }
      })
      this.#observer.observe(this, { childList: true })
    }
  }

  override disconnectedCallback(): void {
    this.#observer?.disconnect()
    this.#observer = null
    super.disconnectedCallback()
  }

  #findControl(): HTMLElement | null {
    for (const el of Array.from(this.children)) {
      if (!(el instanceof HTMLElement) || el.hasAttribute('data-ui-field-chrome')) continue
      if (el.getAttribute('slot') === 'label') continue
      if (el.matches(CONTROL_SELECTOR)) return el
      const inner = el.querySelector<HTMLElement>(CONTROL_SELECTOR)
      if (inner) return inner
    }
    return null
  }

  #isNativeFormControl(el: HTMLElement): boolean {
    const tag = el.tagName
    return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA'
  }

  #syncControl(): void {
    const control = this.#findControl()
    const labelEl = this.#labelHost?.querySelector('label')
    if (!control) {
      labelEl?.removeAttribute('for')
      return
    }

    const isNative = this.#isNativeFormControl(control)
    if (isNative) {
      if (!control.id) {
        control.id = `ui-field-ctrl-${this.#uid}`
      }
      labelEl?.setAttribute('for', control.id)
    } else {
      labelEl?.removeAttribute('for')
    }

    // For custom controls (which render their native input inside their own shadow root),
    // sync aria-label cleanly without overriding consumer-supplied labels.
    if (!isNative) {
      const currentAriaLabel = control.getAttribute('aria-label')
      const ownsAriaLabel = currentAriaLabel === null || currentAriaLabel === this.#managedAriaLabel
      if (this.label && !control.getAttribute('label') && ownsAriaLabel) {
        control.setAttribute('aria-label', this.label)
        this.#managedAriaLabel = this.label
      } else if (!this.label && currentAriaLabel !== null && currentAriaLabel === this.#managedAriaLabel) {
        control.removeAttribute('aria-label')
        this.#managedAriaLabel = null
      }
    }

    if (this.required) {
      control.setAttribute('aria-required', 'true')
      if ('required' in control) {
        try {
          ;(control as unknown as { required: boolean }).required = true
        } catch {}
      }
    } else {
      if (control.getAttribute('aria-required') === 'true') {
        control.removeAttribute('aria-required')
      }
      if ('required' in control) {
        try {
          ;(control as unknown as { required: boolean }).required = false
        } catch {}
      }
    }

    if (this.error) {
      control.setAttribute('aria-invalid', 'true')
      if ('invalid' in control) {
        try {
          ;(control as unknown as { invalid: boolean }).invalid = true
        } catch {}
      }
    } else {
      control.removeAttribute('aria-invalid')
      if ('invalid' in control) {
        try {
          ;(control as unknown as { invalid: boolean }).invalid = false
        } catch {}
      }
    }

    // Native Light DOM aria-describedby linkage for native form controls (same root)
    if (isNative) {
      const hasMessage = Boolean(this.error || this.helper)
      const msgId = this.#messageId
      const existing = (control.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter((t) => t && t !== msgId)
      if (hasMessage) {
        existing.push(msgId)
      }
      if (existing.length > 0) {
        control.setAttribute('aria-describedby', existing.join(' '))
      } else {
        control.removeAttribute('aria-describedby')
      }
    }
  }

  #onLabelClick = (event: MouseEvent): void => {
    const control = this.#findControl()
    if (!control) return
    if (!this.#isNativeFormControl(control)) {
      event.preventDefault()
      control.focus()
    }
  }

  #renderMessages() {
    if (this.error) {
      return html`<div id=${this.#messageId} class="message error-text" role="alert">${this.error}</div>`
    }
    if (this.helper) {
      return html`<div id=${this.#messageId} class="message helper-text">${this.helper}</div>`
    }
    return nothing
  }

  protected override updated(): void {
    if (this.loading) {
      this.setAttribute('aria-busy', 'true')
    } else {
      this.removeAttribute('aria-busy')
    }
    litRender(this.#renderMessages(), this.#ensureMessageHost())
    this.#syncControl()
  }

  protected override render(): unknown {
    const hasCustomLabel = this.#customLabelNodes.length > 0
    if (this.label || hasCustomLabel) {
      return html`<label class="label-wrapper" @click=${this.#onLabelClick}>
        ${hasCustomLabel ? this.#customLabelNodes : this.label}
        ${this.required ? html`<span class="required-star" aria-hidden="true">*</span>` : nothing}
        ${this.loading
          ? html`<span class="field-spinner" role="status" aria-label="Loading ${this.label || 'field'}"></span>`
          : nothing}
      </label>`
    }
    if (this.loading) {
      return html`<span class="field-spinner" role="status" aria-label="Loading"></span>`
    }
    return nothing
  }
}

if (!customElements.get(UI_TAG_NAMES.FIELD)) {
  customElements.define(UI_TAG_NAMES.FIELD, UIField)
}
