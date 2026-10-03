import { css, html, nothing, type PropertyValues, type CSSResultGroup, type PropertyDeclarations } from 'lit';
import { repeat } from "lit/directives/repeat.js";
import { bool } from "../base.element.ts";
import { headerToggleIcon, UIHeaderedElement } from "../headerSurface.ts";
import {
    type DataGetPageEventDetail,
    type DataGetPageParams,
    type DataPageEventDetail,
    type DataSelectionEventDetail,
    type DataSortDirection,
    type DataSortEventDetail,
    type ListItemClickEventDetail,
    type ListLayout,
    type Size,
    UI_TAG_NAMES,
} from "../constants.ts";
import {
    calculatePagination,
    getSmartPaginationPages,
    safeString,
    sortData,
} from "../dataCollection.utils.ts";
import { ifDefined } from "lit/directives/if-defined.js";

export type ItemRenderer<T = Record<string, unknown>> = (
    item: T,
    index: number,
    selected: boolean,
) => HTMLElement | string;

const invalidJson = Symbol("invalid-json");

function jsonArray(value: string | null): unknown {
    if (!value) return invalidJson;
    try {
        const parsed = JSON.parse(value) as unknown;
        return Array.isArray(parsed) ? parsed : invalidJson;
    } catch {
        return invalidJson;
    }
}

const META_KEYS = new Set([
    "id",
    "key",
    "title",
    "name",
    "label",
    "icon",
    "description",
    "desc",
    "subtitle",
    "badge",
    "rarity",
    "status",
    "type",
]);

export class UIList<T extends Record<string, unknown> = Record<string, unknown>>
    extends UIHeaderedElement {
    static override properties: PropertyDeclarations = {
        ...UIHeaderedElement.properties,
        layout: { type: String, reflect: true },
        columns: { type: Number, reflect: false },
        minItemWidth: {
            type: String,
            attribute: "min-item-width",
            reflect: true,
        },
        gap: { type: String, reflect: true },
        size: { type: String, reflect: true },
        bordered: bool(),
        selectable: bool(),
        selectionMode: {
            type: String,
            attribute: "selection-mode",
            reflect: true,
        },
        sortBy: { type: String, attribute: "sort-by", reflect: true },
        sortDirection: {
            attribute: "sort-direction",
            reflect: true,
            converter: {
                fromAttribute(value: string | null): DataSortDirection {
                    return value === "asc" || value === "desc" ? value : null;
                },
                toAttribute(value: DataSortDirection): string | null {
                    return value === "asc" || value === "desc" ? value : null;
                },
            },
        },
        itemKey: { type: String, attribute: "item-key", reflect: false },
        rowKey: { type: String, attribute: "row-key", reflect: false },
        loading: bool(),
        emptyText: { type: String, attribute: "empty-text", reflect: true },
        data: {
            attribute: "data",
            reflect: false,
            converter: { fromAttribute: jsonArray },
        },
        pagination: bool(),
        page: { type: Number, reflect: false },
        pageSize: { type: Number, attribute: "page-size", reflect: false },
        total: { type: Number, reflect: false },
        remote: bool(),
        selectedKeys: { attribute: false },
        pageSizeOptions: { attribute: false },
        renderItem: { attribute: false },
    };

    static override styles: CSSResultGroup = [
        UIHeaderedElement.styles,
        css`
            :host {
                display: block;
                box-sizing: border-box;
                --ui-list-min-item-width: 240px;
                --ui-list-columns: 3;
                --ui-current-bg: var(
                    --ui-card-bg,
                    var(--ui-color-surface-elevated, oklch(0.22 0.025 260))
                );
                font-family: var(--ui-font-family, ui-sans-serif, system-ui);
                width: 100%;
            }

            :host([hidden]) {
                display: none !important;
            }

            .list-root {
                position: relative;
                box-sizing: border-box;
                background: var(
                    --ui-list-bg,
                    var(
                        --ui-card-bg,
                        var(--ui-color-surface-elevated, oklch(0.22 0.025 260))
                    )
                );
                color: var(
                    --ui-list-color,
                    var(--ui-card-color, var(--ui-color-text, oklch(0.96 0.01 260)))
                );
                border: none;
                border-radius: var(--ui-list-radius, var(--ui-radius-lg, 0.382em));
                box-shadow: var(--ui-list-shadow, none);
                overflow: visible;
                display: flex;
                flex-direction: column;
                gap: var(--ui-space-sm, 1em);
            }

            .list-root.bordered {
                border: var(
                    --ui-list-border,
                    1px solid var(--ui-color-border, oklch(0.32 0.03 260))
                );
            }

            .header-bar {
                padding: var(--ui-space-3xs, 0.236em) var(--ui-space-xs, 0.618em);
                background: var(
                    --ui-header-bg,
                    var(
                        --ui-list-header-bar-bg,
                        var(
                            --ui-card-header-bg,
                            var(--ui-color-surface, oklch(0.14 0.02 260))
                        )
                    )
                );
                border-bottom: var(
                    --ui-header-border,
                    var(
                        --ui-list-header-border,
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
                        --ui-list-header-color,
                        var(
                            --ui-card-header-color,
                            var(--ui-color-text, oklch(0.96 0.01 260))
                        )
                    )
                );
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-top-left-radius: inherit;
                border-top-right-radius: inherit;
            }

            .header-bar:focus-visible {
                outline: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
                outline-offset: -2px;
            }

            .header-bar:empty {
                display: none;
            }

            .list-content {
                box-sizing: border-box;
                width: 100%;
            }

            .list-content.layout-list {
                display: flex;
                flex-direction: column;
                gap: var(--ui-list-gap, var(--ui-space-xs, 0.618em));
            }

            .list-content.layout-grid {
                display: grid;
                grid-template-columns:
                    repeat(var(--ui-list-columns, 3), minmax(0, 1fr));
                gap: var(--ui-list-gap, var(--ui-space-sm, 1em));
            }

            .list-content.layout-auto-fit {
                display: grid;
                grid-template-columns:
                    repeat(
                        auto-fit,
                        minmax(min(100%, var(--ui-list-min-item-width, 240px)), 1fr)
                    );
                gap: var(--ui-list-gap, var(--ui-space-sm, 1em));
            }

            .list-item {
                box-sizing: border-box;
                position: relative;
                display: flex;
                flex-direction: column;
                background: var(
                    --ui-list-item-bg,
                    var(
                        --ui-card-bg,
                        var(--ui-color-surface-elevated, oklch(0.22 0.025 260))
                    )
                );
                border: 1px solid
                    var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
                border-radius: var(--ui-radius-md, 0.236em);
                padding: var(--ui-space-xs, 0.618em);
                gap: var(--ui-space-3xs, 0.236em);
                color: var(
                    --ui-list-color,
                    var(--ui-card-color, var(--ui-color-text, oklch(0.96 0.01 260)))
                );
                box-shadow: var(--ui-shadow-sm, 0 2px 6px rgba(0, 0, 0, 0.2));
                cursor: pointer;
                user-select: none;
                transition:
                    transform
                    var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                    border-color
                    var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                    box-shadow
                    var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                    background
                    var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
                }

                .list-item:hover {
                    background: var(
                        --ui-list-item-hover-bg,
                        var(--ui-color-surface-hover, oklch(0.24 0.025 260))
                    );
                    border-color: var(
                        --ui-list-item-hover-border,
                        var(--ui-color-border-hover, oklch(0.44 0.03 260))
                    );
                    color: var(
                        --ui-list-color,
                        var(--ui-card-color, var(--ui-color-text, oklch(0.96 0.01 260)))
                    );
                    transform: translateY(-2px);
                    box-shadow: var(--ui-shadow-md, 0 6px 16px rgba(0, 0, 0, 0.3));
                }

                .list-item.selected {
                    background: var(
                        --ui-list-item-selected-bg,
                        oklch(
                            from var(--ui-color-primary, oklch(0.65 0.19 230))
                            l c h / 0.18
                        )
                    );
                    border-color: var(--ui-color-primary, oklch(0.65 0.19 230));
                    box-shadow:
                        0 0 0 1px var(--ui-color-primary, oklch(0.65 0.19 230)),
                        var(--ui-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.25));
                    }

                    .item-top-row {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: var(--ui-space-3xs, 0.236em);
                    }

                    .item-title-group {
                        display: flex;
                        align-items: center;
                        gap: var(--ui-space-3xs, 0.236em);
                        flex: 1;
                        min-width: 0;
                    }

                    .item-select-control {
                        display: flex;
                        align-items: center;
                        cursor: pointer;
                    }

                    .item-icon {
                        font-size: 1.25em;
                        line-height: 1;
                    }

                    .item-title {
                        font-family: var(--ui-font-heading, inherit);
                        font-weight: 700;
                        font-size: 0.95rem;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        color: var(--ui-color-text, oklch(0.96 0.01 260));
                    }

                    .item-description {
                        font-size: 0.8rem;
                        color: var(--ui-color-text-muted, oklch(0.7 0.02 260));
                        line-height: 1.4;
                        margin-top: var(--ui-space-4xs, 0.146em);
                    }

                    .ui-badge {
                        display: inline-flex;
                        align-items: center;
                        vertical-align: middle;
                        box-sizing: border-box;
                        font-family: var(--ui-badge-font-family, var(--ui-font-mono, monospace));
                        font-weight: 600;
                        letter-spacing: 0.02em;
                        text-transform: uppercase;
                        border: 1px solid transparent;
                        user-select: none;
                        white-space: nowrap;
                        line-height: 1;
                        border-radius: var(--ui-badge-radius, var(--ui-radius-full, 9999px));
                        font-size: 0.65rem;
                        padding: var(--ui-space-3xs, 0.236em) var(--ui-space-xs, 0.618em);
                        gap: var(--ui-space-2xs, 0.382em);
                        background-color: var(--ui-color-surface-hover, oklch(0.22 0.025 260));
                        color: var(--ui-color-text-muted, oklch(0.70 0.02 260));
                        border-color: var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
                    }
                    .ui-badge--primary {
                        background-color: var(--ui-color-primary-subtle, oklch(0.65 0.19 230 / 0.15));
                        color: var(--ui-color-primary, oklch(0.65 0.19 230));
                        border-color: var(--ui-color-primary-border, oklch(0.65 0.19 230 / 0.45));
                    }
                    .ui-badge--success {
                        background-color: var(--ui-color-success-subtle, oklch(0.72 0.18 145 / 0.15));
                        color: var(--ui-color-success, oklch(0.72 0.18 145));
                        border-color: var(--ui-color-success-border, oklch(0.72 0.18 145 / 0.45));
                    }
                    .ui-badge--warning {
                        background-color: var(--ui-color-warning-subtle, oklch(0.80 0.18 80 / 0.15));
                        color: var(--ui-color-warning, oklch(0.80 0.18 80));
                        border-color: var(--ui-color-warning-border, oklch(0.80 0.18 80 / 0.45));
                    }
                    .ui-badge--danger {
                        background-color: var(--ui-color-danger-subtle, oklch(0.65 0.22 25 / 0.15));
                        color: var(--ui-color-danger, oklch(0.65 0.22 25));
                        border-color: var(--ui-color-danger-border, oklch(0.65 0.22 25 / 0.45));
                    }
                    .ui-badge--accent {
                        background-color: var(--ui-color-accent-subtle, oklch(0.75 0.18 190 / 0.15));
                        color: var(--ui-color-accent, oklch(0.75 0.18 190));
                        border-color: var(--ui-color-accent-border, oklch(0.75 0.18 190 / 0.45));
                    }
                    .ui-badge--info {
                        background-color: var(--ui-color-info-subtle, oklch(0.70 0.16 230 / 0.15));
                        color: var(--ui-color-info, oklch(0.70 0.16 230));
                        border-color: var(--ui-color-info-border, oklch(0.70 0.16 230 / 0.45));
                    }

                    .item-properties-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                        gap: var(--ui-space-4xs, 0.146em);
                        padding-top: var(--ui-space-4xs, 0.146em);
                        border-top: 1px solid
                            var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.3));
                        font-size: 0.75rem;
                    }

                    .item-prop-pill {
                        display: flex;
                        align-items: center;
                        gap: var(--ui-space-4xs, 0.146em);
                        color: var(--ui-color-text-muted, oklch(0.7 0.02 260));
                    }

                    .item-prop-pill strong {
                        color: var(--ui-color-text, oklch(0.96 0.01 260));
                    }

                    .list-root.size-sm .list-item {
                        padding: var(--ui-space-3xs, 0.236em);
                        font-size: 0.75rem;
                    }

                    .list-root.size-lg .list-item {
                        padding: var(--ui-space-sm, 1em);
                        font-size: 1rem;
                    }

                    .empty-state {
                        padding: var(--ui-space-md, 1.618em);
                        text-align: center;
                        color: var(--ui-color-text-muted, oklch(0.7 0.02 260));
                        font-size: 0.875rem;
                    }

                    .loading-overlay {
                        position: absolute;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.45);
                        backdrop-filter: blur(4px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10;
                        border-radius: inherit;
                    }

                    .loading-spinner {
                        width: 24px;
                        height: 24px;
                        border: 3px solid var(--ui-color-border, oklch(0.32 0.03 260));
                        border-top-color: var(--ui-color-primary, oklch(0.65 0.19 230));
                        border-radius: 50%;
                        animation: spin 0.618s linear infinite;
                    }

                    @keyframes spin {
                        to {
                            transform: rotate(360deg);
                        }
                    }

                    .footer-bar {
                        padding: var(--ui-space-3xs, 0.236em) var(--ui-space-xs, 0.618em);
                        background: var(
                            --ui-list-footer-bar-bg,
                            var(
                                --ui-card-footer-bg,
                                var(--ui-color-surface, oklch(0.14 0.02 260))
                            )
                        );
                        border-top: var(
                            --ui-list-footer-border,
                            1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5))
                        );
                        font-size: 0.75rem;
                        color: var(
                            --ui-list-footer-color,
                            var(--ui-color-text-muted, oklch(0.7 0.02 260))
                        );
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        flex-wrap: wrap;
                        gap: var(--ui-space-xs, 0.618em);
                        border-bottom-left-radius: inherit;
                        border-bottom-right-radius: inherit;
                    }

                    .pagination-container {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        width: 100%;
                        flex-wrap: wrap;
                        gap: var(--ui-space-xs, 0.618em);
                    }

                    .pagination-left {
                        display: flex;
                        align-items: center;
                        gap: var(--ui-space-xs, 0.618em);
                        color: var(--ui-color-text-muted, oklch(0.7 0.02 260));
                        font-size: 0.8rem;
                    }

                    .page-size-selector {
                        display: inline-flex;
                        align-items: center;
                        gap: var(--ui-space-4xs, 0.146em);
                    }

                    .page-size-select {
                        background: var(
                            --ui-table-page-btn-bg,
                            var(--ui-color-surface-hover, oklch(0.24 0.025 260))
                        );
                        color: var(
                            --ui-table-page-btn-color,
                            var(--ui-color-text, oklch(0.96 0.01 260))
                        );
                        border: 1px solid
                            var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
                        border-radius: var(--ui-radius-sm, 0.146em);
                        padding: 2px 6px;
                        font-size: 0.75rem;
                        outline: none;
                        cursor: pointer;
                    }

                    .pagination-controls {
                        display: flex;
                        align-items: center;
                        gap: var(--ui-space-4xs, 0.146em);
                    }

                    .page-btn {
                        min-width: var(--ui-space-md, 1.618em);
                        height: var(--ui-space-md, 1.618em);
                        padding: 0 var(--ui-space-3xs, 0.236em);
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        background: var(
                            --ui-table-page-btn-bg,
                            var(--ui-color-surface-hover, oklch(0.24 0.025 260))
                        );
                        border: 1px solid
                            var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
                        color: var(
                            --ui-table-page-btn-color,
                            var(--ui-color-text, oklch(0.96 0.01 260))
                        );
                        border-radius: var(--ui-radius-sm, 0.146em);
                        font-size: 0.75rem;
                        font-weight: 500;
                        cursor: pointer;
                        user-select: none;
                        transition:
                            background
                            var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                            border-color
                            var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                            color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
                        }

                        .page-btn:hover:not(:disabled) {
                            background: var(--ui-color-surface-active, oklch(0.28 0.03 260));
                            border-color: var(--ui-color-border-hover, oklch(0.44 0.03 260));
                            color: var(
                                --ui-table-page-btn-color,
                                var(--ui-color-text, oklch(0.96 0.01 260))
                            );
                        }

                        .page-btn.active {
                            background: var(--ui-color-primary, oklch(0.65 0.19 230));
                            border-color: var(--ui-color-primary, oklch(0.65 0.19 230));
                            color: var(--ui-color-primary-text, oklch(0.98 0 0));
                            font-weight: 700;
                        }

                        .page-btn:disabled {
                            opacity: 0.4;
                            cursor: not-allowed;
                        }

                        .page-ellipsis {
                            padding: 0 var(--ui-space-4xs, 0.146em);
                            color: var(--ui-color-text-muted, oklch(0.7 0.02 260));
                            font-weight: bold;
                        }

                        .page-btn:focus-visible {
                            outline: 2px solid var(--ui-color-primary, oklch(0.65 0.19 230));
                            outline-offset: 1px;
                        }

                        @media (prefers-reduced-motion: reduce) {
                            .loading-spinner {
                                animation: none !important;
                            }
                            .page-btn {
                                transition: none !important;
                            }
                        }
                    `,
                ];

                layout: ListLayout = "auto-fit";
                minItemWidth = "240px";
                gap = "";
                size: Size = "md";
                bordered = false;
                selectable = false;
                selectionMode: "single" | "multiple" = "multiple";
                sortBy = "";
                sortDirection: DataSortDirection = null;
                loading = false;
                emptyText = "No items found";
                pagination = false;
                remote = false;

                #data: T[] = [];
                #rawUnsortedData: T[] = [];
                #selectedKeys: Set<string> = new Set();
                #pageSizeOptions: number[] = [5, 10, 25, 50];
                #customItemRenderer: ItemRenderer<T> | null = null;
                #acceptUnsorted = false;

                fetchPage?: (
                    params: DataGetPageParams,
                ) => Promise<{ data: T[]; total?: number }> | void;

                private getItemKey(item: T, idx: number): string {
                    const keyProp = this.itemKey || "id";
                    const raw = item[keyProp];
                    if (raw !== undefined && raw !== null) {
                        return safeString(raw);
                    }
                    return idx.toString();
                }

                get data(): T[] {
                    return this.#data;
                }

                set data(newData: T[] | symbol) {
                    if (typeof newData === "symbol") return;
                    const old = this.#data;
                    const next = Array.isArray(newData) ? [...newData] : [];
                    this.#rawUnsortedData = [...next];
                    this.#data = next;
                    this.requestUpdate("data", old);
                }

                get renderItem(): ItemRenderer<T> | null {
                    return this.#customItemRenderer;
                }

                set renderItem(renderer: ItemRenderer<T> | null) {
                    const old = this.#customItemRenderer;
                    this.#customItemRenderer = renderer;
                    this.requestUpdate("renderItem", old);
                }

                get columns(): number | undefined {
                    const val = this.getAttribute("columns");
                    if (val !== null && val !== "") {
                        const num = parseInt(val, 10);
                        return Number.isNaN(num) || num <= 0 ? undefined : num;
                    }
                    return undefined;
                }

                set columns(v: number | undefined) {
                    if (v === undefined || v === null || Number(v) <= 0) {
                        if (this.hasAttribute("columns")) {
                            this.removeAttribute("columns");
                        }
                        return;
                    }
                    const next = String(v);
                    if (this.getAttribute("columns") !== next) {
                        this.setAttribute("columns", next);
                    }
                }

                get itemKey(): string {
                    return this.getAttribute("item-key") ||
                        this.getAttribute("row-key") || "id";
                }

                set itemKey(v: string) {
                    const next = v ?? "";
                    if (!next) {
                        if (this.hasAttribute("item-key")) {
                            this.removeAttribute("item-key");
                        }
                        return;
                    }
                    if (this.getAttribute("item-key") !== next) {
                        this.setAttribute("item-key", next);
                    }
                }

                get rowKey(): string {
                    return this.itemKey;
                }

                set rowKey(v: string) {
                    this.itemKey = v;
                }

                get page(): number {
                    const val = parseInt(this.getAttribute("page") ?? "1", 10);
                    return Number.isNaN(val) || val < 1 ? 1 : val;
                }

                set page(v: number) {
                    const next = String(Math.max(1, v));
                    if (this.getAttribute("page") !== next) {
                        this.setAttribute("page", next);
                    }
                }

                get pageSize(): number {
                    const val = parseInt(
                        this.getAttribute("page-size") ?? "10",
                        10,
                    );
                    return Number.isNaN(val) || val < 1 ? 10 : val;
                }

                set pageSize(v: number) {
                    const next = String(Math.max(1, v));
                    if (this.getAttribute("page-size") !== next) {
                        this.setAttribute("page-size", next);
                    }
                }

                get total(): number {
                    const val = this.getAttribute("total");
                    if (val !== null && val !== "") {
                        const num = parseInt(val, 10);
                        if (!Number.isNaN(num) && num >= 0) return num;
                    }
                    return this.#data.length;
                }

                set total(v: number | null) {
                    if (
                        v === null || typeof v !== "number" ||
                        !Number.isFinite(v)
                    ) {
                        if (this.hasAttribute("total")) {
                            this.removeAttribute("total");
                        }
                        return;
                    }
                    const next = String(Math.max(0, v));
                    if (this.getAttribute("total") !== next) {
                        this.setAttribute("total", next);
                    }
                }

                get totalPages(): number {
                    return Math.max(1, Math.ceil(this.total / this.pageSize));
                }

                get selectedKeys(): string[] {
                    return Array.from(this.#selectedKeys);
                }

                set selectedKeys(keys: string[]) {
                    const old = this.selectedKeys;
                    this.#selectedKeys = new Set(
                        Array.isArray(keys) ? keys : [],
                    );
                    this.emitSelectionChange();
                    this.requestUpdate("selectedKeys", old);
                }

                get selectedItems(): T[] {
                    return this.#data.filter((item, idx) =>
                        this.#selectedKeys.has(this.getItemKey(item, idx))
                    );
                }

                get pageSizeOptions(): number[] {
                    return this.#pageSizeOptions;
                }

                set pageSizeOptions(options: number[]) {
                    if (!Array.isArray(options) || options.length === 0) return;
                    const old = this.#pageSizeOptions;
                    this.#pageSizeOptions = [...options];
                    this.requestUpdate("pageSizeOptions", old);
                }

                protected override willUpdate(changed: PropertyValues): void {
                    this.style.setProperty(
                        "--ui-list-min-item-width",
                        this.minItemWidth || "240px",
                    );
                    this.style.setProperty(
                        "--ui-list-columns",
                        String(this.columns ?? 3),
                    );
                    if (this.gap) {
                        this.style.setProperty("--ui-list-gap", this.gap);
                    } else this.style.removeProperty("--ui-list-gap");

                    if (
                        !this.#acceptUnsorted &&
                        !this.remote &&
                        (changed.has("sortBy") ||
                            changed.has("sortDirection") || changed.has("data"))
                    ) {
                        this.#data = this.#sortedData();
                    }
                }

                #sortedData(): T[] {
                    if (!this.sortBy || !this.sortDirection) {
                        return [...this.#rawUnsortedData];
                    }
                    return sortData(
                        this.#rawUnsortedData,
                        this.sortBy,
                        this.sortDirection,
                    );
                }

                #replacePageData(rows: T[], total?: number): void {
                    const old = this.#data;
                    this.#acceptUnsorted = true;
                    try {
                        this.#data = [...rows];
                        this.#rawUnsortedData = [...rows];
                        if (total !== undefined) this.total = total;
                        this.loading = false;
                        this.requestUpdate("data", old);
                    } finally {
                        this.#acceptUnsorted = false;
                    }
                }

                public getPage(
                    customParams?: Partial<DataGetPageParams>,
                ): void {
                    const params: DataGetPageParams = {
                        page: customParams?.page ?? this.page,
                        pageSize: customParams?.pageSize ?? this.pageSize,
                        sortBy: customParams?.sortBy ?? this.sortBy,
                        sortDirection: customParams?.sortDirection ??
                            this.sortDirection,
                    };

                    if (this.fetchPage) {
                        this.loading = true;
                        const result = this.fetchPage(params);
                        if (
                            result &&
                            typeof (result as Promise<unknown>).then ===
                                "function"
                        ) {
                            (result as Promise<{ data: T[]; total?: number }>)
                                .then((res) => {
                                    if (res && Array.isArray(res.data)) {
                                        this.#replacePageData(
                                            res.data,
                                            res.total,
                                        );
                                    } else {
                                        this.loading = false;
                                    }
                                })
                                .catch(() => {
                                    this.loading = false;
                                });
                        } else {
                            this.loading = false;
                        }
                    }

                    const detail: DataGetPageEventDetail<T> = {
                        ...params,
                        resolve: (res) => {
                            if (res && Array.isArray(res.data)) {
                                this.#replacePageData(res.data, res.total);
                            } else this.loading = false;
                        },
                    };
                    this.emit("ui-get-page", detail);
                }

                public sort(key: string, direction?: DataSortDirection): void {
                    if (this.sortBy === key) {
                        if (direction !== undefined) {
                            this.sortDirection = direction;
                        } else {
                            this.sortDirection = this.sortDirection === "asc"
                                ? "desc"
                                : this.sortDirection === "desc"
                                ? null
                                : "asc";
                        }
                    } else {
                        this.sortBy = key;
                        this.sortDirection = direction !== undefined
                            ? direction
                            : "asc";
                    }

                    if (!this.remote) this.applySorting(true);
                    this.getPage();
                }

                private applySorting(emitEvent = true): void {
                    const old = this.#data;
                    this.#data = this.#sortedData();
                    this.requestUpdate("data", old);
                    if (emitEvent) {
                        const detail: DataSortEventDetail<T> = {
                            column: this.sortBy,
                            direction: this.sortDirection,
                            data: [...this.#data],
                        };
                        this.emit("ui-sort", detail);
                    }
                }

                public setPage(newPage: number): void {
                    const target = Math.max(
                        1,
                        Math.min(newPage, this.totalPages),
                    );
                    if (this.page !== target) {
                        this.page = target;
                        const detail: DataPageEventDetail = {
                            page: this.page,
                            pageSize: this.pageSize,
                            totalPages: this.totalPages,
                            total: this.total,
                        };
                        this.emit("ui-page-change", detail);
                        this.getPage();
                    }
                }

                public setPageSize(newPageSize: number): void {
                    const size = Math.max(1, newPageSize);
                    if (this.pageSize !== size) {
                        this.pageSize = size;
                        this.page = 1;
                        const detail: DataPageEventDetail = {
                            page: this.page,
                            pageSize: this.pageSize,
                            totalPages: this.totalPages,
                            total: this.total,
                        };
                        this.emit("ui-page-change", detail);
                        this.getPage();
                    }
                }

                public nextPage(): void {
                    if (this.page < this.totalPages) {
                        this.setPage(this.page + 1);
                    }
                }

                public prevPage(): void {
                    if (this.page > 1) this.setPage(this.page - 1);
                }

                public isSelected(item: T, idx: number): boolean {
                    return this.#selectedKeys.has(this.getItemKey(item, idx));
                }

                public toggleItemSelection(item: T, idx: number): void {
                    if (!this.selectable) return;
                    const key = this.getItemKey(item, idx);
                    const old = this.selectedKeys;
                    if (this.selectionMode === "single") {
                        if (this.#selectedKeys.has(key)) {
                            this.#selectedKeys.clear();
                        } else {
                            this.#selectedKeys.clear();
                            this.#selectedKeys.add(key);
                        }
                    } else if (this.#selectedKeys.has(key)) {
                        this.#selectedKeys.delete(key);
                    } else this.#selectedKeys.add(key);
                    this.emitSelectionChange(item, idx);
                    this.requestUpdate("selectedKeys", old);
                }

                public selectAll(): void {
                    if (!this.selectable || this.selectionMode === "single") {
                        return;
                    }
                    const old = this.selectedKeys;
                    this.#selectedKeys = new Set(
                        this.#data.map((item, idx) =>
                            this.getItemKey(item, idx)
                        ),
                    );
                    this.emitSelectionChange();
                    this.requestUpdate("selectedKeys", old);
                }

                public clearSelection(): void {
                    if (!this.selectable) return;
                    const old = this.selectedKeys;
                    this.#selectedKeys.clear();
                    this.emitSelectionChange();
                    this.requestUpdate("selectedKeys", old);
                }

                private emitSelectionChange(item?: T, index?: number): void {
                    const detail: DataSelectionEventDetail<T> = {
                        selectedKeys: this.selectedKeys,
                        selectedItems: this.selectedItems,
                        item,
                        index,
                    };
                    this.emit("ui-selection-change", detail);
                }

                #onItemClick(event: Event, item: T, index: number): void {
                    const target = event.target as HTMLElement | null;
                    if (target?.classList.contains("item-select-cb")) return;
                    if (this.selectable) this.toggleItemSelection(item, index);
                    const detail: ListItemClickEventDetail<T> = {
                        item,
                        index,
                        selected: this.isSelected(item, index),
                    };
                    this.emit("ui-item-click", detail);
                }

                #onItemCheck(event: Event, item: T, index: number): void {
                    event.stopPropagation();
                    this.toggleItemSelection(item, index);
                }

                #onPageSizeChange = (event: Event): void => {
                    const newSize = parseInt(
                        (event.target as HTMLSelectElement).value,
                        10,
                    );
                    this.setPageSize(newSize);
                };

                #inferBadgeVariant(val: string): string {
                    const v = val.toLowerCase();
                    if (
                        v.includes("rare") || v.includes("mythic") ||
                        v.includes("legend") || v.includes("gold")
                    ) {
                        return "warning";
                    }
                    if (
                        v.includes("active") ||
                        v.includes("success") ||
                        v.includes("online") ||
                        v.includes("food")
                    ) {
                        return "success";
                    }
                    if (
                        v.includes("danger") ||
                        v.includes("error") ||
                        v.includes("offline") ||
                        v.includes("wood")
                    ) {
                        return "danger";
                    }
                    if (
                        v.includes("accent") || v.includes("stone") ||
                        v.includes("bronze")
                    ) return "accent";
                    return "primary";
                }

                #renderItem(item: T, index: number) {
                    const selected = this.isSelected(item, index);
                    const custom = this.#customItemRenderer?.(
                        item,
                        index,
                        selected,
                    );
                    const body = custom instanceof HTMLElement
                        ? custom
                        : typeof custom === "string"
                        ? custom
                        : this.#renderDefaultBody(item, index, selected);
                    return html`
                        <div
                            class="list-item ${selected ? "selected" : ""}"
                            data-idx="${index}"
                            part="${selected ? "item item-selected" : "item"}"
                            @click="${(event: Event) =>
                                this.#onItemClick(event, item, index)}"
                        >
                            ${body}
                        </div>
                    `;
                }

                #renderDefaultBody(item: T, index: number, selected: boolean) {
                    const title = safeString(
                        item.title ?? item.name ?? item.label ?? item.item ??
                            item.key ?? `Item #${index + 1}`,
                    );
                    const icon = item.icon ? safeString(item.icon) : "";
                    const subtitle = item.subtitle ?? item.description ??
                        item.desc ?? item.category;
                    const badge = item.badge ?? item.rarity ?? item.status ??
                        item.type;
                    const badgeText = badge ? safeString(badge) : "";
                    const props = Object.entries(item)
                        .filter(([key]) => !META_KEYS.has(key))
                        .slice(0, 4);
                    return html`
                        <div class="item-top-row">
                            <div class="item-title-group">
                                ${this.selectable
                                    ? html`
                                        <div class="item-select-control">
                                            <input
                                                type="${this.selectionMode ===
                                                        "single"
                                                    ? "radio"
                                                    : "checkbox"}"
                                                name="ui-list-selection"
                                                class="item-select-cb"
                                                data-idx="${index}"
                                                .checked="${selected}"
                                                aria-label="${`Select ${title || `item ${index + 1}`}`}"
                                                @change="${(event: Event) =>
                                                    this.#onItemCheck(
                                                        event,
                                                        item,
                                                        index,
                                                    )}"
                                            />
                                        </div>
                                    `
                                    : nothing} ${icon
                                    ? html`
                                        <span class="item-icon" aria-hidden="true">${icon}</span>
                                    `
                                    : nothing}
                                <span class="item-title" title="${title}">${title}</span>
                            </div>
                            ${badgeText
                                ? html`
                                    <span class="ui-badge ui-badge--sm ui-badge--${this
                                        .#inferBadgeVariant(
                                            badgeText,
                                        )}">${badgeText}</span>
                                `
                                : nothing}
                        </div>
                        ${subtitle
                            ? html`
                                <div class="item-description">${safeString(
                                    subtitle,
                                )}</div>
                            `
                            : nothing} ${props.length > 0
                            ? html`
                                <div class="item-properties-grid">
                                    ${props.map(
                                        ([key, value]) =>
                                            html`
                                                <span class="item-prop-pill">
                                                    <span>${key}:</span>
                                                    <strong>${safeString(
                                                        value,
                                                    )}</strong>
                                                </span>
                                            `,
                                    )}
                                </div>
                            `
                            : nothing}
                    `;
                }

                #renderPagination(
                    currentPage: number,
                    totalPages: number,
                    totalCount: number,
                    startItem: number,
                    endItem: number,
                ) {
                    const pages = getSmartPaginationPages(
                        currentPage,
                        totalPages,
                    );
                    return html`
                        <div class="pagination-container" part="pagination">
                            <div class="pagination-left">
                                <span class="pagination-info">
                                    Showing <strong>${startItem}–${endItem}</strong> of <strong
                                    >${totalCount}</strong>
                                </span>
                                <div class="page-size-selector">
                                    <label for="page-size-select">Show:</label>
                                    <select
                                        id="page-size-select"
                                        class="page-size-select"
                                        part="page-size-select"
                                        aria-label="Items per page"
                                        @change="${this.#onPageSizeChange}"
                                    >
                                        ${this.#pageSizeOptions.map(
                                            (opt) =>
                                                html`
                                                    <option value="${opt}" ?selected="${opt ===
                                                        this.pageSize}">${opt}</option>
                                                `,
                                        )}
                                    </select>
                                </div>
                            </div>
                            <div
                                class="pagination-controls"
                                part="pagination-controls"
                                role="navigation"
                                aria-label="Pagination Navigation"
                            >
                                <button
                                    type="button"
                                    class="page-btn page-first"
                                    ?disabled="${currentPage === 1}"
                                    title="First Page"
                                    aria-label="First page"
                                    part="page-first"
                                    @click="${() => this.setPage(1)}"
                                >
                                    «
                                </button>
                                <button
                                    type="button"
                                    class="page-btn page-prev"
                                    ?disabled="${currentPage === 1}"
                                    title="Previous Page"
                                    aria-label="Previous page"
                                    part="page-prev"
                                    @click="${() => this.prevPage()}"
                                >
                                    ‹
                                </button>
                                ${pages.map((p) =>
                                    p === "..."
                                        ? html`
                                            <span class="page-ellipsis" aria-hidden="true">…</span>
                                        `
                                        : html`
                                            <button
                                                type="button"
                                                class="page-btn page-num ${p ===
                                                        currentPage
                                                    ? "active"
                                                    : ""}"
                                                data-page="${p}"
                                                aria-label="${`Page ${p}`}"
                                                aria-current="${ifDefined(
                                                    p === currentPage
                                                        ? "page"
                                                        : undefined,
                                                )}"
                                                part="${p === currentPage
                                                    ? "page-num page-num-active"
                                                    : "page-num"}"
                                                @click="${() =>
                                                    this.setPage(Number(p))}"
                                            >
                                                ${p}
                                            </button>
                                        `
                                )}
                                <button
                                    type="button"
                                    class="page-btn page-next"
                                    ?disabled="${currentPage === totalPages ||
                                        totalPages === 0}"
                                    title="Next Page"
                                    aria-label="Next page"
                                    part="page-next"
                                    @click="${() => this.nextPage()}"
                                >
                                    ›
                                </button>
                                <button
                                    type="button"
                                    class="page-btn page-last"
                                    ?disabled="${currentPage === totalPages ||
                                        totalPages === 0}"
                                    title="Last Page"
                                    aria-label="Last page"
                                    part="page-last"
                                    @click="${() =>
                                        this.setPage(this.totalPages)}"
                                >
                                    »
                                </button>
                            </div>
                        </div>
                    `;
                }

                protected override render(): unknown {
                    const paginationResult = calculatePagination(
                        this.#data,
                        this.page,
                        this.pageSize,
                        this.total,
                        this.remote,
                    );
                    const {
                        items: displayItems,
                        total: totalCount,
                        totalPages,
                        currentPage,
                        startItem,
                        endItem,
                    } = paginationResult;
                    const hasData = this.#data.length > 0;
                    const startIndexOffset = (currentPage - 1) * this.pageSize;

                    return html`
                        <div class="list-root size-${this.size} ${this.bordered
                            ? "bordered"
                            : ""}" part="root">
                            <div
                                class="header-bar"
                                part="header"
                                role="${ifDefined(
                                    this.collapsible ? "button" : undefined,
                                )}"
                                tabindex="${ifDefined(
                                    this.collapsible ? "0" : undefined,
                                )}"
                                aria-expanded="${ifDefined(
                                    this.collapsible
                                        ? !this.collapsed
                                        : undefined,
                                )}"
                                @click="${this.onHeaderClick}"
                                @keydown="${this.onHeaderKeydown}"
                            >
                                <slot name="header"></slot>
                                ${headerToggleIcon(this.collapsible)}
                            </div>
                            <div class="list-content layout-${this
                                .layout}" part="content">
                                ${hasData
                                    ? repeat(
                                        displayItems,
                                        (item, localIdx) =>
                                            this.getItemKey(
                                                item,
                                                startIndexOffset + localIdx,
                                            ),
                                        (item, localIdx) =>
                                            this.#renderItem(
                                                item,
                                                startIndexOffset + localIdx,
                                            ),
                                    )
                                    : html`
                                        <div class="empty-state" part="empty">
                                            <slot name="empty">${this
                                                .emptyText}</slot>
                                        </div>
                                    `}
                            </div>
                            ${this.pagination
                                ? html`
                                    <div class="footer-bar" part="footer">
                                        ${this.#renderPagination(
                                            currentPage,
                                            totalPages,
                                            totalCount,
                                            startItem,
                                            endItem,
                                        )}
                                    </div>
                                `
                                : html`
                                    <div class="footer-bar" part="footer"><slot name="footer"></slot></div>
                                `} ${this.loading
                                ? html`
                                    <div class="loading-overlay" part="loading" role="status" aria-label="Loading list data">
                                        <div class="loading-spinner" aria-hidden="true"></div>
                                    </div>
                                `
                                : nothing}
                        </div>
                    `;
                }
            }

            if (!customElements.get(UI_TAG_NAMES.LIST)) {
                customElements.define(UI_TAG_NAMES.LIST, UIList);
            }

