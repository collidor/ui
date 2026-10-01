import { css, html, nothing, type PropertyValues } from "lit";
import { bool, UIElement } from "../base.element.ts";
import { UI_TAG_NAMES } from "../constants.ts";

export type PopoverType = "auto" | "manual";
export type PopoverPlacement =
    | "bottom"
    | "bottom-start"
    | "bottom-end"
    | "top"
    | "top-start"
    | "top-end"
    | "left"
    | "left-start"
    | "left-end"
    | "right"
    | "right-start"
    | "right-end"
    | "center";

type PopoverAnchor = HTMLElement | { x: number; y: number };

export class UIPopover extends UIElement {
    static properties = {
        open: bool(),
        type: { type: String, reflect: true },
        placement: { type: String, reflect: true },
        backdrop: bool(),
        offset: { type: Number, reflect: true },
        trigger: { type: String, reflect: true },
        ariaLabel: { type: String, attribute: "aria-label" },
        ariaLabelledby: { type: String, attribute: "aria-labelledby" },
    };

    static styles = css`
        :host {
            display: contents;
        }

        .popover-surface {
            margin: 0;
            padding: 8px;
            border: 1px solid var(--ui-color-border, oklch(0.32 0.03 260));
            border-radius: var(--ui-radius-md, 0.382em);
            background: var(--ui-color-surface-elevated, oklch(0.20 0.025 260));
            color: var(--ui-color-text, oklch(0.96 0.01 260));
            box-shadow: var(--ui-shadow-xl, 0 12px 32px rgba(0, 0, 0, 0.7));
            font-family: var(--ui-font-family, ui-sans-serif, system-ui);
            box-sizing: border-box;
            min-width: 160px;
            max-width: calc(100vw - 32px);
            max-height: calc(100vh - 32px);
            overflow: auto;
            z-index: 10000;

            /* Top layer animation with allow-discrete & overlay */
            opacity: 0;
            transform: scale(0.95);
            transition-property: opacity, transform, display, overlay;
            transition-duration: 0.15s;
            transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
            transition-behavior: allow-discrete;
        }

        .popover-surface:popover-open,
        .popover-surface.\\:popover-open {
            inset: auto;
            margin: 0;
            opacity: 1;
            transform: scale(1);

            @starting-style {
                opacity: 0;
                transform: scale(0.95);
            }
        }

        /* Animated Backdrop */
        .popover-surface::backdrop {
            background-color: transparent;
            backdrop-filter: none;
            transition:
                display 0.15s allow-discrete,
                overlay 0.15s allow-discrete,
                background-color 0.15s ease;
            }

            :host([backdrop]) .popover-surface::backdrop,
            :host([backdrop]) .popover-surface:popover-open::backdrop {
                background-color: rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(2px);
            }

            .popover-surface:popover-open::backdrop {
                @starting-style {
                    background-color: rgba(0, 0, 0, 0);
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .popover-surface {
                    transform: none !important;
                    transition-duration: 0.05s;
                }
            }
        `;

        open = false;
        type: PopoverType = "auto";
        placement: PopoverPlacement = "bottom";
        backdrop = false;
        offset = 6;
        trigger = "";
        override ariaLabel: string | null = null;
        ariaLabelledby?: string;

        #anchor: PopoverAnchor | null = null;
        #positionOnOpen = false;
        #triggerEl: HTMLElement | null = null;

        #onToggle = (event: Event): void => {
            const next = (event as ToggleEvent).newState;
            if (next !== "open" && next !== "closed") return;
            const isOpen = next === "open";
            if (this.open === isOpen) return;
            this.open = isOpen;
        };

        #onTriggerClick = (event: MouseEvent): void => {
            event.stopPropagation();
            this.toggle(this.#triggerEl ?? undefined);
        };

        #bindTrigger(): void {
            this.#unbindTrigger();
            if (!this.trigger) return;
            const root = this.getRootNode() as Document | ShadowRoot;
            const el = root?.querySelector?.<HTMLElement>(this.trigger) ?? document.querySelector<HTMLElement>(this.trigger);
            if (!el) return;
            this.#triggerEl = el;
            el.addEventListener("click", this.#onTriggerClick);
        }

        #unbindTrigger(): void {
            if (!this.#triggerEl) return;
            this.#triggerEl.removeEventListener("click", this.#onTriggerClick);
            this.#triggerEl = null;
        }

        override connectedCallback(): void {
            super.connectedCallback();
            this.#bindTrigger();
        }

        protected override onConnected(): void {
            this.#bindTrigger();
        }

        protected override onDisconnected(): void {
            this.#unbindTrigger();
        }

        public anchor(elOrSelector: HTMLElement | string): this {
            if (typeof elOrSelector === "string") {
                const root = this.getRootNode() as Document | ShadowRoot;
                const found = root?.querySelector?.<HTMLElement>(elOrSelector) ?? document.querySelector<HTMLElement>(elOrSelector);
                if (found) this.#anchor = found;
            } else if (elOrSelector) {
                this.#anchor = elOrSelector;
            }
            return this;
        }

        public isOpen(): boolean {
            const popover = this.#surface();
            if (popover && typeof popover.matches === "function") {
                try {
                    if (popover.matches(":popover-open")) return true;
                } catch {
                    // Pseudo-class not supported or test environment
                }
            }
            return this.open;
        }

        public show(anchorOrPoint?: PopoverAnchor): void {
            if (anchorOrPoint) {
                this.#anchor = anchorOrPoint;
                this.#positionOnOpen = true;
            } else if (this.#anchor) {
                this.#positionOnOpen = true;
            } else if (this.trigger) {
                const root = this.getRootNode() as Document | ShadowRoot;
                const found = root?.querySelector?.<HTMLElement>(this.trigger) ?? document.querySelector<HTMLElement>(this.trigger);
                if (found) {
                    this.#anchor = found;
                    this.#positionOnOpen = true;
                }
            } else {
                this.#positionOnOpen = false;
            }

            if (this.open) {
                if (!this.hasUpdated) return;
                if (this.#positionOnOpen) this.#applyAnchor();
                this.#positionOnOpen = false;
                this.#showNative();
                this.emit("ui-popover-open", { placement: this.placement });
                return;
            }
            this.open = true;
        }

        public hide(): void {
            if (!this.open) {
                if (this.hasUpdated) this.#hideNative();
                return;
            }
            this.open = false;
        }

        public toggle(anchorOrPoint?: PopoverAnchor): void {
            if (this.isOpen()) this.hide();
            else this.show(anchorOrPoint);
        }

        public positionAtPoint(x: number, y: number, placement: PopoverPlacement = "bottom"): void {
            const el = this.#surface();
            if (!el) return;
            el.style.position = "fixed";
            el.style.inset = "auto";
            el.style.margin = "0";

            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            el.style.right = "auto";
            el.style.bottom = "auto";

            requestAnimationFrame(() => {
                const rect = el.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                let adjustedX = x;
                let adjustedY = y;

                if (placement.startsWith("top")) {
                    adjustedY = y - rect.height;
                } else if (placement.startsWith("left")) {
                    adjustedX = x - rect.width;
                } else if (placement === "center") {
                    adjustedX = x - rect.width / 2;
                    adjustedY = y - rect.height / 2;
                }

                if (placement.endsWith("-end")) {
                    adjustedX = x - rect.width;
                }

                // Flip / clamp horizontally if overflowing viewport
                if (adjustedX + rect.width > viewportWidth) {
                    adjustedX = Math.max(8, viewportWidth - rect.width - 8);
                }
                if (adjustedX < 8) {
                    adjustedX = 8;
                }

                // Flip / clamp vertically if overflowing viewport
                if (adjustedY + rect.height > viewportHeight) {
                    adjustedY = Math.max(8, viewportHeight - rect.height - 8);
                }
                if (adjustedY < 8) {
                    adjustedY = 8;
                }

                el.style.left = `${adjustedX}px`;
                el.style.top = `${adjustedY}px`;
            });
        }

        public positionAtElement(anchor: HTMLElement): void {
            const el = this.#surface();
            if (!el) return;
            const anchorRect = anchor.getBoundingClientRect();
            const offset = this.offset ?? 6;
            const placement = this.placement || "bottom";

            let x = anchorRect.left;
            let y = anchorRect.bottom + offset;

            if (placement.startsWith("top")) {
                y = anchorRect.top - offset;
            } else if (placement.startsWith("left")) {
                x = anchorRect.left - offset;
                y = anchorRect.top;
            } else if (placement.startsWith("right")) {
                x = anchorRect.right + offset;
                y = anchorRect.top;
            } else if (placement.startsWith("bottom")) {
                y = anchorRect.bottom + offset;
                x = anchorRect.left;
            }

            if (placement.endsWith("-end")) {
                x = anchorRect.right;
            } else if (placement === "center") {
                x = anchorRect.left + anchorRect.width / 2;
                y = anchorRect.top + anchorRect.height / 2;
            }

            this.positionAtPoint(x, y, placement);
        }

        protected override updated(changed: PropertyValues): void {
            super.updated(changed);
            if (changed.has("trigger") && this.hasUpdated) {
                this.#bindTrigger();
            }
            if (!changed.has("open")) return;
            const previous = changed.get("open");
            const opened = this.open && previous !== true;
            const closed = !this.open && previous === true;
            if (opened) {
                if (this.#positionOnOpen) this.#applyAnchor();
                this.#positionOnOpen = false;
                this.#showNative();
                this.emit("ui-popover-open", { placement: this.placement });
            } else if (closed) {
                this.#hideNative();
                this.emit("ui-popover-close");
            }
        }

        protected override render() {
            return html`
                <div
                    popover="${this.type}"
                    class="popover-surface"
                    part="surface"
                    role="${this.ariaLabel || this.ariaLabelledby ? 'region' : nothing}"
                    aria-label="${this.ariaLabel ?? nothing}"
                    aria-labelledby="${this.ariaLabelledby ?? nothing}"
                    @toggle="${this.#onToggle}"
                >
                    <slot></slot>
                </div>
            `;
        }

        #surface(): HTMLElement | null {
            return this.shadow.querySelector(".popover-surface");
        }

        #applyAnchor(): void {
            const anchor = this.#anchor;
            if (!anchor) return;
            if ("x" in anchor && "y" in anchor) {
                this.positionAtPoint(anchor.x, anchor.y);
                return;
            }
            this.positionAtElement(anchor);
        }

        #showNative(): void {
            const popover = this.#surface();
            if (!popover || typeof popover.showPopover !== "function") return;
            try {
                if (popover.matches(":popover-open")) return;
            } catch {
                // Pseudo-class not supported; try showPopover anyway.
            }
            try {
                popover.showPopover();
            } catch {
                // Fallback
            }
        }

        #hideNative(): void {
            const popover = this.#surface();
            if (!popover || typeof popover.hidePopover !== "function") return;
            try {
                popover.hidePopover();
            } catch {
                // Fallback
            }
        }
    }

    if (!customElements.get(UI_TAG_NAMES.POPOVER)) {
        customElements.define(UI_TAG_NAMES.POPOVER, UIPopover);
    }

    declare global {
        interface HTMLElementTagNameMap {
            "ui-popover": UIPopover;
        }
    }
