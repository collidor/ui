import { css, html, nothing, type CSSResultGroup, type PropertyDeclarations } from 'lit';
import { bool } from "../base.element.ts";
import { headerToggleIcon, UIHeaderedElement } from "../headerSurface.ts";
import { UI_TAG_NAMES } from "../constants.ts";
import { ifDefined } from "lit/directives/if-defined.js";

export class UICard extends UIHeaderedElement {
    static override properties: PropertyDeclarations = {
        ...UIHeaderedElement.properties,
        elevated: bool(),
        bordered: bool(),
    };

    static override styles: CSSResultGroup = [
        UIHeaderedElement.styles,
        css`
            :host {
                display: block;
                box-sizing: border-box;
                --ui-current-bg: var(
                    --ui-card-bg,
                    var(--ui-color-surface-elevated, oklch(0.22 0.025 260))
                );
                font-family: var(--ui-font-family, ui-sans-serif, system-ui);
            }

            :host([hidden]) {
                display: none !important;
            }

            .card {
                box-sizing: border-box;
                background: var(
                    --ui-card-bg,
                    var(--ui-color-surface-elevated, oklch(0.22 0.025 260))
                );
                color: var(--ui-card-color, var(--ui-color-text, oklch(0.96 0.01 260)));
                border: none;
                border-radius: var(--ui-card-radius, var(--ui-radius-lg, 0.382em));
                box-shadow: none;
                backdrop-filter: var(--ui-backdrop-filter, none);
                -webkit-backdrop-filter: var(--ui-backdrop-filter, none);
                overflow: hidden;
                transition:
                    border-color
                    var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                    box-shadow
                    var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                    background
                    var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
                }

                .card.bordered {
                    border: var(
                        --ui-card-border,
                        1px solid var(--ui-color-border, oklch(0.32 0.03 260))
                    );
                }

                .card.elevated {
                    box-shadow: var(
                        --ui-card-shadow,
                        var(
                            --ui-shadow-lg,
                            0 var(--ui-space-2xs, 0.382em) var(--ui-space-md, 1.618em) rgba(
                                0,
                                0,
                                0,
                                0.4
                            )
                        )
                    );
                }

                /* --- Golden Ratio Paddings --- */
                .header {
                    padding: var(--ui-space-3xs, 0.236em) var(--ui-space-xs, 0.618em);
                    background: var(
                        --ui-header-bg,
                        var(
                            --ui-card-header-bg,
                            var(--ui-color-surface, oklch(0.14 0.02 260))
                        )
                    );
                    border-bottom: var(
                        --ui-header-border,
                        var(
                            --ui-card-header-border,
                            1px solid var(
                                --ui-color-border-subtle,
                                oklch(0.32 0.03 260 / 0.5)
                            )
                        )
                    );
                    font-family: var(--ui-font-heading, inherit);
                    font-size: 0.875rem;
                    font-weight: var(--ui-font-weight-bold, 600);
                    color: var(
                        --ui-header-color,
                        var(
                            --ui-card-header-color,
                            var(--ui-color-text, oklch(0.96 0.01 260))
                        )
                    );
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .header:focus-visible {
                    outline: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
                    outline-offset: -2px;
                }

                @media (prefers-reduced-motion: reduce) {
                    .card {
                        transition: none !important;
                    }
                }

                .header:empty {
                    display: none;
                }

                .body {
                    padding: var(--ui-space-xs, 0.618em);
                    color: var(--ui-card-color, var(--ui-color-text, oklch(0.96 0.01 260)));
                    line-height: var(--ui-line-height-normal, 1.618);
                }

                .footer {
                    padding: var(--ui-space-3xs, 0.236em) var(--ui-space-xs, 0.618em);
                    background: var(
                        --ui-card-footer-bg,
                        var(--ui-color-surface, oklch(0.14 0.02 260))
                    );
                    border-top: var(
                        --ui-card-footer-border,
                        1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5))
                    );
                    font-size: 0.75rem;
                    color: var(
                        --ui-card-footer-color,
                        var(--ui-color-text-muted, oklch(0.70 0.02 260))
                    );
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: var(--ui-space-3xs, 0.236em);
                }

                .footer:empty {
                    display: none;
                }
            `,
        ];

        elevated = false;
        /** Visual default is a border when the attribute is omitted. */
        bordered = true;

        #bodyId = `card-body-${Math.random().toString(36).slice(2, 8)}`;

        protected override render(): unknown {
            const hasFooter = !!this.querySelector(':scope > [slot="footer"]');

            return html`
                <div class="card ${this.bordered
                    ? "bordered"
                    : ""} ${this.elevated ? "elevated" : ""}" part="card">
                    <div
                        class="header"
                        part="header"
                        role="${ifDefined(
                            this.collapsible ? "button" : undefined,
                        )}"
                        tabindex="${ifDefined(
                            this.collapsible ? "0" : undefined,
                        )}"
                        aria-expanded="${ifDefined(
                            this.collapsible ? (!this.collapsed) : undefined,
                        )}"
                        aria-controls="${ifDefined(
                            this.collapsible ? this.#bodyId : undefined,
                        )}"
                        @click="${this.onHeaderClick}"
                        @keydown="${this.onHeaderKeydown}"
                    >
                        <slot name="header"></slot>
                        ${headerToggleIcon(this.collapsible)}
                    </div>
                    <div id="${this.#bodyId}" class="body" part="body">
                        <slot></slot>
                    </div>
                    ${hasFooter
                        ? html`
                            <div class="footer" part="footer">
                                <slot name="footer"></slot>
                            </div>
                        `
                        : nothing}
                </div>
            `;
        }
    }

    if (!customElements.get(UI_TAG_NAMES.CARD)) {
        customElements.define(UI_TAG_NAMES.CARD, UICard);
    }

