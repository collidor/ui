import { html, css, nothing } from 'lit'
import { bool } from '../base.element.ts'
import { UIHeaderedElement } from '../headerSurface.ts'
import { UI_TAG_NAMES, type Size, type Variant } from '../constants.ts'

export class UIStatCard extends UIHeaderedElement {
  static properties = {
    ...UIHeaderedElement.properties,
    title: { type: String, reflect: true },
    subtitle: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    bordered: bool(),
    elevated: bool(),
    dense: bool(),
    stacked: bool(),
  }

  static styles = [UIHeaderedElement.styles, css`
    :host {
      display: block;
      box-sizing: border-box;
      font-family: var(--ui-font-family, ui-sans-serif, system-ui);
      --ui-current-bg: var(--ui-card-bg, var(--ui-color-surface-elevated, oklch(0.22 0.025 260)));
      width: 100%;
    }

    :host([hidden]) {
      display: none !important;
    }

    .stat-card-root {
      position: relative;
      box-sizing: border-box;
      background: var(
        --ui-stat-card-bg,
        var(--ui-card-bg, var(--ui-color-surface-elevated, oklch(0.22 0.025 260)))
      );
      color: var(
        --ui-stat-card-color,
        var(--ui-card-color, var(--ui-color-text, oklch(0.96 0.01 260)))
      );
      border: var(
        --ui-stat-card-border,
        1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.7))
      );
      border-radius: var(--ui-stat-card-radius, var(--ui-radius-md, 0.236em));
      box-shadow: none;
      transition:
        border-color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
        box-shadow var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
      display: flex;
      flex-direction: column;
    }

    :host([stacked]) .stat-card-root {
      border-radius: 0;
    }

    :host([elevated]) .stat-card-root {
      box-shadow: var(--ui-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.25));
    }

    /* --- Header Banner --- */
    .stat-header {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      padding: var(--ui-space-4xs, 0.146em) var(--ui-space-xs, 0.618em);
      background: var(
        --ui-header-bg,
        var(--ui-stat-header-bg, var(--ui-card-header-bg, var(--ui-color-surface, oklch(0.16 0.025 260))))
      );
      border-bottom: var(--ui-header-border, 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5)));
      color: var(
        --ui-header-color,
        var(--ui-stat-header-color, var(--ui-card-header-color, var(--ui-color-text, oklch(0.96 0.01 260))))
      );
      user-select: none;
      cursor: default;
      border-top-left-radius: inherit;
      border-top-right-radius: inherit;
    }

    :host([collapsible]) .stat-header {
      cursor: pointer;
    }

    :host([collapsible]) .stat-header:focus-visible {
      outline: 2px solid var(--ui-color-focus, oklch(0.7 0.15 250));
      outline-offset: -2px;
    }

    @media (prefers-reduced-motion: reduce) {
      .stat-card-root {
        transition: none !important;
      }
    }

    .header-title-container {
      display: flex;
      align-items: baseline;
      gap: var(--ui-space-3xs, 0.236em);
      text-align: center;
    }

    .stat-title {
      font-family: var(--ui-font-heading, inherit);
      font-size: 0.825rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(
        --ui-header-color,
        var(
          --ui-stat-title-color,
          var(
            --ui-stat-header-color,
            var(--ui-card-header-color, var(--ui-color-text, oklch(0.96 0.01 260)))
          )
        )
      );
    }

    .stat-card-root.dense .stat-title {
      font-size: 0.75rem;
    }

    .stat-subtitle {
      font-size: 0.68rem;
      font-weight: 400;
      letter-spacing: normal;
      text-transform: none;
      color: var(
        --ui-header-color-muted,
        var(--ui-stat-subtitle-color, var(--ui-color-text-muted, oklch(0.7 0.02 260)))
      );
    }

    .header-actions {
      position: absolute;
      right: var(--ui-space-xs, 0.618em);
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      gap: var(--ui-space-4xs, 0.146em);
    }

    .collapse-icon {
      font-size: 0.65rem;
      transition: transform var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
      transform: rotate(0deg);
    }

    :host([collapsed]) .collapse-icon {
      transform: rotate(-90deg);
    }

    /* --- Body & Content --- */
    .stat-body {
      padding: var(--ui-space-xs, 0.618em);
      display: flex;
      flex-direction: column;
      gap: var(--ui-space-3xs, 0.236em);
    }

    .stat-card-root.dense .stat-body {
      padding: var(--ui-space-3xs, 0.236em);
      gap: var(--ui-space-4xs, 0.146em);
    }

    :host([collapsed]) .stat-body {
      display: none;
    }

    /* --- Sub-Section Header (within body) --- */
    ::slotted([slot='sub-header']),
    .sub-header {
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--ui-font-heading, inherit);
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: var(--ui-space-4xs, 0.146em) 0;
      border-top: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.4));
      border-bottom: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.4));
      margin: var(--ui-space-4xs, 0.146em) 0;
      color: var(--ui-color-text-muted, oklch(0.8 0.02 260));
      background: var(--ui-color-surface-hover, oklch(0.24 0.025 260 / 0.5));
    }

    /* --- Sizing Variations --- */
    .stat-card-root.size-sm {
      font-size: 0.75rem;
    }
    .stat-card-root.size-sm .stat-title {
      font-size: 0.75rem;
    }
    .stat-card-root.size-lg .stat-title {
      font-size: 0.95rem;
    }

    /* --- Footer --- */
    .stat-footer {
      padding: var(--ui-space-4xs, 0.146em) var(--ui-space-xs, 0.618em);
      border-top: 1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.4));
      font-size: 0.72rem;
      color: var(--ui-color-text-muted, oklch(0.7 0.02 260));
    }

    .stat-footer:empty {
      display: none;
    }
  `]

  title = ''
  subtitle = ''
  variant: Variant = 'neutral'
  size: Size = 'md'
  bordered = false
  elevated = false
  dense = false
  stacked = false
  #bodyId = `stat-body-${Math.random().toString(36).slice(2, 9)}`

  protected override render() {
    return html`
      <div class=${`stat-card-root size-${this.size}${this.dense ? ' dense' : ''}`} part="root">
        ${this.title || this.subtitle
          ? html`<div
              class="stat-header"
              part="header"
              role=${this.collapsible ? 'button' : nothing}
              tabindex=${this.collapsible ? '0' : nothing}
              aria-expanded=${this.collapsible ? String(!this.collapsed) : nothing}
              aria-controls=${this.collapsible ? this.#bodyId : nothing}
              @click=${this.onHeaderClick}
              @keydown=${this.onHeaderKeydown}
            >
              <slot name="header">
                <div class="header-title-container">
                  <span class="stat-title" part="title">${this.title}</span>
                  ${this.subtitle
                    ? html`<span class="stat-subtitle" part="subtitle">${this.subtitle}</span>`
                    : nothing}
                </div>
              </slot>
              <div class="header-actions">
                <span data-header-action><slot name="actions"></slot></span>
                ${this.collapsible ? html`<span class="collapse-icon" aria-hidden="true">▼</span>` : nothing}
              </div>
            </div>`
          : nothing}

        <div
          id=${this.#bodyId}
          class="stat-body"
          role="region"
          aria-label=${this.title ? `${this.title} content` : 'Statistics'}
          style=${`display: ${this.collapsed ? 'none' : 'flex'}`}
          part="body"
        >
          <slot></slot>
        </div>

        <div class="stat-footer" part="footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `
  }
}

if (!customElements.get(UI_TAG_NAMES.STAT_CARD)) {
  customElements.define(UI_TAG_NAMES.STAT_CARD, UIStatCard)
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-stat-card': UIStatCard
  }
}
