import { css, html, nothing } from "lit";
import { bool, UIElement } from "../base.element.ts";
import { type Size, UI_TAG_NAMES, type Variant } from "../constants.ts";

export class UIButton extends UIElement {
    static properties = {
        variant: { type: String, reflect: true },
        size: { type: String, reflect: true },
        disabled: bool(),
        loading: bool(),
        iconOnly: bool("icon-only"),
        type: { type: String, reflect: true },
        ariaLabel: { type: String, attribute: "aria-label" },
    };

    static styles = css`
        :host {
            display: inline-block;
            vertical-align: middle;
            font-family: var(
                --ui-font-family-base,
                var(--ui-font-body, var(--ui-font-family, ui-sans-serif, system-ui))
            );
        }

        :host([hidden]) {
            display: none !important;
        }

        button {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            width: 100%;
            border: 1px solid transparent;
            font-family: inherit;
            font-weight: 600;
            letter-spacing: 0.015em;
            line-height: var(--ui-line-height-tight, 1.25);
            cursor: pointer;
            user-select: none;
            white-space: nowrap;
            text-decoration: none;
            transition:
                background
                var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                border-color
                var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                box-shadow
                var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                transform
                var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
            outline: none;
        }

        button:active:not(:disabled) {
            transform: translateY(1px);
        }

        button.size-sm {
            font-size: 0.8125rem;
            min-height: var(--ui-btn-min-height, 2rem);
            padding: var(--ui-btn-padding, 0.35rem 0.75rem);
            gap: 0.375rem;
            border-radius: var(--ui-btn-radius, var(--ui-radius-sm, 4px));
        }

        button.size-md {
            font-size: 0.875rem;
            min-height: var(--ui-btn-min-height, 2.375rem);
            padding: var(--ui-btn-padding, 0.5rem 1.125rem);
            gap: 0.5rem;
            border-radius: var(--ui-btn-radius, var(--ui-radius-md, 6px));
        }

        button.size-lg {
            font-size: 1rem;
            min-height: var(--ui-btn-min-height, 2.75rem);
            padding: var(--ui-btn-padding, 0.65rem 1.5rem);
            gap: 0.625rem;
            border-radius: var(--ui-btn-radius, var(--ui-radius-lg, 8px));
        }

        button.icon-only.size-sm {
            padding: 0.35rem;
            min-width: 2rem;
            min-height: var(--ui-btn-min-height, 2rem);
            aspect-ratio: 1;
        }

        button.icon-only.size-md {
            padding: 0.5rem;
            min-width: 2.375rem;
            min-height: var(--ui-btn-min-height, 2.375rem);
            aspect-ratio: 1;
        }

        button.icon-only.size-lg {
            padding: 0.65rem;
            min-width: 2.75rem;
            min-height: var(--ui-btn-min-height, 2.75rem);
            aspect-ratio: 1;
        }

        button.variant-primary {
            background-color: var(
                --ui-btn-bg,
                var(--ui-color-primary, oklch(0.65 0.19 230))
            );
            color: var(
                --ui-btn-text-color,
                var(--ui-color-primary-text, oklch(0.98 0 0))
            );
            border-color: var(
                --ui-btn-border-color,
                var(--ui-color-primary-border, transparent)
            );
            box-shadow: var(--ui-btn-shadow, none);
        }
        button.variant-primary:hover:not(:disabled) {
            background-color: var(
                --ui-btn-hover-bg,
                var(--ui-color-primary-hover, oklch(0.73 0.19 230))
            );
            border-color: var(
                --ui-btn-border-color,
                var(--ui-color-primary-hover, transparent)
            );
            color: var(
                --ui-btn-text-color,
                var(--ui-color-primary-text, oklch(0.98 0 0))
            );
        }
        button.variant-primary:active:not(:disabled) {
            background-color: var(
                --ui-btn-active-bg,
                var(--ui-color-primary-active, oklch(0.57 0.19 230))
            );
            border-color: var(
                --ui-btn-border-color,
                var(--ui-color-primary-active, transparent)
            );
            color: var(
                --ui-btn-text-color,
                var(--ui-color-primary-text, oklch(0.98 0 0))
            );
        }

        button.variant-secondary {
            background-color: var(
                --ui-btn-secondary-bg,
                var(
                    --ui-color-surface-elevated,
                    var(--ui-color-surface-raised, oklch(0.22 0.025 260))
                )
            );
            color: var(
                --ui-btn-secondary-text-color,
                var(
                    --ui-color-text-primary,
                    var(--ui-color-text, oklch(0.96 0.01 260))
                )
            );
            border-color: var(
                --ui-btn-secondary-border-color,
                var(--ui-color-border, oklch(0.32 0.03 260))
            );
            box-shadow: var(--ui-btn-shadow, none);
        }
        button.variant-secondary:hover:not(:disabled) {
            background-color: var(
                --ui-btn-secondary-hover-bg,
                var(--ui-color-surface-hover, oklch(0.28 0.03 260))
            );
            border-color: var(
                --ui-btn-secondary-border-color,
                var(--ui-color-border-hover, oklch(0.44 0.03 260))
            );
            color: var(
                --ui-btn-secondary-text-color,
                var(
                    --ui-color-text-primary,
                    var(--ui-color-text, oklch(0.96 0.01 260))
                )
            );
        }
        button.variant-secondary:active:not(:disabled) {
            background-color: var(
                --ui-btn-secondary-active-bg,
                var(--ui-color-surface-active, oklch(0.18 0.02 260))
            );
            border-color: var(
                --ui-btn-secondary-border-color,
                var(--ui-color-border, oklch(0.32 0.03 260))
            );
            color: var(
                --ui-btn-secondary-text-color,
                var(
                    --ui-color-text-primary,
                    var(--ui-color-text, oklch(0.96 0.01 260))
                )
            );
        }

        button.variant-outline {
            background-color: transparent;
            color: var(
                --ui-btn-outline-color,
                var(--ui-color-primary, oklch(0.65 0.19 230))
            );
            border-color: var(
                --ui-btn-border-color,
                var(
                    --ui-color-primary-border,
                    var(--ui-color-primary, oklch(0.65 0.19 230 / 0.45))
                )
            );
        }
        button.variant-outline:hover:not(:disabled) {
            background-color: var(
                --ui-btn-outline-hover-bg,
                var(--ui-color-primary-subtle, oklch(0.65 0.19 230 / 0.15))
            );
            border-color: var(
                --ui-btn-border-color,
                var(
                    --ui-color-primary-hover,
                    var(--ui-color-primary, oklch(0.65 0.19 230))
                )
            );
            color: var(
                --ui-btn-hover-color,
                var(
                    --ui-color-primary-hover,
                    var(--ui-color-primary, oklch(0.65 0.19 230))
                )
            );
        }
        button.variant-outline:active:not(:disabled) {
            background-color: var(
                --ui-btn-outline-active-bg,
                var(--ui-color-primary-subtle, oklch(0.65 0.19 230 / 0.25))
            );
            border-color: var(
                --ui-btn-border-color,
                var(
                    --ui-color-primary-active,
                    var(--ui-color-primary, oklch(0.65 0.19 230))
                )
            );
            color: var(
                --ui-btn-active-color,
                var(
                    --ui-color-primary-active,
                    var(--ui-color-primary, oklch(0.65 0.19 230))
                )
            );
        }

        button.variant-ghost {
            background-color: transparent;
            color: var(
                --ui-color-text-primary,
                var(--ui-color-text, oklch(0.96 0.01 260))
            );
            border-color: transparent;
        }
        button.variant-ghost:hover:not(:disabled) {
            background-color: var(--ui-color-surface-hover, oklch(0.28 0.03 260));
            color: var(
                --ui-color-text-primary,
                var(--ui-color-text, oklch(0.96 0.01 260))
            );
        }
        button.variant-ghost:active:not(:disabled) {
            background-color: var(--ui-color-surface-active, oklch(0.18 0.02 260));
            color: var(
                --ui-color-text-primary,
                var(--ui-color-text, oklch(0.96 0.01 260))
            );
        }

        button.variant-accent {
            background-color: var(--ui-color-accent, oklch(0.75 0.18 190));
            color: var(--ui-color-accent-text, oklch(0.12 0.02 260));
            border-color: var(--ui-color-accent, oklch(0.75 0.18 190));
            box-shadow: var(--ui-btn-shadow, none);
        }
        button.variant-accent:hover:not(:disabled) {
            background-color: var(--ui-color-accent-hover, oklch(0.83 0.18 190));
            border-color: var(--ui-color-accent-hover, oklch(0.83 0.18 190));
            color: var(--ui-color-accent-text, oklch(0.12 0.02 260));
        }
        button.variant-accent:active:not(:disabled) {
            background-color: var(--ui-color-accent-active, oklch(0.67 0.18 190));
            border-color: var(--ui-color-accent-active, oklch(0.67 0.18 190));
            color: var(--ui-color-accent-text, oklch(0.12 0.02 260));
        }

        button.variant-danger {
            background-color: var(--ui-color-danger, oklch(0.65 0.22 25));
            color: var(--ui-color-danger-text, oklch(0.98 0 0));
            border-color: var(--ui-color-danger, oklch(0.65 0.22 25));
            box-shadow: var(--ui-btn-shadow, none);
        }
        button.variant-danger:hover:not(:disabled) {
            background-color: var(--ui-color-danger-hover, oklch(0.73 0.22 25));
            border-color: var(--ui-color-danger-hover, oklch(0.73 0.22 25));
            color: var(--ui-color-danger-text, oklch(0.98 0 0));
        }
        button.variant-danger:active:not(:disabled) {
            background-color: var(--ui-color-danger-active, oklch(0.57 0.22 25));
            border-color: var(--ui-color-danger-active, oklch(0.57 0.22 25));
            color: var(--ui-color-danger-text, oklch(0.98 0 0));
        }

        button.variant-success {
            background-color: var(--ui-color-success, oklch(0.72 0.18 145));
            color: var(--ui-color-success-text, oklch(0.98 0 0));
            border-color: var(--ui-color-success, oklch(0.72 0.18 145));
            box-shadow: var(--ui-btn-shadow, none);
        }
        button.variant-success:hover:not(:disabled) {
            background-color: var(--ui-color-success-hover, oklch(0.8 0.18 145));
            border-color: var(--ui-color-success-hover, oklch(0.8 0.18 145));
            color: var(--ui-color-success-text, oklch(0.98 0 0));
        }
        button.variant-success:active:not(:disabled) {
            background-color: var(--ui-color-success-active, oklch(0.64 0.18 145));
            border-color: var(--ui-color-success-active, oklch(0.64 0.18 145));
            color: var(--ui-color-success-text, oklch(0.98 0 0));
        }

        button:focus-visible {
            box-shadow:
                0 0 0 2px var(--ui-color-surface, oklch(0.14 0.02 260)),
                0 0 0 4px var(--ui-color-focus-ring, oklch(0.65 0.19 230 / 0.5));
            }

            button:disabled {
                opacity: 0.45;
                cursor: not-allowed;
                pointer-events: none;
            }

            .spinner {
                width: 1em;
                height: 1em;
                border: 2px solid currentColor;
                border-right-color: transparent;
                border-radius: 50%;
                animation: spin 0.618s linear infinite;
            }

            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .spinner {
                    animation: none !important;
                }
                button {
                    transition: none !important;
                }
                button:active:not(:disabled) {
                    transform: none !important;
                }
            }

            .content {
                display: inline-flex;
                align-items: center;
                gap: inherit;
            }
        `;

        variant: Variant = "primary";
        size: Size = "md";
        disabled = false;
        loading = false;
        iconOnly = false;
        type: "button" | "submit" | "reset" | "menu" = "button";
        override ariaLabel: string | null = null;

        override focus(options?: FocusOptions): void {
            this.shadow.querySelector("button")?.focus(options);
        }

        override blur(): void {
            this.shadow.querySelector("button")?.blur();
        }

        #onClick = (event: Event): void => {
            if (this.disabled || this.loading) {
                event.stopImmediatePropagation();
                event.preventDefault();
                return;
            }
            if (this.type === "submit") {
                const form = this.closest("form");
                if (form) {
                    form.requestSubmit();
                }
            } else if (this.type === "reset") {
                const form = this.closest("form");
                if (form) {
                    form.reset();
                }
            }
        };

        override connectedCallback(): void {
            super.connectedCallback();
            this.addEventListener("click", this.#onClick);
        }

        override disconnectedCallback(): void {
            this.removeEventListener("click", this.#onClick);
            super.disconnectedCallback();
        }

        protected override render() {
            return html`
                <button
                    class="variant-${this.variant} size-${this
                        .size} ${this.iconOnly ? "icon-only" : ""}"
                    ?disabled="${this.disabled || this.loading}"
                    aria-disabled="${this.disabled || this.loading ? "true" : nothing}"
                    aria-busy="${this.loading ? "true" : nothing}"
                    aria-label="${this.ariaLabel ?? nothing}"
                    type="${this.type}"
                    part="button"
                >
                    ${this.loading
                        ? html`
                            <span class="spinner" part="spinner" role="status" aria-label="Loading"></span>
                        `
                        : nothing}
                    <slot name="prefix" part="prefix"></slot>
                    <span class="content" part="content"><slot></slot></span>
                    <slot name="suffix" part="suffix"></slot>
                </button>
            `;
        }
    }

    if (!customElements.get(UI_TAG_NAMES.BUTTON)) {
        customElements.define(UI_TAG_NAMES.BUTTON, UIButton);
    }

    declare global {
        interface HTMLElementTagNameMap {
            "ui-button": UIButton;
        }
    }
