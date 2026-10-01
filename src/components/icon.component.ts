import { html, css, render as renderTemplate } from 'lit'
import { styleMap } from 'lit/directives/style-map.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { UIElement } from '../base.element.ts'
import { UI_TAG_NAMES } from '../constants.ts'

const ICONS: Record<string, string> = {
  play: `<path d="M5 3l14 9-14 9V3z"/>`,
  pause: `<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>`,
  stop: `<path d="M5 5h14v14H5z"/>`,
  plus: `<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>`,
  minus: `<path d="M19 13H5v-2h14v2z"/>`,
  close: `<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>`,
  check: `<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>`,
  trash: `<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>`,
  refresh: `<path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>`,
  settings: `<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>`,
  'chevron-down': `<path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>`,
  'chevron-right': `<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>`,
  'chevron-up': `<path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>`,
  'chevron-left': `<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>`,
  info: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>`,
  warning: `<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>`,
  help: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm1.07-7.75l-.9.92C12.45 11.9 12 12.5 12 14h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>`,
  grid: `<path d="M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z"/>`,
  link: `<path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>`,
  eye: `<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>`,
  'eye-off': `<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>`,
}

// styleMap only binds through a style attribute. Paint it onto a stand-in, then copy onto the host.
let hostSizeRoot: HTMLElement | undefined

function applyHostSize(host: HTMLElement, size: string): void {
  hostSizeRoot ??= document.createElement('div')
  renderTemplate(
    html`<span style=${styleMap({ width: size, height: size })}></span>`,
    hostSizeRoot,
  )
  const sized = hostSizeRoot.firstElementChild
  if (!(sized instanceof HTMLElement)) return
  host.style.width = sized.style.width
  host.style.height = sized.style.height
}

export class UIIcon extends UIElement {
  static properties = {
    name: { type: String, reflect: true },
    size: { type: String, reflect: true },
    label: { type: String, reflect: true },
    ariaLabel: { type: String, attribute: 'aria-label' },
  }

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      line-height: 1;
    }

    :host([hidden]) {
      display: none !important;
    }

    svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
      display: block;
    }
  `

  name = ''
  size = '1em'
  label?: string
  override ariaLabel: string | null = null

  override connectedCallback(): void {
    super.connectedCallback()
    this.#syncA11y()
  }

  protected override updated(): void {
    applyHostSize(this, this.size)
    this.#syncA11y()
  }

  #syncA11y(): void {
    const accessibleLabel = this.ariaLabel || this.label || this.getAttribute('aria-label')
    if (accessibleLabel) {
      if (!this.hasAttribute('role')) this.setAttribute('role', 'img')
      if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', accessibleLabel)
      this.removeAttribute('aria-hidden')
    } else if (!this.hasAttribute('role') && !this.hasAttribute('aria-label') && !this.hasAttribute('aria-labelledby')) {
      if (!this.hasAttribute('aria-hidden')) {
        this.setAttribute('aria-hidden', 'true')
      }
    }
  }

  protected override render() {
    const path = ICONS[this.name]
    const svgPath = typeof path === 'string' ? path : ''
    // The path markup is from ICONS, not the name. Parsing the whole <svg> keeps the path in the SVG namespace.
    return svgPath
      ? html`${unsafeHTML(`<svg viewBox="0 0 24 24" part="svg" aria-hidden="true" focusable="false">${svgPath}</svg>`)}`
      : html`<slot></slot>`
  }
}

if (!customElements.get(UI_TAG_NAMES.ICON)) {
  customElements.define(UI_TAG_NAMES.ICON, UIIcon)
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-icon': UIIcon
  }
}
