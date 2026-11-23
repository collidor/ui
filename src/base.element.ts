/**
 * Base class for UI components. Lit renders the shadow tree and updates
 * only the bindings that changed. The first update is flushed during
 * connectedCallback so callers can read the shadow tree synchronously
 * after appending the element.
 */

import { LitElement, type PropertyDeclaration, type PropertyValues } from 'lit'
import type { UIEventListener } from './events.ts'

const booleanConverter = {
  fromAttribute(value: string | null): boolean {
    return value !== null && value !== 'false'
  },
  toAttribute(value: boolean): string | null {
    return value ? '' : null
  },
}

const lightStyleCache = new WeakMap<Document, Map<string, CSSStyleSheet>>()

/**
 * Adopts or injects a deduplicated stylesheet into a host element's root node
 * (Document or ShadowRoot) for Light DOM components.
 */
export function adoptLightStyles(host: HTMLElement, id: string, cssText: string): void {
  const root = host.getRootNode()
  const ownerDoc = host.ownerDocument || document
  const target = root instanceof Document || root instanceof ShadowRoot ? root : ownerDoc

  if (
    'adoptedStyleSheets' in target &&
    typeof CSSStyleSheet !== 'undefined' &&
    typeof CSSStyleSheet.prototype.replaceSync === 'function'
  ) {
    const sheetDoc = target instanceof Document ? target : target.ownerDocument || ownerDoc
    let docMap = lightStyleCache.get(sheetDoc)
    if (!docMap) {
      docMap = new Map()
      lightStyleCache.set(sheetDoc, docMap)
    }
    let sheet = docMap.get(id)
    if (!sheet) {
      const SheetCtor = sheetDoc.defaultView?.CSSStyleSheet ?? CSSStyleSheet
      sheet = new SheetCtor()
      sheet.replaceSync(cssText)
      docMap.set(id, sheet)
    }
    try {
      if (!target.adoptedStyleSheets.includes(sheet)) {
        target.adoptedStyleSheets = [...target.adoptedStyleSheets, sheet]
      }
      return
    } catch {
      // Fall through to <style> injection when adoptedStyleSheets is read-only
    }
  }

  const container = target instanceof Document ? target.head || target.documentElement : target
  if (!container) return
  if (container.querySelector(`style[data-ui-light-style="${id}"]`)) return
  const styleDoc = target instanceof Document ? target : target.ownerDocument || ownerDoc
  const styleEl = styleDoc.createElement('style')
  styleEl.setAttribute('data-ui-light-style', id)
  styleEl.textContent = cssText
  container.appendChild(styleEl)
}

export function bool(attribute?: string): PropertyDeclaration {
  return {
    type: Boolean,
    reflect: true,
    converter: booleanConverter,
    ...(attribute === undefined ? {} : { attribute }),
  }
}

export abstract class UIElement<
  EventMap extends { [K in keyof EventMap]: CustomEvent<unknown> } = Record<
    never,
    CustomEvent<unknown>
  >,
> extends LitElement {
  #flushing = false

  override addEventListener<K extends keyof EventMap & string>(
    type: K,
    listener: UIEventListener<EventMap[K]>,
    options?: boolean | AddEventListenerOptions,
  ): void
  override addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: this, ev: HTMLElementEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void
  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void
  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    if (!listener) return
    super.addEventListener(type, listener, options)
  }

  override removeEventListener<K extends keyof EventMap & string>(
    type: K,
    listener: UIEventListener<EventMap[K]>,
    options?: boolean | EventListenerOptions,
  ): void
  override removeEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: this, ev: HTMLElementEventMap[K]) => unknown,
    options?: boolean | EventListenerOptions,
  ): void
  override removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void
  override removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void {
    if (!listener) return
    super.removeEventListener(type, listener, options)
  }

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

  protected emit<K extends keyof EventMap & string>(
    eventName: K,
    detail: EventMap[K]['detail'],
    options?: Omit<CustomEventInit, 'detail'>,
  ): boolean {
    const customEvent = new CustomEvent(eventName, {
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
