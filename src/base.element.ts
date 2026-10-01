/**
 * Base class for UI components. Lit renders the shadow tree and updates
 * only the bindings that changed. The first update is flushed during
 * connectedCallback so callers can read the shadow tree synchronously
 * after appending the element.
 */

import { LitElement, type PropertyDeclaration, type PropertyValues } from 'lit'

const booleanConverter = {
  fromAttribute(value: string | null): boolean {
    return value !== null && value !== 'false'
  },
  toAttribute(value: boolean): string | null {
    return value ? '' : null
  },
}

export function bool(attribute?: string): PropertyDeclaration {
  return {
    type: Boolean,
    reflect: true,
    converter: booleanConverter,
    ...(attribute === undefined ? {} : { attribute }),
  }
}

export abstract class UIElement extends LitElement {
  #flushing = false

  protected get shadow(): ShadowRoot {
    return this.renderRoot as ShadowRoot
  }

  override connectedCallback(): void {
    const first = !this.hasUpdated
    super.connectedCallback()
    this.#flush()
    if (!first) this.onConnected()
  }

  override requestUpdate(
    name?: PropertyKey,
    oldValue?: unknown,
    options?: PropertyDeclaration,
    useNewValue?: boolean,
    newValue?: unknown,
  ): void {
    super.requestUpdate(name, oldValue, options, useNewValue, newValue)
    if (this.isConnected && this.hasUpdated) {
      this.#flush()
    }
  }

  #flush(): void {
    if (this.#flushing || !this.isUpdatePending) return
    this.#flushing = true
    try {
      this.performUpdate()
    } finally {
      this.#flushing = false
    }
  }

  override disconnectedCallback(): void {
    this.onDisconnected()
    super.disconnectedCallback()
  }

  protected override firstUpdated(_changed: PropertyValues): void {
    this.onConnected()
  }

  protected onConnected(): void {}

  protected onDisconnected(): void {}

  protected emit<T = unknown>(
    eventName: string,
    detail?: T,
    options?: CustomEventInit<T>,
  ): boolean {
    const customEvent = new CustomEvent<T>(eventName, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail,
      ...options,
    })
    return this.dispatchEvent(customEvent)
  }

  protected getAttr(name: string, fallback = ''): string {
    return this.getAttribute(name) ?? fallback
  }

  protected getBoolAttr(name: string): boolean {
    return this.hasAttribute(name) && this.getAttribute(name) !== 'false'
  }

  protected setBoolAttr(name: string, value: boolean): void {
    if (value) {
      this.setAttribute(name, '')
    } else {
      this.removeAttribute(name)
    }
  }

  protected getNumAttr(name: string, fallback = 0): number {
    const raw = this.getAttribute(name)
    if (raw === null || raw === '') return fallback
    const parsed = parseFloat(raw)
    return Number.isNaN(parsed) ? fallback : parsed
  }

  protected setNumAttr(name: string, value: number): void {
    this.setAttribute(name, String(value))
  }
}
