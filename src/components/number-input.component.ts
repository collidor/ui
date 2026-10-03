import { css, html, nothing, type PropertyValues, type CSSResultGroup, type PropertyDeclarations } from 'lit';
import { live } from "lit/directives/live.js";
import { bool, UIElement } from "../base.element.ts";
import { type Size, UI_TAG_NAMES } from "../constants.ts";

export class UINumberInput extends UIElement {
    static override properties: PropertyDeclarations = {
        value: { type: Number, reflect: true },
        min: { type: Number, reflect: true, useDefault: true },
        max: { type: Number, reflect: true, useDefault: true },
        step: { type: Number, reflect: true },
        precision: { type: Number, reflect: true },
        disabled: bool(),
        size: { type: String, reflect: true },
        label: { type: String, reflect: true },
        ariaLabel: { type: String, attribute: "aria-label", reflect: true },
        ariaLabelledby: { type: String, attribute: "aria-labelledby", reflect: true },
        ariaDescribedby: { type: String, attribute: "aria-describedby", reflect: true },
        required: bool(),
        invalid: bool("invalid"),
    };

    static override styles: CSSResultGroup = css`
        :host {
            display: inline-block;
            vertical-align: middle;
            font-family: var(--ui-font-family, ui-sans-serif, system-ui);
            width: 100%;
        }

        :host([hidden]) {
            display: none !important;
        }

        .number-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            box-sizing: border-box;
            width: 100%;
            background: var(
                --ui-input-bg,
                var(
                    --ui-card-bg,
                    var(--ui-color-surface-elevated, oklch(0.14 0.02 260))
                )
            );
            border: var(
                --ui-input-border,
                1px solid var(--ui-color-border, oklch(0.32 0.03 260))
            );
            box-shadow: var(--ui-input-shadow, none);
            transition:
                border-color
                var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                box-shadow
                var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                background
                var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
            }

            .number-wrapper:hover:not(.disabled) {
                border-color: var(--ui-color-border-hover, oklch(0.44 0.03 260));
            }

            .number-wrapper:focus-within:not(.disabled) {
                border-color: var(--ui-color-primary, oklch(0.65 0.19 230));
                box-shadow:
                    0 0 0 1px var(--ui-color-primary, oklch(0.65 0.19 230)),
                    0 0 0 4px var(--ui-color-focus-ring, oklch(0.65 0.19 230 / 0.5));
            }

            .number-wrapper.invalid {
                border-color: var(--ui-color-danger, oklch(0.65 0.22 25));
            }

            .number-wrapper.invalid:focus-within:not(.disabled) {
                border-color: var(--ui-color-danger, oklch(0.65 0.22 25));
                box-shadow:
                    0 0 0 1px var(--ui-color-danger, oklch(0.65 0.22 25)),
                    0 0 0 4px var(--ui-color-danger-subtle, oklch(0.65 0.22 25 / 0.3));
            }

                /* --- Golden Ratio Sizing --- */
                .number-wrapper.size-sm {
                    font-size: 0.75rem;
                    padding: var(--ui-space-4xs, 0.146em) var(--ui-space-2xs, 0.382em);
                    gap: var(--ui-space-4xs, 0.146em);
                    border-radius: var(--ui-input-radius, var(--ui-radius-sm, 0.146em));
                }

                .number-wrapper.size-md {
                    font-size: 0.875rem;
                    padding: var(--ui-space-3xs, 0.236em) var(--ui-space-xs, 0.618em);
                    gap: var(--ui-space-3xs, 0.236em);
                    border-radius: var(--ui-input-radius, var(--ui-radius-md, 0.236em));
                }

                .number-wrapper.size-lg {
                    font-size: 1rem;
                    padding: var(--ui-space-2xs, 0.382em) var(--ui-space-sm, 1.000em);
                    gap: var(--ui-space-2xs, 0.382em);
                    border-radius: var(--ui-input-radius, var(--ui-radius-lg, 0.382em));
                }

                input {
                    flex: 1;
                    width: 100%;
                    min-width: 0;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: var(
                        --ui-input-color,
                        var(--ui-color-text, oklch(0.96 0.01 260))
                    );
                    font-family: var(--ui-font-mono, monospace);
                    font-size: inherit;
                    line-height: var(--ui-line-height-normal, 1.618);
                    padding: 0;
                    margin: 0;
                    -moz-appearance: textfield;
                }

                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }

                .steppers {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    gap: 0;
                    margin-inline-start: var(--ui-space-4xs, 0.146em);
                    padding-inline: var(--ui-space-4xs, 0.146em);
                }

                .step-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    color: var(
                        --ui-input-stepper-color,
                        var(--ui-color-text-muted, oklch(0.70 0.02 260))
                    );
                    cursor: pointer;
                    padding: 0;
                    font-size: 0.55em;
                    line-height: 1;
                    user-select: none;
                    transition:
                        color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                        transform
                        var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
                    }

                    .step-btn:hover:not(:disabled) {
                        color: var(--ui-color-primary, oklch(0.65 0.19 230));
                        transform: scale(1.25);
                    }

                    .step-btn:active:not(:disabled) {
                        color: var(--ui-color-primary-active, oklch(0.57 0.19 230));
                        transform: scale(0.95);
                    }

                    .disabled {
                        opacity: 0.45;
                        cursor: not-allowed;
                    }

                    .disabled input,
                    .disabled .step-btn {
                        cursor: not-allowed;
                        pointer-events: none;
                    }
                `;

                value = 0;
                min = -Infinity;
                max = Infinity;
                step = 1;
                precision: number | null = null;
                disabled = false;
                size: Size = "md";
                label = "";
                ariaLabel = "";
                ariaLabelledby = "";
                ariaDescribedby = "";
                required = false;
                invalid = false;

                override focus(options?: FocusOptions): void {
                    this.renderRoot.querySelector<HTMLInputElement>('input[type="number"]')?.focus(options);
                }

                stepUp(): void {
                    if (this.disabled) return;
                    this.value = this.#clamp(this.value + this.step);
                    this.#emitChange();
                }

                stepDown(): void {
                    if (this.disabled) return;
                    this.value = this.#clamp(this.value - this.step);
                    this.#emitChange();
                }

                #clamp(val: number): number {
                    const numeric =
                        typeof val === "number" && !Number.isNaN(val) ? val : 0;
                    let result = Math.min(
                        this.max,
                        Math.max(this.min, numeric),
                    );
                    if (Number.isNaN(result)) return 0;
                    if (this.precision != null) {
                        result = parseFloat(result.toFixed(this.precision));
                    }
                    return result;
                }

                #format(val: number): string {
                    const clamped = this.#clamp(val);
                    if (this.precision != null) {
                        return clamped.toFixed(this.precision);
                    }
                    return String(clamped);
                }

                #emitChange(): void {
                    const value = this.value;
                    this.emit("ui-input", { value });
                    this.emit("ui-change", { value });
                }

                #onInput = (event: Event): void => {
                    event.stopPropagation();
                    const input = event.currentTarget;
                    if (!(input instanceof HTMLInputElement)) return;
                    const parsed = parseFloat(input.value);
                    if (Number.isNaN(parsed)) return;
                    this.value = parsed;
                    this.emit("ui-input", { value: this.value });
                };

                #onChange = (event: Event): void => {
                    event.stopPropagation();
                    const input = event.currentTarget;
                    if (!(input instanceof HTMLInputElement)) return;
                    const parsed = parseFloat(input.value);
                    this.value = Number.isNaN(parsed) ? 0 : parsed;
                    this.#emitChange();
                };

                #onKeydown = (event: KeyboardEvent): void => {
                    if (event.key === "ArrowUp") {
                        event.preventDefault();
                        this.stepUp();
                    } else if (event.key === "ArrowDown") {
                        event.preventDefault();
                        this.stepDown();
                    }
                };

                #onStepUp = (event: Event): void => {
                    event.preventDefault();
                    event.stopPropagation();
                    this.stepUp();
                };

                #onStepDown = (event: Event): void => {
                    event.preventDefault();
                    event.stopPropagation();
                    this.stepDown();
                };

                protected override willUpdate(
                    changed: PropertyValues<this>,
                ): void {
                    if (
                        changed.has("value") ||
                        changed.has("min") ||
                        changed.has("max") ||
                        changed.has("precision")
                    ) {
                        const clamped = this.#clamp(this.value);
                        if (clamped !== this.value) this.value = clamped;
                    }
                }

                protected override updated(): void {
                    if (this.precision == null) return;
                    const formatted = this.#format(this.value);
                    if (this.getAttribute("value") !== formatted) {
                        this.setAttribute("value", formatted);
                    }
                }

                protected override render(): unknown {
                    const effectiveLabel = this.ariaLabel || this.label || nothing;

                    return html`
                        <div class="number-wrapper size-${this
                            .size} ${this.disabled
                            ? "disabled"
                            : ""} ${this.invalid ? "invalid" : ""}" part="wrapper">
                            <slot name="prefix" part="prefix"></slot>
                            <input
                                type="number"
                                min="${Number.isFinite(this.min) ? this.min : nothing}"
                                max="${Number.isFinite(this.max) ? this.max : nothing}"
                                step="${this.step}"
                                .value="${live(this.#format(this.value))}"
                                ?disabled="${this.disabled}"
                                ?required="${this.required}"
                                aria-label="${effectiveLabel}"
                                aria-labelledby="${this.ariaLabelledby || nothing}"
                                aria-describedby="${this.ariaDescribedby || nothing}"
                                aria-invalid="${this.invalid ? "true" : nothing}"
                                aria-required="${this.required ? "true" : nothing}"
                                part="input"
                                @input="${this.#onInput}"
                                @change="${this.#onChange}"
                                @keydown="${this.#onKeydown}"
                            />
                            <div class="steppers" part="steppers">
                                <button
                                    class="step-btn btn-up"
                                    type="button"
                                    aria-label="Increment"
                                    ?disabled="${this.disabled}"
                                    part="step-up"
                                    @click="${this.#onStepUp}"
                                >
                                    ▲
                                </button>
                                <button
                                    class="step-btn btn-down"
                                    type="button"
                                    aria-label="Decrement"
                                    ?disabled="${this.disabled}"
                                    part="step-down"
                                    @click="${this.#onStepDown}"
                                >
                                    ▼
                                </button>
                            </div>
                            <slot name="suffix" part="suffix"></slot>
                        </div>
                    `;
                }
            }

            if (!customElements.get(UI_TAG_NAMES.NUMBER_INPUT)) {
                customElements.define(UI_TAG_NAMES.NUMBER_INPUT, UINumberInput);
            }

