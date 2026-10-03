import {
  css,
  html,
  nothing,
  type CSSResult,
  type CSSResultGroup,
  type PropertyDeclaration,
  type PropertyDeclarations,
  type TemplateResult,
} from 'lit'
import { UIElement, bool } from './base.element.ts'

export const HEADER_SURFACES = ['flat', 'raised', 'sunken', 'banner', 'accent'] as const

export type HeaderSurface = (typeof HEADER_SURFACES)[number]

const headerSurfaces: readonly string[] = HEADER_SURFACES

export const headerSurfaceProperty: PropertyDeclaration = {
  reflect: true,
  attribute: 'header-surface',
  converter: {
    fromAttribute(value: string | null): HeaderSurface | '' {
      return value !== null && headerSurfaces.includes(value) ? (value as HeaderSurface) : ''
    },
    toAttribute(value: string): string | null {
      return value ? value : null
    },
  },
}

/**
 * Sets `--ui-header-bg`, `--ui-header-color`, `--ui-header-color-muted`, and
 * `--ui-header-border` from `header-surface`. Header text should read
 * `--ui-header-color` first, and secondary header text `--ui-header-color-muted`,
 * then its own fallback, so an unset surface keeps the component's current look.
 */
export const headerSurfaceStyle: CSSResult = css`
  :host([header-surface='flat']) {
    --ui-header-bg: var(--ui-header-surface-flat-bg, var(--ui-color-surface));
    --ui-header-color: var(--ui-header-surface-flat-color, var(--ui-color-text));
    --ui-header-color-muted: var(--ui-header-surface-flat-color-muted, var(--ui-color-text-muted));
    --ui-header-border: var(
      --ui-header-surface-flat-border,
      1px solid var(--ui-color-border-subtle)
    );
  }

  :host([header-surface='raised']) {
    --ui-header-bg: var(--ui-header-surface-raised-bg, var(--ui-color-surface-raised));
    --ui-header-color: var(--ui-header-surface-raised-color, var(--ui-color-text));
    --ui-header-color-muted: var(--ui-header-surface-raised-color-muted, var(--ui-color-text-muted));
    --ui-header-border: var(
      --ui-header-surface-raised-border,
      1px solid var(--ui-color-border)
    );
  }

  :host([header-surface='sunken']) {
    --ui-header-bg: var(--ui-header-surface-sunken-bg, var(--ui-color-surface-sunken));
    --ui-header-color: var(--ui-header-surface-sunken-color, var(--ui-color-text));
    --ui-header-color-muted: var(--ui-header-surface-sunken-color-muted, var(--ui-color-text-muted));
    --ui-header-border: var(
      --ui-header-surface-sunken-border,
      1px solid var(--ui-color-border-subtle)
    );
  }

  :host([header-surface='banner']) {
    --ui-header-bg: var(--ui-header-surface-banner-bg, var(--ui-card-header-bg));
    --ui-header-color: var(--ui-header-surface-banner-color, var(--ui-card-header-color));
    --ui-header-color-muted: var(
      --ui-header-surface-banner-color-muted,
      var(--ui-header-surface-banner-color, var(--ui-card-header-color))
    );
    --ui-header-border: var(--ui-header-surface-banner-border, var(--ui-card-header-border));
  }

  :host([header-surface='accent']) {
    --ui-header-bg: var(--ui-header-surface-accent-bg, var(--ui-color-accent));
    --ui-header-color: var(
      --ui-header-surface-accent-color,
      var(--ui-color-accent-text, var(--ui-color-primary-text))
    );
    --ui-header-color-muted: var(
      --ui-header-surface-accent-color-muted,
      var(--ui-color-accent-text, var(--ui-color-primary-text))
    );
    --ui-header-border: var(--ui-header-surface-accent-border, 1px solid transparent);
  }

  :host([collapsible]) [part='header'] {
    cursor: pointer;
  }

  .ui-header-toggle {
    display: inline-flex;
    flex: none;
    margin-inline-start: var(--ui-space-3xs, 0.236em);
    font-size: 0.65rem;
    line-height: 1;
    transition: transform var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
  }

  :host([collapsed]) .ui-header-toggle {
    transform: rotate(-90deg);
  }

  :host([collapsed]) [part='body'],
  :host([collapsed]) [part='content'],
  :host([collapsed]) [part='scroll-container'],
  :host([collapsed]) [part='track'] {
    display: none !important;
  }
`

export function headerClickIgnored(event: Event): boolean {
  return event.composedPath().some((node) => {
    if (!(node instanceof Element)) return false
    return (
      node.hasAttribute('data-header-action') ||
      node.tagName === 'BUTTON' ||
      node.tagName === 'A' ||
      node.tagName === 'INPUT' ||
      node.tagName === 'SELECT' ||
      node.tagName === 'TEXTAREA'
    )
  })
}

export function headerToggleIcon(collapsible: boolean): TemplateResult | typeof nothing {
  return collapsible
    ? html`<span class="ui-header-toggle" part="collapse" aria-hidden="true">▼</span>`
    : nothing
}

export abstract class UIHeaderedElement extends UIElement {
  static override properties: PropertyDeclarations = {
    headerSurface: headerSurfaceProperty,
    collapsible: bool(),
    collapsed: bool(),
  }

  static styles: CSSResultGroup = headerSurfaceStyle

  headerSurface: HeaderSurface | '' = ''
  collapsible = false
  collapsed = false

  protected onHeaderClick = (event: Event): void => {
    if (headerClickIgnored(event)) return
    this.toggleCollapse()
  }

  protected onHeaderKeydown = (event: KeyboardEvent): void => {
    if (!this.collapsible || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    this.toggleCollapse()
  }

  public toggleCollapse(): void {
    if (!this.collapsible) return
    this.collapsed = !this.collapsed
    this.emit('ui-collapse-toggle', { collapsed: this.collapsed })
  }
}
