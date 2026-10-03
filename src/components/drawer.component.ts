import { css, html, nothing, type PropertyValues, type CSSResultGroup, type PropertyDeclarations } from 'lit';
import { bool } from "../base.element.ts";
import { headerToggleIcon, UIHeaderedElement } from "../headerSurface.ts";
import { UI_TAG_NAMES } from "../constants.ts";
import { ifDefined } from "lit/directives/if-defined.js";

export type DrawerPlacement = "left" | "right" | "top" | "bottom";

let drawerIdCounter = 0;

export class UIDrawer extends UIHeaderedElement {
    static override properties: PropertyDeclarations = {
        ...UIHeaderedElement.properties,
        open: bool(),
        placement: { type: String, reflect: true },
        title: { type: String, reflect: true },
        size: { type: String, reflect: true },
        closable: bool(),
    };

    static override styles: CSSResultGroup = [
        UIHeaderedElement.styles,
        css`
            :host {
                display: contents;
            }

            .drawer-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                z-index: 10000;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.25s ease;
            }

            :host([open]) .drawer-backdrop {
                opacity: 1;
                pointer-events: auto;
            }

            .drawer-panel {
                position: fixed;
                z-index: 10001;
                display: flex;
                flex-direction: column;
                box-sizing: border-box;
                background: var(
                    --ui-card-bg,
                    var(--ui-color-surface-elevated, oklch(0.22 0.025 260))
                );
                color: var(--ui-color-text, oklch(0.96 0.01 260));
                box-shadow: var(--ui-shadow-lg, 0 10px 30px rgba(0, 0, 0, 0.7));
                font-family: var(--ui-font-family, ui-sans-serif, system-ui);
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            /* Placement Variants */
            .drawer-panel.placement-right {
                top: 0;
                right: 0;
                bottom: 0;
                width: min(100vw, var(--ui-drawer-size, 380px));
                border-left: 1px solid var(--ui-color-border, oklch(0.32 0.03 260));
                transform: translateX(100%);
            }

            :host([open]) .drawer-panel.placement-right {
                transform: translateX(0);
            }

            .drawer-panel.placement-left {
                top: 0;
                left: 0;
                bottom: 0;
                width: min(100vw, var(--ui-drawer-size, 380px));
                border-right: 1px solid var(--ui-color-border, oklch(0.32 0.03 260));
                transform: translateX(-100%);
            }

            :host([open]) .drawer-panel.placement-left {
                transform: translateX(0);
            }

            .drawer-panel.placement-top {
                top: 0;
                left: 0;
                right: 0;
                height: min(100vh, var(--ui-drawer-size, 380px));
                border-bottom: 1px solid var(--ui-color-border, oklch(0.32 0.03 260));
                transform: translateY(-100%);
            }

            :host([open]) .drawer-panel.placement-top {
                transform: translateY(0);
            }

            .drawer-panel.placement-bottom {
                bottom: 0;
                left: 0;
                right: 0;
                height: min(100vh, var(--ui-drawer-size, 380px));
                border-top: 1px solid var(--ui-color-border, oklch(0.32 0.03 260));
                transform: translateY(100%);
            }

            :host([open]) .drawer-panel.placement-bottom {
                transform: translateY(0);
            }

            .drawer-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--ui-space-sm, 1.000em);
                background: var(--ui-header-bg, transparent);
                border-bottom: var(
                    --ui-header-border,
                    1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5))
                );
                color: var(
                    --ui-header-color,
                    var(--ui-color-text, oklch(0.96 0.01 260))
                );
                font-family: var(--ui-font-heading, inherit);
            }

            .drawer-title {
                font-size: 1.1rem;
                font-weight: 700;
                color: inherit;
            }

            .drawer-close-btn {
                background: transparent;
                border: none;
                color: var(
                    --ui-header-color-muted,
                    var(--ui-color-text-muted, oklch(0.70 0.02 260))
                );
                font-size: 1.25rem;
                cursor: pointer;
                padding: 4px;
                border-radius: var(--ui-radius-sm, 0.146em);
                line-height: 1;
            }

            .drawer-close-btn:hover {
                color: var(
                    --ui-header-color,
                    var(--ui-color-text, oklch(0.96 0.01 260))
                );
                background: var(--ui-color-surface-hover, oklch(0.26 0.025 260));
            }

            .drawer-close-btn:focus-visible {
                outline: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
                outline-offset: -2px;
            }

            @media (prefers-reduced-motion: reduce) {
                .drawer-backdrop,
                .drawer-panel {
                    transition: none !important;
                }
            }

            .drawer-body {
                flex: 1;
                overflow-y: auto;
                padding: var(--ui-space-sm, 1.000em);
                box-sizing: border-box;
            }

            .drawer-footer {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: var(--ui-space-xs, 0.618em);
                padding: var(--ui-space-sm, 1.000em);
                border-top: 1px solid
                    var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
                background: var(--ui-color-surface, oklch(0.14 0.02 260));
            }

            .drawer-footer:empty {
                display: none;
            }
        `,
    ];

    open = false;
    placement: DrawerPlacement = "right";
    title = "";
    size = "md";
    closable = true;

    #titleId = `ui-drawer-title-${++drawerIdCounter}`;
    #triggerElement: HTMLElement | null = null;
    #backdropPointerDown = false;

    #getFocusableElements(): HTMLElement[] {
        const panel = this.shadow.querySelector(".drawer-panel") as HTMLElement | null;
        if (!panel) return [];
        const selector =
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), ui-button, ui-input, ui-select, ui-number-input, ui-slider, ui-switch, ui-chip[selectable]';
        const shadowFocusable = Array.from(panel.querySelectorAll<HTMLElement>(selector));
        const slottedFocusable: HTMLElement[] = [];
        const slots = panel.querySelectorAll("slot");
        slots.forEach((slot) => {
            slot.assignedElements({ flatten: true }).forEach((el) => {
                if (el instanceof HTMLElement) {
                    if (el.matches(selector)) slottedFocusable.push(el);
                    slottedFocusable.push(...Array.from(el.querySelectorAll<HTMLElement>(selector)));
                }
            });
        });
        return [...shadowFocusable, ...slottedFocusable].filter((el) => {
            return el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0;
        });
    }

    #onBackdropPointerDown = (event: PointerEvent): void => {
        if (event.target === event.currentTarget) {
            this.#backdropPointerDown = true;
        }
    };

    #onBackdropClick = (event: MouseEvent): void => {
        if (this.#backdropPointerDown && event.target === event.currentTarget) {
            this.close();
        }
        this.#backdropPointerDown = false;
    };

    #onKeyDown = (event: KeyboardEvent): void => {
        if (!this.open) return;

        if (event.key === "Escape") {
            event.preventDefault();
            this.close();
            return;
        }

        if (event.key === "Tab") {
            const panel = this.shadow.querySelector(".drawer-panel") as HTMLElement | null;
            if (!panel) return;
            const focusable = this.#getFocusableElements();
            if (!focusable.length) {
                event.preventDefault();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = (this.getRootNode() as Document | ShadowRoot).activeElement;

            if (event.shiftKey) {
                if (active === first || !panel.contains(active)) {
                    event.preventDefault();
                    last.focus();
                }
            } else {
                if (active === last || !panel.contains(active)) {
                    event.preventDefault();
                    first.focus();
                }
            }
        }
    };

    public show(): void {
        this.#triggerElement = document.activeElement as HTMLElement | null;
        this.open = true;
        this.emit("ui-drawer-open", {});
    }

    public close(): void {
        this.open = false;
        this.emit("ui-drawer-close", {});
        if (this.#triggerElement) {
            this.#triggerElement.focus();
            this.#triggerElement = null;
        }
    }

    public toggle(): void {
        if (this.open) this.close();
        else this.show();
    }

    protected override onConnected(): void {
        window.addEventListener("keydown", this.#onKeyDown);
    }

    protected override onDisconnected(): void {
        window.removeEventListener("keydown", this.#onKeyDown);
    }

    protected override willUpdate(): void {
        this.style.setProperty("--ui-drawer-size", drawerSize(this.size));
    }

    protected override updated(changed: PropertyValues): void {
        super.updated(changed);
        if (!changed.has("open")) return;
        if (this.open) {
            if (!this.#triggerElement) {
                this.#triggerElement = document.activeElement as HTMLElement | null;
            }
            requestAnimationFrame(() => {
                const closeBtn = this.shadow.querySelector<HTMLElement>(".drawer-close-btn");
                if (closeBtn) {
                    closeBtn.focus();
                } else {
                    const focusable = this.#getFocusableElements();
                    if (focusable[0]) focusable[0].focus();
                }
            });
        } else {
            if (this.#triggerElement) {
                this.#triggerElement.focus();
                this.#triggerElement = null;
            }
        }
    }

    protected override render(): unknown {
        return html`
            <div
                class="drawer-backdrop"
                part="backdrop"
                aria-hidden="true"
                @pointerdown="${this.#onBackdropPointerDown}"
                @click="${this.#onBackdropClick}"
            >
            </div>
            <div
                class="drawer-panel placement-${this.placement}"
                part="panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="${this.#titleId}"
            >
                <div
                    class="drawer-header"
                    part="header"
                    role="${ifDefined(this.collapsible ? "button" : undefined)}"
                    tabindex="${ifDefined(this.collapsible ? "0" : undefined)}"
                    aria-expanded="${ifDefined(
                        this.collapsible ? !this.collapsed : undefined,
                    )}"
                    @click="${this.onHeaderClick}"
                    @keydown="${this.onHeaderKeydown}"
                >
                    <slot name="title">
                        <span id="${this.#titleId}" class="drawer-title">${this.title}</span>
                    </slot>
                    ${headerToggleIcon(this.collapsible)} ${this.closable
                        ? html`
                            <button
                                type="button"
                                class="drawer-close-btn"
                                title="Close"
                                aria-label="Close"
                                part="close-button"
                                data-header-action
                                @click="${this.close}"
                            >
                                ✕
                            </button>
                        `
                        : nothing}
                </div>
                <div class="drawer-body" part="body">
                    <slot></slot>
                </div>
                <div class="drawer-footer" part="footer">
                    <slot name="footer"></slot>
                </div>
            </div>
        `;
    }
}

function drawerSize(size: string): string {
    if (size === "sm") return "260px";
    if (size === "lg") return "560px";
    if (size === "md") return "380px";
    return size;
}

if (!customElements.get(UI_TAG_NAMES.DRAWER)) {
    customElements.define(UI_TAG_NAMES.DRAWER, UIDrawer);
}

