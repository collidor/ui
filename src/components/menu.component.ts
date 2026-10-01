import { css, html, nothing, type PropertyValues } from "lit";
import { bool, UIElement } from "../base.element.ts";
import { UI_TAG_NAMES } from "../constants.ts";

export class UIMenuDivider extends UIElement {
    static styles = css`
        :host {
            display: block;
            height: 1px;
            margin: 4px 0;
            background: var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
        }
    `;

    override connectedCallback(): void {
        super.connectedCallback();
        this.setAttribute("role", "separator");
    }

    protected override render() {
        return nothing;
    }
}

if (!customElements.get(UI_TAG_NAMES.MENU_DIVIDER)) {
    customElements.define(UI_TAG_NAMES.MENU_DIVIDER, UIMenuDivider);
}

export class UIMenuItem extends UIElement {
    static properties = {
        value: { type: String, reflect: true },
        disabled: bool(),
        icon: { type: String, reflect: true },
        shortcut: { type: String, reflect: true },
        danger: bool(),
    };

    static styles = css`
        :host {
            display: flex;
            align-items: center;
            gap: var(--ui-space-3xs, 0.236em);
            padding: 6px var(--ui-space-xs, 0.618em);
            border-radius: var(--ui-radius-sm, 0.146em);
            font-family: var(--ui-font-family, ui-sans-serif, system-ui);
            font-size: 0.8rem;
            color: var(--ui-color-text, oklch(0.96 0.01 260));
            cursor: pointer;
            user-select: none;
            box-sizing: border-box;
            transition: background-color var(--ui-transition-fast, 0.15s ease);
            outline: none;
        }

        :host(:focus-visible) {
            outline: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
            outline-offset: -2px;
            background: var(--ui-color-surface-hover, oklch(0.26 0.025 260));
        }

        @media (prefers-reduced-motion: reduce) {
            :host {
                transition: none !important;
            }
        }

        :host([danger]) {
            color: var(--ui-color-danger, oklch(0.65 0.22 25));
        }

        :host([disabled]) {
            opacity: 0.4;
            cursor: not-allowed;
            pointer-events: none;
        }

        :host(:hover:not([disabled])) {
            background: var(--ui-color-surface-hover, oklch(0.26 0.025 260));
        }

        :host([danger]:hover:not([disabled])) {
            background: var(--ui-color-danger-subtle, oklch(0.25 0.1 25));
        }

        .menu-item-icon {
            font-size: 0.9rem;
            line-height: 1;
        }

        .menu-item-label {
            flex: 1;
            display: flex;
            align-items: center;
        }

        .menu-item-shortcut {
            font-size: 0.7rem;
            color: var(--ui-color-text-muted, oklch(0.70 0.02 260));
            font-family: var(--ui-font-mono, monospace);
            margin-left: var(--ui-space-sm, 1.000em);
        }
    `;

    value = "";
    disabled = false;
    danger = false;
    icon = "";
    shortcut = "";

    #syncAria(): void {
        this.setAttribute("role", "menuitem");
        if (this.disabled) {
            this.setAttribute("aria-disabled", "true");
            this.setAttribute("tabindex", "-1");
        } else {
            this.removeAttribute("aria-disabled");
            if (!this.hasAttribute("tabindex")) {
                this.setAttribute("tabindex", "-1");
            }
        }
        if (this.shortcut) {
            this.setAttribute("aria-keyshortcuts", this.shortcut);
        }
    }

    override connectedCallback(): void {
        super.connectedCallback();
        this.#syncAria();
    }

    protected override updated(): void {
        this.#syncAria();
    }

    protected override render() {
        return html`
            ${this.icon
                ? html`
                    <span class="menu-item-icon" aria-hidden="true" part="icon">${this.icon}</span>
                `
                : nothing}
            <span class="menu-item-label" part="label"><slot></slot></span>
            ${this.shortcut
                ? html`
                    <span class="menu-item-shortcut" aria-hidden="true" part="shortcut">${this
                        .shortcut}</span>
                `
                : nothing}
        `;
    }
}

if (!customElements.get(UI_TAG_NAMES.MENU_ITEM)) {
    customElements.define(UI_TAG_NAMES.MENU_ITEM, UIMenuItem);
}

export class UIMenu extends UIElement {
    static properties = {
        open: bool(),
        trigger: { type: String, reflect: true },
        dropdown: bool(),
    };

    static styles = css`
        :host {
            display: inline-block;
            position: relative;
        }

        :host([hidden]) {
            display: none !important;
        }

        .menu-panel {
            margin: 0;
            padding: 4px;
            min-width: 160px;
            background: var(
                --ui-card-bg,
                var(--ui-color-surface-elevated, oklch(0.22 0.025 260))
            );
            color: var(--ui-color-text, oklch(0.96 0.01 260));
            border: 1px solid var(--ui-color-border, oklch(0.32 0.03 260));
            border-radius: var(--ui-radius-sm, 0.146em);
            box-shadow: var(--ui-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.6));
            box-sizing: border-box;
            z-index: 10000;
        }

        .menu-panel:popover-open {
            inset: auto;
            margin: 0;
        }
    `;

    open = false;
    trigger = "";
    dropdown = false;

    #x: number | undefined;
    #y: number | undefined;
    #hasPoint = false;
    #isPopup = false;

    #triggerElement: HTMLElement | null = null;
    #triggerEl: HTMLElement | null = null;

    get isDropdown(): boolean {
        return Boolean(this.trigger || this.dropdown || this.#isPopup || this.#hasPoint);
    }

    #getItems(): UIMenuItem[] {
        return Array.from(this.querySelectorAll<UIMenuItem>(UI_TAG_NAMES.MENU_ITEM)).filter((i) => !i.disabled);
    }

    #onItemClick = (event: Event): void => {
        const item = menuItemFromEvent(event);
        if (!item || !this.contains(item)) return;
        event.stopPropagation();
        if (item.disabled) return;
        this.emit("ui-menu-select", { value: item.value, item });
        if (this.isDropdown) {
            this.close();
        }
    };

    #onPointerDown = (event: PointerEvent): void => {
        if (!this.open || !this.isDropdown) return;
        if (!event.composedPath().includes(this)) this.close();
    };

    #onKeyDown = (event: KeyboardEvent): void => {
        if (!this.open) return;

        if (event.key === "Escape") {
            event.preventDefault();
            this.close();
            return;
        }

        const items = this.#getItems();
        if (!items.length) return;

        const activeEl = (this.getRootNode() as Document | ShadowRoot).activeElement;
        const currentIndex = items.findIndex((item) => item === activeEl || item.shadowRoot?.activeElement === activeEl);

        let nextIndex = currentIndex;
        if (event.key === "ArrowDown") {
            event.preventDefault();
            nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % items.length;
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            nextIndex = currentIndex === -1 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
        } else if (event.key === "Home") {
            event.preventDefault();
            nextIndex = 0;
        } else if (event.key === "End") {
            event.preventDefault();
            nextIndex = items.length - 1;
        } else if (event.key === "Enter" || event.key === " ") {
            if (currentIndex !== -1 && items[currentIndex]) {
                event.preventDefault();
                const item = items[currentIndex];
                this.emit("ui-menu-select", { value: item.value, item });
                this.close();
            }
            return;
        } else if (event.key === "Tab") {
            this.close();
            return;
        }

        if (nextIndex !== currentIndex && items[nextIndex]) {
            items.forEach((item, idx) => {
                item.setAttribute("tabindex", idx === nextIndex ? "0" : "-1");
            });
            items[nextIndex].focus();
        }
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

    #onTriggerClick = (event: MouseEvent): void => {
        event.stopPropagation();
        this.toggle();
    };

    override connectedCallback(): void {
        super.connectedCallback();
        this.#bindTrigger();
    }

    public show(x?: number, y?: number): void {
        this.#isPopup = true;
        if (!this.#triggerElement) {
            const active = (this.getRootNode() as Document | ShadowRoot).activeElement;
            if (active instanceof HTMLElement) this.#triggerElement = active;
        }
        if (x !== undefined && y !== undefined) {
            this.#x = x;
            this.#y = y;
            this.#hasPoint = true;
        }
        if (this.open) {
            this.#syncPanel(true);
            return;
        }
        this.open = true;
    }

    public close(): void {
        if (!this.isDropdown) return;
        if (!this.open) {
            this.#syncPanel(false);
            return;
        }
        this.open = false;
        if (this.#triggerElement) {
            this.#triggerElement.focus();
            this.#triggerElement = null;
        } else if (this.#triggerEl) {
            this.#triggerEl.focus();
        }
    }

    public toggle(): void {
        if (this.open) this.close();
        else this.show();
    }

    protected override onConnected(): void {
        this.#bindTrigger();
        this.addEventListener("click", this.#onItemClick);
        window.addEventListener("pointerdown", this.#onPointerDown);
        window.addEventListener("keydown", this.#onKeyDown);
    }

    protected override onDisconnected(): void {
        this.#unbindTrigger();
        this.removeEventListener("click", this.#onItemClick);
        window.removeEventListener("pointerdown", this.#onPointerDown);
        window.removeEventListener("keydown", this.#onKeyDown);
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
            this.#syncPanel(true);
            requestAnimationFrame(() => {
                const items = this.#getItems();
                if (items.length > 0) {
                    items.forEach((item, idx) => {
                        item.setAttribute("tabindex", idx === 0 ? "0" : "-1");
                    });
                    items[0].focus();
                }
            });
        } else if (closed) {
            this.#syncPanel(false);
        }
    }

    protected override render() {
        if (this.isDropdown) {
            return html`
                <div
                    popover="manual"
                    class="menu-panel menu-panel--dropdown"
                    part="panel"
                    role="menu"
                    aria-orientation="vertical"
                    tabindex="-1"
                >
                    <slot></slot>
                </div>
            `;
        }

        return html`
            <div
                class="menu-panel menu-panel--inline"
                part="panel"
                role="menu"
                aria-orientation="vertical"
                tabindex="-1"
            >
                <slot></slot>
            </div>
        `;
    }

    #positionAtTrigger(): void {
        const panel = this.shadow.querySelector(".menu-panel") as HTMLElement | null;
        const trigger = this.#triggerElement ?? this.#triggerEl;
        if (!panel || !trigger) return;
        const rect = trigger.getBoundingClientRect();
        panel.style.position = "fixed";
        panel.style.inset = "auto";
        panel.style.margin = "0";
        panel.style.left = `${rect.left}px`;
        panel.style.top = `${rect.bottom + 4}px`;
    }

    #syncPanel(open: boolean): void {
        if (!this.isDropdown) return;
        const panel = this.shadow.querySelector(".menu-panel") as HTMLElement | null;
        if (!panel) return;
        if (open) {
            panel.style.position = "fixed";
            panel.style.inset = "auto";
            panel.style.margin = "0";
            if (this.#hasPoint && this.#x !== undefined && this.#y !== undefined) {
                panel.style.left = `${this.#x}px`;
                panel.style.top = `${this.#y}px`;
            } else if (this.#triggerElement || this.#triggerEl) {
                this.#positionAtTrigger();
            }
            try {
                if (typeof panel.showPopover === "function") {
                    panel.showPopover();
                }
            } catch {
                // ignore
            }
            return;
        }
        try {
            if (typeof panel.hidePopover === "function") panel.hidePopover();
        } catch {
            // ignore
        }
    }
}

function menuItemFromEvent(event: Event): UIMenuItem | null {
    for (const node of event.composedPath()) {
        if (node instanceof UIMenuItem) return node;
    }
    return null;
}

if (!customElements.get(UI_TAG_NAMES.MENU)) {
    customElements.define(UI_TAG_NAMES.MENU, UIMenu);
}

declare global {
    interface HTMLElementTagNameMap {
        "ui-menu-divider": UIMenuDivider;
        "ui-menu-item": UIMenuItem;
        "ui-menu": UIMenu;
    }
}
