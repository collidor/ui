import { html, css, nothing, type PropertyValues, type CSSResultGroup, type PropertyDeclarations } from 'lit'
import { UIElement, bool } from '../base.element.ts'
import { UI_TAG_NAMES } from '../constants.ts'

export class UIStep extends UIElement {
  static override properties: PropertyDeclarations = {
    step: { type: Number, reflect: true },
    label: { type: String, reflect: true },
    description: { type: String, reflect: true },
    active: bool(),
    completed: bool(),
    disabled: bool(),
  }

  static override styles: CSSResultGroup = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--ui-space-2xs, 0.382em);
      cursor: pointer;
      user-select: none;
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
      position: relative;
      padding: var(--ui-space-3xs, 0.236em) var(--ui-space-xs, 0.618em);
      border-radius: var(--ui-radius-sm, 6px);
      transition: background 146ms ease, color 146ms ease;
      outline: none;
    }

    :host(:focus-visible) {
      outline: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
      outline-offset: 2px;
    }

    :host([disabled]) {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }

    :host(:hover:not([disabled])) {
      background: var(--ui-color-surface-hover, oklch(0.2 0.02 260));
    }

    .step-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: var(--ui-radius-full, 9999px);
      font-size: 0.75rem;
      font-weight: 700;
      background: var(--ui-color-surface, oklch(0.18 0.02 260));
      border: 1px solid var(--ui-color-border, oklch(0.3 0.02 260));
      color: var(--ui-color-text-muted, oklch(0.7 0.02 260));
      flex-shrink: 0;
      transition: all 146ms ease;
    }

    :host([active]) .step-badge {
      background: var(--ui-color-primary, oklch(0.65 0.19 230));
      border-color: var(--ui-color-primary, oklch(0.65 0.19 230));
      color: #ffffff;
      box-shadow: 0 0 10px var(--ui-color-primary-subtle, oklch(0.65 0.19 230 / 0.4));
    }

    :host([completed]) .step-badge {
      background: var(--ui-color-success, oklch(0.68 0.18 145));
      border-color: var(--ui-color-success, oklch(0.68 0.18 145));
      color: #ffffff;
    }

    .step-text {
      display: flex;
      flex-direction: column;
      text-align: left;
    }

    .step-label {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--ui-color-text-muted, oklch(0.7 0.02 260));
      transition: color 146ms ease;
    }

    :host([active]) .step-label {
      color: var(--ui-color-primary, oklch(0.75 0.18 230));
    }

    :host([completed]) .step-label {
      color: var(--ui-color-text, oklch(0.95 0 0));
    }

    .step-desc {
      font-size: 0.72rem;
      color: var(--ui-color-text-subtle, oklch(0.55 0.02 260));
    }
  `

  step = 1
  label = ''
  description = ''
  active = false
  completed = false
  disabled = false

  #onClick = (event: Event): void => {
    if (this.disabled) {
      event.preventDefault()
      return
    }
    this.emit('step-selected', { step: this.step })
  }

  #onKeydown = (event: KeyboardEvent): void => {
    if (this.disabled) return
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      this.emit('step-selected', { step: this.step })
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'tab')
    this.#syncAria()
    this.addEventListener('click', this.#onClick)
    this.addEventListener('keydown', this.#onKeydown)
  }

  override disconnectedCallback(): void {
    this.removeEventListener('click', this.#onClick)
    this.removeEventListener('keydown', this.#onKeydown)
    super.disconnectedCallback()
  }

  protected override updated(): void {
    this.#syncAria()
  }

  #syncAria(): void {
    this.setAttribute('tabindex', this.disabled ? '-1' : this.active ? '0' : '-1')
    this.setAttribute('aria-selected', String(this.active))
    if (this.active) {
      this.setAttribute('aria-current', 'step')
    } else {
      this.removeAttribute('aria-current')
    }
    if (this.disabled) {
      this.setAttribute('aria-disabled', 'true')
    } else {
      this.removeAttribute('aria-disabled')
    }
  }

  protected override render(): unknown {
    return html`
      <div class="step-badge" part="badge">
        ${this.completed ? '✓' : this.step}
      </div>
      <div class="step-text" part="text">
        <span class="step-label" part="label">${this.label || `Step ${this.step}`}</span>
        ${this.description ? html`<span class="step-desc" part="description">${this.description}</span>` : nothing}
      </div>
    `
  }
}

export class UIStepper extends UIElement {
  static override properties: PropertyDeclarations = {
    activeStep: { type: Number, attribute: 'active-step', reflect: true },
    orientation: { type: String, reflect: true },
  }

  static override styles: CSSResultGroup = css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--ui-space-xs, 0.618em);
      box-sizing: border-box;
      width: 100%;
      overflow-x: auto;
      padding: var(--ui-space-3xs, 0.236em) 0;
      border-bottom: 1px solid var(--ui-color-border-subtle, oklch(0.24 0.02 260));
    }

    :host([orientation='vertical']) {
      flex-direction: column;
      align-items: stretch;
      border-bottom: none;
      border-right: 1px solid var(--ui-color-border-subtle, oklch(0.24 0.02 260));
    }

    :host([hidden]) {
      display: none !important;
    }
  `

  activeStep = 0
  orientation: 'horizontal' | 'vertical' = 'horizontal'

  #onStepSelected = (event: Event): void => {
    const detail = (event as CustomEvent<{ step?: number }>).detail
    if (detail?.step === undefined) return
    const steps = Array.from(this.querySelectorAll<UIStep>(UI_TAG_NAMES.STEP))
    const index = steps.findIndex((s) => s.step === detail.step)
    const targetIdx = index !== -1 ? index : detail.step
    this.activeStep = targetIdx
    this.#updateSteps()
    this.emit('ui-change', { activeStep: this.activeStep })
  }

  #onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return
    const steps = Array.from(this.querySelectorAll<UIStep>(UI_TAG_NAMES.STEP)).filter((s) => !s.disabled)
    if (!steps.length) return

    const activeEl = (this.getRootNode() as Document | ShadowRoot).activeElement
    const currentIndex = steps.findIndex((s) => s === activeEl || s.shadowRoot?.activeElement === activeEl)
    if (currentIndex === -1) return

    let nextIndex = currentIndex
    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % steps.length
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + steps.length) % steps.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = steps.length - 1
    }

    if (nextIndex !== currentIndex && steps[nextIndex]) {
      event.preventDefault()
      const nextStep = steps[nextIndex]
      nextStep.focus()
      this.activeStep = nextIndex
      this.#updateSteps()
      this.emit('ui-change', { activeStep: this.activeStep })
    }
  }

  #onSlotChange = (): void => {
    this.#updateSteps()
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'tablist')
    this.setAttribute('aria-orientation', this.orientation)
    this.addEventListener('step-selected', this.#onStepSelected)
    this.addEventListener('keydown', this.#onKeydown)
  }

  override disconnectedCallback(): void {
    this.removeEventListener('step-selected', this.#onStepSelected)
    this.removeEventListener('keydown', this.#onKeydown)
    super.disconnectedCallback()
  }

  protected override onConnected(): void {
    this.#updateSteps()
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('activeStep')) {
      this.#updateSteps()
    }
    if (changed.has('orientation')) {
      this.setAttribute('aria-orientation', this.orientation)
    }
  }

  #updateSteps(): void {
    const steps = this.querySelectorAll<UIStep>(UI_TAG_NAMES.STEP)
    const current = this.activeStep
    steps.forEach((stepEl, idx) => {
      stepEl.active = idx === current
      stepEl.completed = idx < current
      if (!stepEl.hasAttribute('step')) {
        stepEl.step = idx + 1
      }
    })
  }

  protected override render(): unknown {
    return html`<slot @slotchange=${this.#onSlotChange}></slot>`
  }
}

if (!customElements.get(UI_TAG_NAMES.STEP)) {
  customElements.define(UI_TAG_NAMES.STEP, UIStep)
}
if (!customElements.get(UI_TAG_NAMES.STEPPER)) {
  customElements.define(UI_TAG_NAMES.STEPPER, UIStepper)
}
