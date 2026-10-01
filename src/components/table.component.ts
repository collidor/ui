import { css, html, nothing, type PropertyValues } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { bool } from "../base.element.ts";
import { headerToggleIcon, UIHeaderedElement } from "../headerSurface.ts";
import {
    type Size,
    type TableColumn,
    type TableColumnsChangeEventDetail,
    type TableGetPageEventDetail,
    type TableGetPageParams,
    type TablePageEventDetail,
    type TableSelectionEventDetail,
    type TableSortDirection,
    type TableSortEventDetail,
    UI_TAG_NAMES,
} from "../constants.ts";
import { safeString, sortData } from "../dataCollection.utils.ts";
import { ifDefined } from "lit/directives/if-defined.js";
import "./pagination.component.ts";
import type { PaginationMode, StepperFormat } from "./pagination.component.ts";

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

export class UITable<
    T extends Record<string, unknown> = Record<string, unknown>,
> extends UIHeaderedElement {
    static properties = {
        ...UIHeaderedElement.properties,
        size: { type: String, reflect: true },
        striped: bool(),
        bordered: bool(),
        hoverable: bool(),
        compact: bool(),
        stickyHeader: bool("sticky-header"),
        selectable: bool(),
        selectionMode: {
            type: String,
            attribute: "selection-mode",
            reflect: false,
        },
        sortBy: { type: String, attribute: "sort-by", reflect: true },
        sortDirection: {
            attribute: "sort-direction",
            reflect: true,
            converter: {
                fromAttribute(value: string | null): TableSortDirection {
                    return value === "asc" || value === "desc" ? value : null;
                },
                toAttribute(value: TableSortDirection): string | null {
                    return value === "asc" || value === "desc" ? value : null;
                },
            },
        },
        rowKey: { type: String, attribute: "row-key", reflect: true },
        loading: bool(),
        emptyText: { type: String, attribute: "empty-text", reflect: true },
        data: {
            attribute: "data",
            reflect: false,
            converter: { fromAttribute: jsonArray },
        },
        columns: {
            attribute: "columns",
            reflect: false,
            converter: { fromAttribute: jsonArray },
        },
        pagination: bool(),
        page: { type: Number, reflect: false },
        pageSize: { type: Number, attribute: "page-size", reflect: false },
        total: { type: Number, reflect: false },
        paginationMode: { type: String, attribute: "pagination-mode", reflect: false },
        stepperFormat: { type: String, attribute: "stepper-format", reflect: false },
        discretePages: {
            type: Boolean,
            attribute: "discrete-pages",
            converter: (val: string | null) => val === null ? true : val !== "false",
            reflect: false,
        },
        remote: bool(),
        columnCustomization: bool("column-customization"),
        customizableColumns: bool("customizable-columns"),
        hideHeader: { ...bool("hide-header"), reflect: false },
        showHeaderAttr: {
            type: String,
            attribute: "show-header",
            reflect: false,
        },
        selectedKeys: { attribute: false },
        selectedRows: { attribute: false },
        pageSizeOptions: { attribute: false },
    };

    static styles = [
        UIHeaderedElement.styles,
        css`
            :host {
                display: flex;
                flex-direction: column;
                box-sizing: border-box;
                --ui-current-bg: var(
                    --ui-table-bg,
                    var(
                        --ui-card-bg,
                        var(--ui-color-surface-elevated, oklch(0.22 0.025 260))
                    )
                );
                font-family: var(--ui-font-family, ui-sans-serif, system-ui);
                width: 100%;
                height: 100%;
                flex: 1;
                min-height: 0;
            }

            :host-context(.panel-body),
            :host-context(.section-body),
            :host-context([part="panel-body"]) {
                flex: 1 1 auto;
                height: 100%;
                min-height: 0;
            }

            :host([hidden]) {
                display: none !important;
            }

            .table-root {
                height: 100%;
                width: 100%;
                display: flex;
                flex-direction: column;
                flex: 1;
                min-height: 0;
                position: relative;
                box-sizing: border-box;
                background: var(
                    --ui-table-bg,
                    var(
                        --ui-card-bg,
                        var(--ui-color-surface-elevated, oklch(0.22 0.025 260))
                    )
                );
                color: var(
                    --ui-table-color,
                    var(--ui-card-color, var(--ui-color-text, oklch(0.96 0.01 260)))
                );
                border: var(
                    --ui-table-border,
                    1px solid var(--ui-color-border, oklch(0.32 0.03 260))
                );
                border-radius: var(--ui-table-radius, var(--ui-radius-lg, 0.382em));
                box-shadow: var(
                    --ui-table-shadow,
                    var(
                        --ui-shadow-md,
                        0 var(--ui-space-3xs, 0.236em) var(--ui-space-xs, 0.618em) rgba(
                            0,
                            0,
                            0,
                            0.3
                        )
                    )
                );
                overflow: visible;
                transition:
                    border-color
                    var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                    box-shadow
                    var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                    background
                    var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
                }

                .table-root.no-header .table-scroll-container {
                    border-top-left-radius: inherit;
                    border-top-right-radius: inherit;
                }

                .header-bar {
                    padding: var(--ui-space-3xs, 0.236em) var(--ui-space-xs, 0.618em);
                    background: var(
                        --ui-header-bg,
                        var(
                            --ui-table-header-bar-bg,
                            var(
                                --ui-card-header-bg,
                                var(--ui-color-surface, oklch(0.14 0.02 260))
                            )
                        )
                    );
                    border-bottom: var(
                        --ui-header-border,
                        var(
                            --ui-table-header-border,
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
                            --ui-table-header-color,
                            var(
                                --ui-card-header-color,
                                var(--ui-color-text, oklch(0.96 0.01 260))
                            )
                        )
                    );
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: relative;
                    gap: var(--ui-space-xs, 0.618em);
                    border-top-left-radius: inherit;
                    border-top-right-radius: inherit;
                }

                .header-bar-left {
                    display: flex;
                    align-items: center;
                    gap: var(--ui-space-3xs, 0.236em);
                    flex: 1;
                    color: inherit;
                }

                .header-bar-right {
                    display: flex;
                    align-items: center;
                    gap: var(--ui-space-3xs, 0.236em);
                }

                .btn-custom-cols {
                    display: inline-flex;
                    align-items: center;
                    gap: var(--ui-space-3xs, 0.236em);
                    padding: var(--ui-space-4xs, 0.146em) var(--ui-space-2xs, 0.382em);
                    font-family: inherit;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: var(
                        --ui-header-color,
                        var(
                            --ui-table-header-color,
                            var(--ui-color-text, oklch(0.96 0.01 260))
                        )
                    );
                    background: var(--ui-color-surface-hover, oklch(0.24 0.025 260));
                    border: 1px solid
                        var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
                    border-radius: var(--ui-radius-md, 0.236em);
                    cursor: pointer;
                    user-select: none;
                    transition:
                        background
                        var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                        color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
                    }

                    .btn-custom-cols:hover {
                        background: var(--ui-color-surface-active, oklch(0.28 0.03 260));
                        color: var(
                            --ui-header-color,
                            var(
                                --ui-table-header-color,
                                var(--ui-color-text, oklch(0.96 0.01 260))
                            )
                        );
                    }

                    .column-customizer-popover {
                        position: absolute;
                        top: calc(100% + var(--ui-space-4xs, 0.146em));
                        right: var(--ui-space-xs, 0.618em);
                        width: 240px;
                        background: var(
                            --ui-table-header-bg,
                            var(--ui-color-surface-elevated, oklch(0.22 0.025 260))
                        );
                        border: 1px solid var(--ui-color-border, oklch(0.32 0.03 260));
                        border-radius: var(--ui-radius-lg, 0.382em);
                        box-shadow: var(--ui-shadow-lg, 0 10px 25px rgba(0, 0, 0, 0.4));
                        padding: var(--ui-space-xs, 0.618em);
                        z-index: 50;
                        backdrop-filter: var(--ui-backdrop-filter, blur(16px));
                        display: none;
                        flex-direction: column;
                        gap: var(--ui-space-3xs, 0.236em);
                    }

                    .popover-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        font-size: 0.75rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                        color: var(
                            --ui-header-color,
                            var(
                                --ui-table-header-color,
                                var(--ui-color-text, oklch(0.96 0.01 260))
                            )
                        );
                        padding-bottom: var(--ui-space-4xs, 0.146em);
                        border-bottom: 1px solid
                            var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
                        }

                        .popover-list {
                            display: flex;
                            flex-direction: column;
                            gap: var(--ui-space-4xs, 0.146em);
                            max-height: 200px;
                            overflow-y: auto;
                        }

                        .popover-item {
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: var(--ui-space-3xs, 0.236em);
                            padding: var(--ui-space-4xs, 0.146em) 0;
                            font-size: 0.8rem;
                            color: var(--ui-color-text, oklch(0.96 0.01 260));
                        }

                        .popover-item label {
                            display: flex;
                            align-items: center;
                            gap: var(--ui-space-3xs, 0.236em);
                            cursor: pointer;
                            flex: 1;
                        }

                        .popover-item-btns {
                            display: flex;
                            align-items: center;
                            gap: 2px;
                        }

                        .btn-mini {
                            background: transparent;
                            border: 1px solid
                                var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
                            color: var(--ui-color-text-muted, oklch(0.7 0.02 260));
                            font-size: 0.65rem;
                            padding: 1px 4px;
                            border-radius: var(--ui-radius-sm, 0.146em);
                            cursor: pointer;
                        }

                        .btn-mini:hover {
                            color: var(--ui-color-text, oklch(0.96 0.01 260));
                            background: var(--ui-color-surface-hover, oklch(0.24 0.025 260));
                        }

                        .popover-footer {
                            display: flex;
                            justify-content: flex-end;
                            padding-top: var(--ui-space-4xs, 0.146em);
                            border-top: 1px solid
                                var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5));
                            }

                            .table-scroll-container {
                                flex: 1;
                                position: relative;
                                overflow-x: auto;
                                overflow-y: auto;
                                width: 100%;
                                max-height: 100%;
                                scrollbar-width: thin;
                                scrollbar-color: var(--ui-color-border, oklch(0.32 0.03 260))
                                    transparent;
                                }

                                table {
                                    width: 100%;
                                    border-collapse: collapse;
                                    border-spacing: 0;
                                    text-align: left;
                                    font-size: 0.875rem;
                                    color: var(
                                        --ui-table-color,
                                        var(--ui-color-text, oklch(0.96 0.01 260))
                                    );
                                    line-height: var(--ui-line-height-normal, 1.618);
                                }

                                .table-root.size-sm th,
                                .table-root.size-sm td,
                                .table-root.compact th,
                                .table-root.compact td {
                                    font-size: 0.75rem;
                                    padding: var(--ui-space-4xs, 0.146em) var(--ui-space-2xs, 0.382em);
                                }

                                .table-root.size-md th,
                                .table-root.size-md td {
                                    font-size: 0.875rem;
                                    padding: var(--ui-space-3xs, 0.236em) var(--ui-space-xs, 0.618em);
                                }

                                .table-root.size-lg th,
                                .table-root.size-lg td {
                                    font-size: 1rem;
                                    padding: var(--ui-space-2xs, 0.382em) var(--ui-space-sm, 1em);
                                }

                                thead {
                                    background: var(
                                        --ui-header-bg,
                                        var(
                                            --ui-table-header-bg,
                                            var(--ui-color-surface, oklch(0.14 0.02 260))
                                        )
                                    );
                                    color: var(--ui-header-color, var(--ui-table-header-color, inherit));
                                    border-bottom: var(
                                        --ui-header-border,
                                        1px solid var(
                                            --ui-table-border-color,
                                            var(--ui-color-border, oklch(0.32 0.03 260))
                                        )
                                    );
                                }

                                :host([sticky-header]) thead {
                                    position: sticky;
                                    top: 0;
                                    z-index: 2;
                                    backdrop-filter: var(--ui-backdrop-filter, blur(12px));
                                }

                                th {
                                    font-family: var(--ui-font-heading, inherit);
                                    font-weight: var(--ui-font-weight-bold, 600);
                                    color: var(
                                        --ui-header-color,
                                        var(
                                            --ui-table-header-color,
                                            var(--ui-color-text-muted, oklch(0.7 0.02 260))
                                        )
                                    );
                                    text-transform: uppercase;
                                    letter-spacing: 0.04em;
                                    white-space: nowrap;
                                    user-select: none;
                                    border-bottom: 1px solid
                                        var(
                                            --ui-table-border-color,
                                            var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5))
                                        );
                                    transition:
                                        background
                                        var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                                        color var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
                                    }

                                    .table-root.bordered th,
                                    .table-root.bordered td {
                                        border-right: 1px solid
                                            var(
                                                --ui-table-border-color,
                                                var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5))
                                            );
                                        }

                                        .table-root.bordered th:last-child,
                                        .table-root.bordered td:last-child {
                                            border-right: none;
                                        }

                                        th.sortable {
                                            cursor: pointer;
                                        }

                                        th.sortable:hover {
                                            background: var(--ui-color-surface-hover, oklch(0.24 0.025 260));
                                            color: var(--ui-color-text, oklch(0.96 0.01 260));
                                        }

                                        th.sortable:focus-visible {
                                            outline: 2px solid var(--ui-color-primary, oklch(0.65 0.24 260));
                                            outline-offset: -2px;
                                        }

                                        .th-content {
                                            display: inline-flex;
                                            align-items: center;
                                            gap: var(--ui-space-3xs, 0.236em);
                                            width: 100%;
                                        }

                                        .sort-icon {
                                            display: inline-flex;
                                            align-items: center;
                                            font-size: 0.7em;
                                            opacity: 0.35;
                                            color: currentColor;
                                            transition:
                                                opacity
                                                var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1)),
                                                transform
                                                var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
                                            }

                                            .sort-icon.active {
                                                opacity: 1;
                                                color: var(--ui-color-primary, oklch(0.65 0.19 230));
                                            }

                                            th.align-left,
                                            td.align-left {
                                                text-align: left;
                                            }
                                            th.align-center,
                                            td.align-center {
                                                text-align: center;
                                            }
                                            th.align-right,
                                            td.align-right {
                                                text-align: right;
                                            }

                                            th.align-center .th-content,
                                            td.align-center {
                                                justify-content: center;
                                            }
                                            th.align-right .th-content,
                                            td.align-right {
                                                justify-content: flex-end;
                                            }

                                            tbody tr {
                                                border-bottom: 1px solid
                                                    var(
                                                        --ui-table-border-color,
                                                        var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5))
                                                    );
                                                transition: background
                                                    var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
                                                }

                                                tbody tr:last-child {
                                                    border-bottom: none;
                                                }

                                                td {
                                                    border-bottom: 1px solid
                                                        var(
                                                            --ui-table-border-color,
                                                            var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5))
                                                        );
                                                    }

                                                    .table-root.striped tbody tr:nth-child(even) {
                                                        background: var(
                                                            --ui-table-row-stripe,
                                                            oklch(
                                                                from var(--ui-color-surface-elevated, oklch(0.22 0.025 260))
                                                                calc(l + 0.03)
                                                                c h
                                                            )
                                                        );
                                                    }

                                                    .table-root.hoverable tbody tr:hover,
                                                    tbody tr.selectable-row:hover {
                                                        background: var(
                                                            --ui-table-row-hover,
                                                            var(--ui-color-surface-hover, oklch(0.28 0.03 260))
                                                        ) !important;
                                                    }

                                                    tbody tr.selected {
                                                        background: var(
                                                            --ui-table-row-selected-bg,
                                                            var(--ui-color-primary-subtle, oklch(0.65 0.19 230 / 0.18))
                                                        ) !important;
                                                        color: var(--ui-color-text, oklch(0.98 0.01 260));
                                                    }

                                                    .selectable-row {
                                                        cursor: pointer;
                                                    }

                                                    .select-col {
                                                        width: var(--ui-space-lg, 2.618em);
                                                        text-align: center;
                                                        padding-left: var(--ui-space-3xs, 0.236em);
                                                        padding-right: var(--ui-space-3xs, 0.236em);
                                                    }

                                                    .table-checkbox {
                                                        cursor: pointer;
                                                        accent-color: var(--ui-color-primary, oklch(0.65 0.19 230));
                                                        width: 1.1em;
                                                        height: 1.1em;
                                                        vertical-align: middle;
                                                        margin: 0;
                                                    }

                                                    .empty-cell {
                                                        text-align: center;
                                                        padding: var(--ui-space-lg, 2.618em) var(--ui-space-sm, 1em);
                                                        color: var(--ui-color-text-muted, oklch(0.7 0.02 260));
                                                        font-style: italic;
                                                    }

                                                    .loading-overlay {
                                                        position: absolute;
                                                        inset: 0;
                                                        background: var(--ui-table-loading-bg, rgba(0, 0, 0, 0.4));
                                                        backdrop-filter: blur(2px);
                                                        display: flex;
                                                        align-items: center;
                                                        justify-content: center;
                                                        z-index: 10;
                                                        opacity: 1;
                                                        transition: opacity
                                                            var(--ui-transition-fast, 146ms cubic-bezier(0.4, 0, 0.2, 1));
                                                        }

                                                        .spinner {
                                                            width: var(--ui-space-md, 1.618em);
                                                            height: var(--ui-space-md, 1.618em);
                                                            border: 2px solid
                                                                var(--ui-color-primary-subtle, oklch(0.65 0.19 230 / 0.2));
                                                            border-top-color: var(--ui-color-primary, oklch(0.65 0.19 230));
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
                                                        }

                                                        .footer-bar {
                                                            padding: var(--ui-space-3xs, 0.236em) var(--ui-space-xs, 0.618em);
                                                            background: var(
                                                                --ui-table-footer-bar-bg,
                                                                var(
                                                                    --ui-card-footer-bg,
                                                                    var(--ui-color-surface, oklch(0.14 0.02 260))
                                                                )
                                                            );
                                                            border-top: var(
                                                                --ui-table-footer-border,
                                                                1px solid var(--ui-color-border-subtle, oklch(0.32 0.03 260 / 0.5))
                                                            );
                                                            font-size: 0.75rem;
                                                            color: var(
                                                                --ui-table-footer-color,
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

                                                        .footer-bar ui-pagination {
                                                            width: 100%;
                                                        }

                                                        .hidden-slot {
                                                            display: none !important;
                                                        }
                                                        `,
                                                    ];

                                                    size: Size = "md";
                                                    striped = false;
                                                    bordered = false;
                                                    hoverable = false;
                                                    compact = false;
                                                    stickyHeader = false;
                                                    selectable = false;
                                                    sortBy = "";
                                                    sortDirection:
                                                        TableSortDirection =
                                                            null;
                                                    rowKey = "id";
                                                    loading = false;
                                                    emptyText =
                                                        "No data available";
                                                    pagination = false;
                                                    paginationMode?: PaginationMode;
                                                    stepperFormat?: StepperFormat;
                                                    discretePages = true;
                                                    remote = false;
                                                    columnCustomization = false;
                                                    customizableColumns = false;

                                                    #data: T[] = [];
                                                    #rawUnsortedData: T[] = [];
                                                    #columns: TableColumn<T>[] =
                                                        [];
                                                    #originalColumns:
                                                        TableColumn<T>[] = [];
                                                    #selectedKeys: Set<string> =
                                                        new Set();
                                                    #pageSizeOptions: number[] =
                                                        [5, 10, 25, 50];
                                                    #customizerOpen = false;
                                                    #syncingHeader = false;

                                                    fetchPage?: (
                                                        params:
                                                            TableGetPageParams,
                                                    ) =>
                                                        | Promise<
                                                            {
                                                                data: T[];
                                                                total?: number;
                                                            }
                                                        >
                                                        | void;

                                                    private getRowKey(
                                                        row: T,
                                                        idx: number,
                                                    ): string {
                                                        const raw =
                                                            row[this.rowKey];
                                                        if (
                                                            raw !== undefined &&
                                                            raw !== null
                                                        ) {
                                                            return safeString(
                                                                raw,
                                                            );
                                                        }
                                                        return idx.toString();
                                                    }

                                                    get data(): T[] {
                                                        return this.#data;
                                                    }

                                                    set data(
                                                        newData: T[] | symbol,
                                                    ) {
                                                        if (
                                                            typeof newData ===
                                                                "symbol"
                                                        ) return;
                                                        const old = this.#data;
                                                        const next =
                                                            Array.isArray(
                                                                    newData,
                                                                )
                                                                ? [...newData]
                                                                : [];
                                                        this.#rawUnsortedData =
                                                            [...next];
                                                        this.#data = next;
                                                        this.requestUpdate(
                                                            "data",
                                                            old,
                                                        );
                                                    }

                                                    get columns(): TableColumn<
                                                        T
                                                    >[] {
                                                        return this.#columns;
                                                    }

                                                    set columns(
                                                        cols:
                                                            | TableColumn<T>[]
                                                            | symbol,
                                                    ) {
                                                        if (
                                                            typeof cols ===
                                                                "symbol"
                                                        ) return;
                                                        const old =
                                                            this.#columns;
                                                        this.#columns =
                                                            Array.isArray(cols)
                                                                ? cols.map((
                                                                    col,
                                                                ) => ({
                                                                    ...col,
                                                                }))
                                                                : [];
                                                        if (
                                                            this.#originalColumns
                                                                    .length ===
                                                                0 &&
                                                            this.#columns
                                                                    .length > 0
                                                        ) {
                                                            this.#originalColumns =
                                                                this.#columns
                                                                    .map((
                                                                        col,
                                                                    ) => ({
                                                                        ...col,
                                                                    }));
                                                        }
                                                        this.requestUpdate(
                                                            "columns",
                                                            old,
                                                        );
                                                    }

                                                    get selectedKeys(): string[] {
                                                        return Array.from(
                                                            this.#selectedKeys,
                                                        );
                                                    }

                                                    set selectedKeys(
                                                        keys: string[],
                                                    ) {
                                                        const old =
                                                            this.selectedKeys;
                                                        this.#selectedKeys =
                                                            new Set(
                                                                Array.isArray(
                                                                        keys,
                                                                    )
                                                                    ? keys
                                                                    : [],
                                                            );
                                                        this.requestUpdate(
                                                            "selectedKeys",
                                                            old,
                                                        );
                                                    }

                                                    get selectedRows(): T[] {
                                                        return this.#data
                                                            .filter((
                                                                row,
                                                                idx,
                                                            ) => this
                                                                .#selectedKeys
                                                                .has(
                                                                    this.getRowKey(
                                                                        row,
                                                                        idx,
                                                                    ),
                                                                )
                                                            );
                                                    }

                                                    set selectedRows(
                                                        rows: T[],
                                                    ) {
                                                        const old =
                                                            this.selectedKeys;
                                                        const keys =
                                                            (Array.isArray(rows)
                                                                ? rows
                                                                : []).map((
                                                                    row,
                                                                    idx,
                                                                ) => this
                                                                    .getRowKey(
                                                                        row,
                                                                        idx,
                                                                    )
                                                                );
                                                        this.#selectedKeys =
                                                            new Set(keys);
                                                        this.requestUpdate(
                                                            "selectedRows",
                                                            old,
                                                        );
                                                    }

                                                    get selectionMode():
                                                        | "single"
                                                        | "multiple" {
                                                        return this
                                                                .getAttribute(
                                                                    "selection-mode",
                                                                ) === "single"
                                                            ? "single"
                                                            : "multiple";
                                                    }

                                                    set selectionMode(
                                                        mode:
                                                            | "single"
                                                            | "multiple",
                                                    ) {
                                                        const next =
                                                            mode === "single"
                                                                ? "single"
                                                                : "multiple";
                                                        if (
                                                            this.getAttribute(
                                                                "selection-mode",
                                                            ) !== next
                                                        ) {
                                                            this.setAttribute(
                                                                "selection-mode",
                                                                next,
                                                            );
                                                        }
                                                    }

                                                    get page(): number {
                                                        return Math.max(
                                                            1,
                                                            this.getNumAttr(
                                                                "page",
                                                                1,
                                                            ),
                                                        );
                                                    }

                                                    set page(p: number | null) {
                                                        if (
                                                            p === null ||
                                                            typeof p !==
                                                                "number" ||
                                                            !Number.isFinite(p)
                                                        ) {
                                                            if (
                                                                this.hasAttribute(
                                                                    "page",
                                                                )
                                                            ) {
                                                                this.removeAttribute(
                                                                    "page",
                                                                );
                                                            }
                                                            return;
                                                        }
                                                        const next = String(
                                                            Math.max(
                                                                1,
                                                                Math.floor(p),
                                                            ),
                                                        );
                                                        if (
                                                            this.getAttribute(
                                                                "page",
                                                            ) !== next
                                                        ) {
                                                            this.setAttribute(
                                                                "page",
                                                                next,
                                                            );
                                                        }
                                                    }

                                                    get pageSize(): number {
                                                        return Math.max(
                                                            1,
                                                            this.getNumAttr(
                                                                "page-size",
                                                                10,
                                                            ),
                                                        );
                                                    }

                                                    set pageSize(
                                                        size: number | null,
                                                    ) {
                                                        if (
                                                            size === null ||
                                                            typeof size !==
                                                                "number" ||
                                                            !Number.isFinite(
                                                                size,
                                                            )
                                                        ) {
                                                            if (
                                                                this.hasAttribute(
                                                                    "page-size",
                                                                )
                                                            ) {
                                                                this.removeAttribute(
                                                                    "page-size",
                                                                );
                                                            }
                                                            return;
                                                        }
                                                        const next = String(
                                                            Math.max(
                                                                1,
                                                                Math.floor(
                                                                    size,
                                                                ),
                                                            ),
                                                        );
                                                        if (
                                                            this.getAttribute(
                                                                "page-size",
                                                            ) !== next
                                                        ) {
                                                            this.setAttribute(
                                                                "page-size",
                                                                next,
                                                            );
                                                        }
                                                    }

                                                    get pageSizeOptions(): number[] {
                                                        return this
                                                            .#pageSizeOptions;
                                                    }

                                                    set pageSizeOptions(
                                                        options: number[],
                                                    ) {
                                                        if (
                                                            !Array.isArray(
                                                                options,
                                                            ) ||
                                                            options.length === 0
                                                        ) return;
                                                        const old =
                                                            this.#pageSizeOptions;
                                                        this.#pageSizeOptions =
                                                            [...options];
                                                        this.requestUpdate(
                                                            "pageSizeOptions",
                                                            old,
                                                        );
                                                    }

                                                    get total(): number {
                                                        if (
                                                            this.hasAttribute(
                                                                "total",
                                                            )
                                                        ) {
                                                            return this
                                                                .getNumAttr(
                                                                    "total",
                                                                    this.#data
                                                                        .length,
                                                                );
                                                        }
                                                        return this.#data
                                                            .length;
                                                    }

                                                    set total(
                                                        t: number | null,
                                                    ) {
                                                        if (
                                                            t === null ||
                                                            typeof t !==
                                                                "number" ||
                                                            !Number.isFinite(t)
                                                        ) {
                                                            if (
                                                                this.hasAttribute(
                                                                    "total",
                                                                )
                                                            ) {
                                                                this.removeAttribute(
                                                                    "total",
                                                                );
                                                            }
                                                            return;
                                                        }
                                                        const next = String(
                                                            Math.max(
                                                                0,
                                                                Math.floor(t),
                                                            ),
                                                        );
                                                        if (
                                                            this.getAttribute(
                                                                "total",
                                                            ) !== next
                                                        ) {
                                                            this.setAttribute(
                                                                "total",
                                                                next,
                                                            );
                                                        }
                                                    }

                                                    get totalPages(): number {
                                                        return Math.max(
                                                            1,
                                                            Math.ceil(
                                                                this.total /
                                                                    this.pageSize,
                                                            ),
                                                        );
                                                    }

                                                    get showHeader(): boolean {
                                                        if (
                                                            this.hasAttribute(
                                                                "hide-header",
                                                            )
                                                        ) {
                                                            return this
                                                                .getAttribute(
                                                                    "hide-header",
                                                                ) === "false";
                                                        }
                                                        if (
                                                            this.hasAttribute(
                                                                "show-header",
                                                            )
                                                        ) {
                                                            return this
                                                                .getAttribute(
                                                                    "show-header",
                                                                ) !== "false";
                                                        }
                                                        return true;
                                                    }

                                                    set showHeader(v: boolean) {
                                                        if (
                                                            this.#syncingHeader
                                                        ) return;
                                                        this.#syncingHeader =
                                                            true;
                                                        try {
                                                            if (v) {
                                                                if (
                                                                    this.hasAttribute(
                                                                        "hide-header",
                                                                    )
                                                                ) {
                                                                    this.removeAttribute(
                                                                        "hide-header",
                                                                    );
                                                                }
                                                                if (
                                                                    this.getAttribute(
                                                                        "show-header",
                                                                    ) !== "true"
                                                                ) {
                                                                    this.setAttribute(
                                                                        "show-header",
                                                                        "true",
                                                                    );
                                                                }
                                                            } else {
                                                                if (
                                                                    !this
                                                                        .hasAttribute(
                                                                            "hide-header",
                                                                        ) ||
                                                                    this.getAttribute(
                                                                            "hide-header",
                                                                        ) ===
                                                                        "false"
                                                                ) {
                                                                    this.setAttribute(
                                                                        "hide-header",
                                                                        "",
                                                                    );
                                                                }
                                                                if (
                                                                    this.getAttribute(
                                                                        "show-header",
                                                                    ) !==
                                                                        "false"
                                                                ) {
                                                                    this.setAttribute(
                                                                        "show-header",
                                                                        "false",
                                                                    );
                                                                }
                                                            }
                                                        } finally {
                                                            this.#syncingHeader =
                                                                false;
                                                        }
                                                        this.requestUpdate(
                                                            "showHeader",
                                                            !v,
                                                        );
                                                    }

                                                    get hideHeader(): boolean {
                                                        return !this.showHeader;
                                                    }

                                                    set hideHeader(v: boolean) {
                                                        this.showHeader = !v;
                                                    }

                                                    override connectedCallback(): void {
                                                        super
                                                            .connectedCallback();
                                                        document
                                                            .addEventListener(
                                                                "pointerdown",
                                                                this.#onGlobalPointerDown,
                                                            );
                                                        document
                                                            .addEventListener(
                                                                "keydown",
                                                                this.#onGlobalKeyDown,
                                                            );
                                                    }

                                                    override disconnectedCallback(): void {
                                                        document
                                                            .removeEventListener(
                                                                "pointerdown",
                                                                this.#onGlobalPointerDown,
                                                            );
                                                        document
                                                            .removeEventListener(
                                                                "keydown",
                                                                this.#onGlobalKeyDown,
                                                            );
                                                        super
                                                            .disconnectedCallback();
                                                    }

                                                    protected override willUpdate(
                                                        changed: PropertyValues,
                                                    ): void {
                                                        if (
                                                            !this.remote &&
                                                            (changed.has(
                                                                "sortBy",
                                                            ) ||
                                                                changed.has(
                                                                    "sortDirection",
                                                                ) ||
                                                                changed.has(
                                                                    "data",
                                                                ))
                                                        ) {
                                                            this.#data = this
                                                                .#sortedData();
                                                        }
                                                    }

                                                    protected override updated(): void {
                                                        const selectAll = this
                                                            .renderRoot
                                                            .querySelector(
                                                                ".select-all-cb",
                                                            );
                                                        if (
                                                            !(selectAll instanceof
                                                                HTMLInputElement)
                                                        ) return;
                                                        const allSelected =
                                                            this.#data.length >
                                                                0 &&
                                                            this.#data.every((
                                                                row,
                                                                idx,
                                                            ) => this
                                                                .#selectedKeys
                                                                .has(
                                                                    this.getRowKey(
                                                                        row,
                                                                        idx,
                                                                    ),
                                                                )
                                                            );
                                                        const someSelected =
                                                            !allSelected &&
                                                            this.#data.some((
                                                                row,
                                                                idx,
                                                            ) => this
                                                                .#selectedKeys
                                                                .has(
                                                                    this.getRowKey(
                                                                        row,
                                                                        idx,
                                                                    ),
                                                                )
                                                            );
                                                        selectAll
                                                            .indeterminate =
                                                                someSelected;
                                                    }

                                                    #sortedData(): T[] {
                                                        if (
                                                            !this.sortBy ||
                                                            !this.sortDirection
                                                        ) {
                                                            return [
                                                                ...this
                                                                    .#rawUnsortedData,
                                                            ];
                                                        }
                                                        return sortData(
                                                            this.#rawUnsortedData,
                                                            this.sortBy,
                                                            this.sortDirection,
                                                        );
                                                    }

                                                    #columnLabel(
                                                        key: string,
                                                    ): string {
                                                        return key.charAt(0)
                                                            .toUpperCase() +
                                                            key.slice(1)
                                                                .replace(
                                                                    /([A-Z])/g,
                                                                    " $1",
                                                                );
                                                    }

                                                    #allColumns(): TableColumn<
                                                        T
                                                    >[] {
                                                        if (
                                                            this.#columns
                                                                .length > 0
                                                        ) return this.#columns;
                                                        const first =
                                                            this.#data[0];
                                                        if (!first) return [];
                                                        return Object.keys(
                                                            first,
                                                        ).map((key) => ({
                                                            key,
                                                            label: this
                                                                .#columnLabel(
                                                                    key,
                                                                ),
                                                            sortable: true,
                                                        }));
                                                    }

                                                    public getPage(
                                                        options?: Partial<
                                                            TableGetPageParams
                                                        >,
                                                    ): void {
                                                        if (
                                                            options?.page !==
                                                                undefined
                                                        ) {
                                                            this.page =
                                                                options.page;
                                                        }
                                                        if (
                                                            options
                                                                ?.pageSize !==
                                                                undefined
                                                        ) {
                                                            this.pageSize =
                                                                options
                                                                    .pageSize;
                                                        }
                                                        if (
                                                            options?.sortBy !==
                                                                undefined
                                                        ) {
                                                            this.sortBy =
                                                                options.sortBy;
                                                        }
                                                        if (
                                                            options
                                                                ?.sortDirection !==
                                                                undefined
                                                        ) {
                                                            this.sortDirection =
                                                                options
                                                                    .sortDirection;
                                                        }

                                                        const params:
                                                            TableGetPageParams =
                                                                {
                                                                    page:
                                                                        this.page,
                                                                    pageSize:
                                                                        this.pageSize,
                                                                    sortBy:
                                                                        this.sortBy,
                                                                    sortDirection:
                                                                        this.sortDirection,
                                                                };
                                                        const detail:
                                                            TableGetPageEventDetail<
                                                                T
                                                            > = {
                                                                ...params,
                                                                resolve: (
                                                                    result,
                                                                ) => {
                                                                    if (
                                                                        result
                                                                            .data
                                                                    ) {
                                                                        this.data =
                                                                            result
                                                                                .data;
                                                                    }
                                                                    if (
                                                                        result
                                                                            .total !==
                                                                            undefined
                                                                    ) {
                                                                        this.total =
                                                                            result
                                                                                .total;
                                                                    }
                                                                    this.loading =
                                                                        false;
                                                                },
                                                            };
                                                        this.emit(
                                                            "ui-get-page",
                                                            detail,
                                                        );

                                                        if (
                                                            typeof this
                                                                .fetchPage ===
                                                                "function"
                                                        ) {
                                                            this.loading = true;
                                                            void Promise
                                                                .resolve(
                                                                    this.fetchPage(
                                                                        params,
                                                                    ),
                                                                )
                                                                .then((res) => {
                                                                    if (
                                                                        res &&
                                                                        res.data
                                                                    ) {
                                                                        this.data =
                                                                            res.data;
                                                                        if (
                                                                            res.total !==
                                                                                undefined
                                                                        ) {
                                                                            this.total =
                                                                                res.total;
                                                                        }
                                                                    }
                                                                })
                                                                .catch(() => {
                                                                    // ignore fetch error
                                                                })
                                                                .finally(() => {
                                                                    this.loading =
                                                                        false;
                                                                });
                                                        }
                                                    }

                                                    public sort(
                                                        columnKey: string,
                                                        direction?:
                                                            TableSortDirection,
                                                    ): void {
                                                        let nextDirection:
                                                            TableSortDirection =
                                                                direction !==
                                                                        undefined
                                                                    ? direction
                                                                    : null;
                                                        if (
                                                            direction ===
                                                                undefined
                                                        ) {
                                                            if (
                                                                this.sortBy ===
                                                                    columnKey
                                                            ) {
                                                                if (
                                                                    this.sortDirection ===
                                                                        "asc"
                                                                ) {
                                                                    nextDirection =
                                                                        "desc";
                                                                } else if (
                                                                    this.sortDirection ===
                                                                        "desc"
                                                                ) {
                                                                    nextDirection =
                                                                        null;
                                                                } else {nextDirection =
                                                                        "asc";}
                                                            } else {nextDirection =
                                                                    "asc";}
                                                        }

                                                        this.sortBy =
                                                            nextDirection
                                                                ? columnKey
                                                                : "";
                                                        this.sortDirection =
                                                            nextDirection;

                                                        if (
                                                            this.pagination &&
                                                            this.page !== 1
                                                        ) this.page = 1;

                                                        if (!this.remote) {
                                                            this.applySorting(
                                                                true,
                                                            );
                                                        } else {
                                                            this.requestUpdate();
                                                            const detail:
                                                                TableSortEventDetail<
                                                                    T
                                                                > = {
                                                                    column:
                                                                        this.sortBy,
                                                                    direction:
                                                                        this.sortDirection,
                                                                    data: [
                                                                        ...this
                                                                            .#data,
                                                                    ],
                                                                };
                                                            this.emit(
                                                                "ui-sort",
                                                                detail,
                                                            );
                                                        }
                                                        this.getPage();
                                                    }

                                                    private applySorting(
                                                        emitEvent = true,
                                                    ): void {
                                                        const old = this.#data;
                                                        this.#data = this
                                                            .#sortedData();
                                                        this.requestUpdate(
                                                            "data",
                                                            old,
                                                        );
                                                        if (emitEvent) {
                                                            const detail:
                                                                TableSortEventDetail<
                                                                    T
                                                                > = {
                                                                    column:
                                                                        this.sortBy,
                                                                    direction:
                                                                        this.sortDirection,
                                                                    data: [
                                                                        ...this
                                                                            .#data,
                                                                    ],
                                                                };
                                                            this.emit(
                                                                "ui-sort",
                                                                detail,
                                                            );
                                                        }
                                                    }

                                                    public setPage(
                                                        newPage: number,
                                                    ): void {
                                                        const target = Math.max(
                                                            1,
                                                            Math.min(
                                                                newPage,
                                                                this.totalPages,
                                                            ),
                                                        );
                                                        if (
                                                            this.page === target
                                                        ) return;
                                                        this.page = target;
                                                        const detail:
                                                            TablePageEventDetail =
                                                                {
                                                                    page:
                                                                        this.page,
                                                                    pageSize:
                                                                        this.pageSize,
                                                                    totalPages:
                                                                        this.totalPages,
                                                                    total:
                                                                        this.total,
                                                                };
                                                        this.emit(
                                                            "ui-page-change",
                                                            detail,
                                                        );
                                                        this.getPage();
                                                    }

                                                    public setPageSize(
                                                        newPageSize: number,
                                                    ): void {
                                                        const size = Math.max(
                                                            1,
                                                            newPageSize,
                                                        );
                                                        if (
                                                            this.pageSize ===
                                                                size
                                                        ) return;
                                                        this.pageSize = size;
                                                        this.page = 1;
                                                        const detail:
                                                            TablePageEventDetail =
                                                                {
                                                                    page:
                                                                        this.page,
                                                                    pageSize:
                                                                        this.pageSize,
                                                                    totalPages:
                                                                        this.totalPages,
                                                                    total:
                                                                        this.total,
                                                                };
                                                        this.emit(
                                                            "ui-page-change",
                                                            detail,
                                                        );
                                                        this.getPage();
                                                    }

                                                    public nextPage(): void {
                                                        if (
                                                            this.page <
                                                                this.totalPages
                                                        ) {
                                                            this.setPage(
                                                                this.page + 1,
                                                            );
                                                        }
                                                    }

                                                    public prevPage(): void {
                                                        if (this.page > 1) {
                                                            this.setPage(
                                                                this.page - 1,
                                                            );
                                                        }
                                                    }

                                                    #popover():
                                                        | HTMLElement
                                                        | null {
                                                        const popover = this
                                                            .renderRoot
                                                            .querySelector(
                                                                ".column-customizer-popover",
                                                            );
                                                        return popover instanceof
                                                                HTMLElement
                                                            ? popover
                                                            : null;
                                                    }

                                                    public openCustomizer(): void {
                                                        if (
                                                            this.#customizerOpen
                                                        ) return;
                                                        this.#customizerOpen =
                                                            true;
                                                        const popover = this
                                                            .#popover();
                                                        if (!popover) return;
                                                        popover.style.display =
                                                            "flex";
                                                        if (
                                                            typeof popover
                                                                .showPopover ===
                                                                "function"
                                                        ) {
                                                            try {
                                                                popover
                                                                    .showPopover();
                                                            } catch {
                                                                // ignore
                                                            }
                                                        }
                                                        const firstInput =
                                                            popover
                                                                .querySelector(
                                                                    "input, button",
                                                                );
                                                        if (
                                                            firstInput instanceof
                                                                HTMLElement
                                                        ) firstInput.focus();
                                                    }

                                                    public closeCustomizer(): void {
                                                        if (
                                                            !this
                                                                .#customizerOpen
                                                        ) return;
                                                        const popover = this
                                                            .#popover();
                                                        this.#customizerOpen =
                                                            false;
                                                        const focusedInside =
                                                            popover !== null &&
                                                            this.shadow
                                                                    .activeElement !==
                                                                null &&
                                                            popover.contains(
                                                                this.shadow
                                                                    .activeElement,
                                                            );
                                                        if (popover) {
                                                            popover.style
                                                                .display =
                                                                    "none";
                                                            if (
                                                                typeof popover
                                                                    .hidePopover ===
                                                                    "function"
                                                            ) {
                                                                try {
                                                                    popover
                                                                        .hidePopover();
                                                                } catch {
                                                                    // ignore
                                                                }
                                                            }
                                                        }
                                                        if (focusedInside) {
                                                            const customizerBtn =
                                                                this.renderRoot
                                                                    .querySelector(
                                                                        ".btn-custom-cols",
                                                                    );
                                                            if (
                                                                customizerBtn instanceof
                                                                    HTMLElement
                                                            ) {
                                                                customizerBtn
                                                                    .focus();
                                                            }
                                                        }
                                                    }

                                                    public toggleCustomizer(): void {
                                                        if (
                                                            this.#customizerOpen
                                                        ) {
                                                            this.closeCustomizer();
                                                        } else {this
                                                                .openCustomizer();}
                                                    }

                                                    #onGlobalPointerDown = (
                                                        event: Event,
                                                    ): void => {
                                                        if (
                                                            !this
                                                                .#customizerOpen
                                                        ) return;
                                                        const path = event
                                                            .composedPath();
                                                        const popover = this
                                                            .#popover();
                                                        const customizerBtn =
                                                            this.renderRoot
                                                                .querySelector(
                                                                    ".btn-custom-cols",
                                                                );
                                                        if (
                                                            popover &&
                                                            customizerBtn &&
                                                            !path.includes(
                                                                popover,
                                                            ) &&
                                                            !path.includes(
                                                                customizerBtn,
                                                            )
                                                        ) {
                                                            this.closeCustomizer();
                                                        }
                                                    };

                                                    #onGlobalKeyDown = (
                                                        event: KeyboardEvent,
                                                    ): void => {
                                                        if (
                                                            !this
                                                                .#customizerOpen ||
                                                            event.key !==
                                                                "Escape"
                                                        ) return;
                                                        this.closeCustomizer();
                                                        const btn = this
                                                            .renderRoot
                                                            .querySelector(
                                                                ".btn-custom-cols",
                                                            );
                                                        if (
                                                            btn instanceof
                                                                HTMLElement
                                                        ) btn.focus();
                                                    };

                                                    #onCustomizerClick = (
                                                        event: Event,
                                                    ): void => {
                                                        event.stopPropagation();
                                                        this.toggleCustomizer();
                                                    };

                                                    #onPopoverKeyDown = (
                                                        event: KeyboardEvent,
                                                    ): void => {
                                                        if (
                                                            event.key !==
                                                                "Escape"
                                                        ) return;
                                                        event.stopPropagation();
                                                        this.closeCustomizer();
                                                        const btn = this
                                                            .renderRoot
                                                            .querySelector(
                                                                ".btn-custom-cols",
                                                            );
                                                        if (
                                                            btn instanceof
                                                                HTMLElement
                                                        ) btn.focus();
                                                    };

                                                    #onPopoverFocusOut = (
                                                        event: FocusEvent,
                                                    ): void => {
                                                        const popover =
                                                            event.currentTarget;
                                                        if (
                                                            !(popover instanceof
                                                                HTMLElement)
                                                        ) return;
                                                        const related =
                                                            event.relatedTarget;
                                                        const customizerBtn =
                                                            this.renderRoot
                                                                .querySelector(
                                                                    ".btn-custom-cols",
                                                                );
                                                        if (
                                                            related instanceof
                                                                Node &&
                                                            (popover.contains(
                                                                related,
                                                            ) ||
                                                                related ===
                                                                    customizerBtn)
                                                        ) return;
                                                        setTimeout(() => {
                                                            if (
                                                                !this
                                                                    .#customizerOpen
                                                            ) return;
                                                            const active =
                                                                this.shadow
                                                                    .activeElement ||
                                                                document
                                                                    .activeElement;
                                                            const currentPopover =
                                                                this.#popover();
                                                            const currentBtn =
                                                                this.renderRoot
                                                                    .querySelector(
                                                                        ".btn-custom-cols",
                                                                    );
                                                            if (
                                                                currentPopover &&
                                                                active instanceof
                                                                    Node &&
                                                                !currentPopover
                                                                    .contains(
                                                                        active,
                                                                    ) &&
                                                                active !==
                                                                    currentBtn
                                                            ) {
                                                                this.closeCustomizer();
                                                            }
                                                        }, 50);
                                                    };

                                                    public toggleColumnVisibility(
                                                        columnKey: string,
                                                    ): void {
                                                        const col = this
                                                            .#columns.find((
                                                                item,
                                                            ) => item.key ===
                                                                columnKey
                                                            );
                                                        if (!col) return;
                                                        col.hidden = !col
                                                            .hidden;
                                                        this.emitColumnsChange();
                                                        this.requestUpdate(
                                                            "columns",
                                                            null,
                                                        );
                                                    }

                                                    public setColumnVisibility(
                                                        columnKey: string,
                                                        visible: boolean,
                                                    ): void {
                                                        const col = this
                                                            .#columns.find((
                                                                item,
                                                            ) => item.key ===
                                                                columnKey
                                                            );
                                                        if (
                                                            !col ||
                                                            col.hidden !==
                                                                visible
                                                        ) return;
                                                        col.hidden = !visible;
                                                        this.emitColumnsChange();
                                                        this.requestUpdate(
                                                            "columns",
                                                            null,
                                                        );
                                                    }

                                                    public reorderColumn(
                                                        fromIndex: number,
                                                        toIndex: number,
                                                    ): void {
                                                        if (
                                                            fromIndex < 0 ||
                                                            fromIndex >=
                                                                this.#columns
                                                                    .length ||
                                                            toIndex < 0 ||
                                                            toIndex >=
                                                                this.#columns
                                                                    .length ||
                                                            fromIndex ===
                                                                toIndex
                                                        ) {
                                                            return;
                                                        }
                                                        const [moved] = this
                                                            .#columns.splice(
                                                                fromIndex,
                                                                1,
                                                            );
                                                        if (!moved) return;
                                                        this.#columns.splice(
                                                            toIndex,
                                                            0,
                                                            moved,
                                                        );
                                                        this.emitColumnsChange();
                                                        this.requestUpdate(
                                                            "columns",
                                                            null,
                                                        );
                                                    }

                                                    public resetColumns(): void {
                                                        if (
                                                            this.#originalColumns
                                                                .length === 0
                                                        ) return;
                                                        const old =
                                                            this.#columns;
                                                        this.#columns = this
                                                            .#originalColumns
                                                            .map((col) => ({
                                                                ...col,
                                                            }));
                                                        this.emitColumnsChange();
                                                        this.requestUpdate(
                                                            "columns",
                                                            old,
                                                        );
                                                    }

                                                    private emitColumnsChange(): void {
                                                        const detail:
                                                            TableColumnsChangeEventDetail<
                                                                T
                                                            > = {
                                                                columns: [
                                                                    ...this
                                                                        .#columns,
                                                                ],
                                                            };
                                                        this.emit(
                                                            "ui-columns-change",
                                                            detail,
                                                        );
                                                    }

                                                    public toggleRowSelection(
                                                        rowKey: string,
                                                        row?: T,
                                                        index?: number,
                                                    ): void {
                                                        if (!this.selectable) {
                                                            return;
                                                        }
                                                        const old =
                                                            this.selectedKeys;
                                                        if (
                                                            this.selectionMode ===
                                                                "single"
                                                        ) {
                                                            if (
                                                                this.#selectedKeys
                                                                    .has(rowKey)
                                                            ) {
                                                                this.#selectedKeys
                                                                    .clear();
                                                            } else {
                                                                this.#selectedKeys
                                                                    .clear();
                                                                this.#selectedKeys
                                                                    .add(
                                                                        rowKey,
                                                                    );
                                                            }
                                                        } else if (
                                                            this.#selectedKeys
                                                                .has(rowKey)
                                                        ) {
                                                            this.#selectedKeys
                                                                .delete(rowKey);
                                                        } else {this
                                                                .#selectedKeys
                                                                .add(rowKey);}
                                                        this.emitSelectionChange(
                                                            row,
                                                            index,
                                                        );
                                                        this.requestUpdate(
                                                            "selectedKeys",
                                                            old,
                                                        );
                                                    }

                                                    public selectAllRows(): void {
                                                        if (
                                                            !this.selectable ||
                                                            this.selectionMode ===
                                                                "single"
                                                        ) return;
                                                        const old =
                                                            this.selectedKeys;
                                                        this.#selectedKeys =
                                                            new Set(
                                                                this.#data.map((
                                                                    row,
                                                                    idx,
                                                                ) => this
                                                                    .getRowKey(
                                                                        row,
                                                                        idx,
                                                                    )
                                                                ),
                                                            );
                                                        this.emitSelectionChange();
                                                        this.requestUpdate(
                                                            "selectedKeys",
                                                            old,
                                                        );
                                                    }

                                                    public clearSelection(): void {
                                                        if (!this.selectable) {
                                                            return;
                                                        }
                                                        const old =
                                                            this.selectedKeys;
                                                        this.#selectedKeys
                                                            .clear();
                                                        this.emitSelectionChange();
                                                        this.requestUpdate(
                                                            "selectedKeys",
                                                            old,
                                                        );
                                                    }

                                                    private emitSelectionChange(
                                                        row?: T,
                                                        index?: number,
                                                    ): void {
                                                        const detail:
                                                            TableSelectionEventDetail<
                                                                T
                                                            > = {
                                                                selectedKeys:
                                                                    this.selectedKeys,
                                                                selectedRows:
                                                                    this.selectedRows,
                                                                row,
                                                                index,
                                                            };
                                                        this.emit(
                                                            "ui-selection-change",
                                                            detail,
                                                        );
                                                    }

                                                    #onSlotChange =
                                                        (): void => {
                                                            if (
                                                                this.#data
                                                                    .length ===
                                                                    0
                                                            ) {
                                                                this.requestUpdate();
                                                            }
                                                        };

                                                    #cellContent(
                                                        col: TableColumn<T>,
                                                        row: T,
                                                        index: number,
                                                    ): string | HTMLElement {
                                                        if (!col.formatter) {
                                                            return safeString(
                                                                row[col.key],
                                                            );
                                                        }
                                                        try {
                                                            const result = col
                                                                .formatter(
                                                                    row[
                                                                        col.key
                                                                    ],
                                                                    row,
                                                                    index,
                                                                );
                                                            if (
                                                                result instanceof
                                                                    HTMLElement
                                                            ) return result;
                                                            return safeString(
                                                                result,
                                                            );
                                                        } catch {
                                                            return safeString(
                                                                row[col.key],
                                                            );
                                                        }
                                                    }

                                                    #renderHeader(
                                                        activeCols: TableColumn<
                                                            T
                                                        >[],
                                                        allSelected: boolean,
                                                    ) {
                                                        return html`
                                                            <thead part="thead">
                                                                <tr role="row">
                                                                    ${this
                                                                            .selectable
                                                                        ? html`
                                                                            <th class="select-col" scope="col" part="select-all-header">
                                                                                ${this
                                                                                        .selectionMode ===
                                                                                        "multiple"
                                                                                    ? html`
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            class="table-checkbox select-all-cb"
                                                                                            .checked="${allSelected}"
                                                                                            title="Select All"
                                                                                            aria-label="Select All"
                                                                                            part="checkbox"
                                                                                            @change="${(
                                                                                                event:
                                                                                                    Event,
                                                                                            ) => {
                                                                                                event
                                                                                                    .stopPropagation();
                                                                                                const input =
                                                                                                    event
                                                                                                        .currentTarget;
                                                                                                if (
                                                                                                    input instanceof
                                                                                                        HTMLInputElement &&
                                                                                                    input
                                                                                                        .checked
                                                                                                ) {
                                                                                                    this.selectAllRows();
                                                                                                } else {this
                                                                                                        .clearSelection();}
                                                                                            }}"
                                                                                        />
                                                                                    `
                                                                                    : nothing}
                                                                            </th>
                                                                        `
                                                                        : nothing} ${activeCols
                                                                        .map(
                                                                            (
                                                                                col,
                                                                            ) => {
                                                                                const sorted =
                                                                                    this.sortBy ===
                                                                                        col.key;
                                                                                const asc =
                                                                                    sorted &&
                                                                                    this.sortDirection ===
                                                                                        "asc";
                                                                                const desc =
                                                                                    sorted &&
                                                                                    this.sortDirection ===
                                                                                        "desc";
                                                                                const sortIcon =
                                                                                    asc
                                                                                        ? "▲"
                                                                                        : desc
                                                                                        ? "▼"
                                                                                        : col
                                                                                                .sortable
                                                                                        ? "▲"
                                                                                        : "";
                                                                                return html`
                                                                                    <th
                                                                                        class="${col
                                                                                                .sortable
                                                                                            ? "sortable"
                                                                                            : ""} align-${col
                                                                                            .align ??
                                                                                            "left"}"
                                                                                        data-key="${col
                                                                                            .key}"
                                                                                        scope="col"
                                                                                        style="${ifDefined(
                                                                                            col
                                                                                                    .width
                                                                                                ? `width: ${col.width}`
                                                                                                : undefined,
                                                                                        )}"
                                                                                        part="th"
                                                                                        role="columnheader"
                                                                                        tabindex="${ifDefined(
                                                                                            col.sortable
                                                                                                ? 0
                                                                                                : undefined,
                                                                                        )}"
                                                                                        aria-sort="${asc
                                                                                            ? "ascending"
                                                                                            : desc
                                                                                            ? "descending"
                                                                                            : "none"}"
                                                                                        @click="${() => {
                                                                                            if (
                                                                                                col.sortable
                                                                                            ) {
                                                                                                this.sort(
                                                                                                    col.key,
                                                                                                );
                                                                                            }
                                                                                        }}"
                                                                                        @keydown="${(
                                                                                            event: KeyboardEvent,
                                                                                        ) => {
                                                                                            if (
                                                                                                col.sortable &&
                                                                                                (event.key ===
                                                                                                    "Enter" ||
                                                                                                    event.key ===
                                                                                                        " ")
                                                                                            ) {
                                                                                                event.preventDefault();
                                                                                                this.sort(
                                                                                                    col.key,
                                                                                                );
                                                                                            }
                                                                                        }}"
                                                                                    >
                                                                                        <div class="th-content">
                                                                                            <span>${col
                                                                                                .label ??
                                                                                                col.key}</span>
                                                                                            ${col
                                                                                                    .sortable
                                                                                                ? html`
                                                                                                    <span class="sort-icon ${sorted
                                                                                                        ? "active"
                                                                                                        : ""}">${sortIcon}</span>
                                                                                                `
                                                                                                : nothing}
                                                                                        </div>
                                                                                    </th>
                                                                                `;
                                                                            },
                                                                        )}
                                                                </tr>
                                                            </thead>
                                                        `;
                                                    }

                                                    #renderRow(
                                                        row: T,
                                                        index: number,
                                                        activeCols: TableColumn<
                                                            T
                                                        >[],
                                                    ) {
                                                        const key = this
                                                            .getRowKey(
                                                                row,
                                                                index,
                                                            );
                                                        const selected = this
                                                            .#selectedKeys.has(
                                                                key,
                                                            );
                                                        const onRowClick = (
                                                            event: Event,
                                                        ): void => {
                                                            const target =
                                                                event.target;
                                                            if (
                                                                !(target instanceof
                                                                    HTMLElement)
                                                            ) return;
                                                            if (
                                                                target
                                                                        .tagName ===
                                                                    "INPUT" ||
                                                                target
                                                                        .tagName ===
                                                                    "BUTTON" ||
                                                                target
                                                                        .tagName ===
                                                                    "A"
                                                            ) return;
                                                            if (
                                                                this.selectable
                                                            ) {
                                                                this.toggleRowSelection(
                                                                    key,
                                                                    row,
                                                                    index,
                                                                );
                                                            }
                                                            this.emit(
                                                                "ui-row-click",
                                                                {
                                                                    row,
                                                                    index,
                                                                    key,
                                                                },
                                                            );
                                                        };
                                                        return html`
                                                            <tr
                                                                class="${this
                                                                        .selectable
                                                                    ? "selectable-row"
                                                                    : ""} ${selected
                                                                    ? "selected"
                                                                    : ""}"
                                                                data-key="${key}"
                                                                data-index="${index}"
                                                                role="row"
                                                                aria-selected="${selected
                                                                    ? "true"
                                                                    : "false"}"
                                                                @click="${onRowClick}"
                                                            >
                                                                ${this
                                                                        .selectable
                                                                    ? html`
                                                                        <td class="select-col" part="select-cell">
                                                                            <input
                                                                                type="checkbox"
                                                                                class="table-checkbox row-cb"
                                                                                data-key="${key}"
                                                                                data-index="${index}"
                                                                                .checked="${selected}"
                                                                                aria-label="${`Select row ${index + 1}`}"
                                                                                part="checkbox"
                                                                                @change="${(
                                                                                    event:
                                                                                        Event,
                                                                                ) => {
                                                                                    event
                                                                                        .stopPropagation();
                                                                                    this.toggleRowSelection(
                                                                                        key,
                                                                                        row,
                                                                                        index,
                                                                                    );
                                                                                }}"
                                                                            />
                                                                        </td>
                                                                    `
                                                                    : nothing} ${activeCols
                                                                    .map(
                                                                        (
                                                                            col,
                                                                        ) => {
                                                                            const content =
                                                                                this.#cellContent(
                                                                                    col,
                                                                                    row,
                                                                                    index,
                                                                                );
                                                                            return html`
                                                                                <td class="align-${col
                                                                                    .align ??
                                                                                    "left"}" part="td" role="cell">${content}</td>
                                                                            `;
                                                                        },
                                                                    )}
                                                            </tr>
                                                        `;
                                                    }

                                                    #renderCustomizer(
                                                        allCols: TableColumn<
                                                            T
                                                        >[],
                                                        activeCount: number,
                                                    ) {
                                                        return html`
                                                            <button
                                                                type="button"
                                                                class="btn-custom-cols"
                                                                part="column-customizer-btn"
                                                                title="Customize Columns"
                                                                aria-label="Customize Columns"
                                                                aria-haspopup="dialog"
                                                                aria-expanded="${this
                                                                        .#customizerOpen
                                                                    ? "true"
                                                                    : "false"}"
                                                                @click="${this
                                                                    .#onCustomizerClick}"
                                                            >
                                                                <span>Columns (${activeCount}/${allCols
                                                                    .length})</span>
                                                                <span aria-hidden="true">⚙</span>
                                                            </button>
                                                            <div
                                                                class="column-customizer-popover"
                                                                part="column-customizer-popover"
                                                                role="dialog"
                                                                aria-label="Customize Columns"
                                                                style="${this
                                                                        .#customizerOpen
                                                                    ? "display: flex"
                                                                    : "display: none"}"
                                                                @keydown="${this
                                                                    .#onPopoverKeyDown}"
                                                                @focusout="${this
                                                                    .#onPopoverFocusOut}"
                                                            >
                                                                <div class="popover-header">
                                                                    <span>Customize Columns</span>
                                                                    <button
                                                                        type="button"
                                                                        class="btn-mini close-popover"
                                                                        title="Close"
                                                                        aria-label="Close column customizer"
                                                                        @click="${(
                                                                            event:
                                                                                Event,
                                                                        ) => {
                                                                            event
                                                                                .stopPropagation();
                                                                            this.closeCustomizer();
                                                                        }}"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                                <div class="popover-list">
                                                                    ${allCols
                                                                        .map(
                                                                            (
                                                                                col,
                                                                                idx,
                                                                            ) => html`
                                                                                <div class="popover-item">
                                                                                    <label>
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            class="col-toggle-cb"
                                                                                            data-key="${col
                                                                                                .key}"
                                                                                            .checked="${!col
                                                                                                .hidden}"
                                                                                            @change="${(
                                                                                                event:
                                                                                                    Event,
                                                                                            ) => {
                                                                                                event
                                                                                                    .stopPropagation();
                                                                                                this.toggleColumnVisibility(
                                                                                                    col.key,
                                                                                                );
                                                                                            }}"
                                                                                        />
                                                                                        <span>${col
                                                                                            .label ??
                                                                                            col.key}</span>
                                                                                    </label>
                                                                                    <div class="popover-item-btns">
                                                                                        <button
                                                                                            type="button"
                                                                                            class="btn-mini move-col-up"
                                                                                            data-idx="${idx}"
                                                                                            ?disabled="${idx ===
                                                                                                0}"
                                                                                            title="Move Up"
                                                                                            aria-label="${`Move ${col.label ?? col.key} up`}"
                                                                                            @click="${(
                                                                                                event:
                                                                                                    Event,
                                                                                            ) => {
                                                                                                event
                                                                                                    .stopPropagation();
                                                                                                this.reorderColumn(
                                                                                                    idx,
                                                                                                    idx -
                                                                                                        1,
                                                                                                );
                                                                                            }}"
                                                                                        >
                                                                                            ▲
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            class="btn-mini move-col-down"
                                                                                            data-idx="${idx}"
                                                                                            ?disabled="${idx ===
                                                                                                allCols
                                                                                                        .length -
                                                                                                    1}"
                                                                                            title="Move Down"
                                                                                            aria-label="${`Move ${col.label ?? col.key} down`}"
                                                                                            @click="${(
                                                                                                event:
                                                                                                    Event,
                                                                                            ) => {
                                                                                                event
                                                                                                    .stopPropagation();
                                                                                                this.reorderColumn(
                                                                                                    idx,
                                                                                                    idx +
                                                                                                        1,
                                                                                                );
                                                                                            }}"
                                                                                        >
                                                                                            ▼
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            `,
                                                                        )}
                                                                </div>
                                                                <div class="popover-footer">
                                                                    <button
                                                                        type="button"
                                                                        class="btn-mini reset-cols-btn"
                                                                        @click="${(
                                                                            event:
                                                                                Event,
                                                                        ) => {
                                                                            event
                                                                                .stopPropagation();
                                                                            this.resetColumns();
                                                                        }}"
                                                                    >
                                                                        Reset
                                                                    </button>
                                                                 </div>
                                                            </div>
                                                        `;
                                                    }

                                                    protected override render() {
                                                        const allCols = this
                                                            .#allColumns();
                                                        const activeCols =
                                                            allCols.filter((
                                                                col,
                                                            ) => !col.hidden);
                                                        const showHeader =
                                                            this.showHeader;
                                                        const customize =
                                                            this.columnCustomization ||
                                                            this.customizableColumns;
                                                        let displayRows =
                                                            this.#data;
                                                        let startIndexOffset =
                                                            0;
                                                        if (
                                                            this.pagination &&
                                                            !this.remote &&
                                                            this.#data.length >
                                                                0
                                                        ) {
                                                            startIndexOffset =
                                                                (this.page -
                                                                    1) *
                                                                this.pageSize;
                                                            displayRows = this
                                                                .#data.slice(
                                                                    startIndexOffset,
                                                                    startIndexOffset +
                                                                        this.pageSize,
                                                                );
                                                        }
                                                        const allSelected =
                                                            this.#data.length >
                                                                0 &&
                                                            this.#data.every((
                                                                row,
                                                                idx,
                                                            ) => this
                                                                .#selectedKeys
                                                                .has(
                                                                    this.getRowKey(
                                                                        row,
                                                                        idx,
                                                                    ),
                                                                )
                                                            );
                                                        const rootClass = [
                                                            "table-root",
                                                            `size-${this.size}`,
                                                            this.striped
                                                                ? "striped"
                                                                : "",
                                                            this.bordered
                                                                ? "bordered"
                                                                : "",
                                                            this.hoverable
                                                                ? "hoverable"
                                                                : "",
                                                            this.compact
                                                                ? "compact"
                                                                : "",
                                                            showHeader
                                                                ? ""
                                                                : "no-header",
                                                        ]
                                                            .filter(Boolean)
                                                            .join(" ");

                                                        return html`
                                                            <div class="${rootClass}" part="root">
                                                                ${showHeader
                                                                    ? html`
                                                                        <div
                                                                            class="header-bar"
                                                                            part="header"
                                                                            role="${ifDefined(
                                                                                this
                                                                                        .collapsible
                                                                                    ? "button"
                                                                                    : undefined,
                                                                            )}"
                                                                            tabindex="${ifDefined(
                                                                                this
                                                                                        .collapsible
                                                                                    ? "0"
                                                                                    : undefined,
                                                                            )}"
                                                                            aria-expanded="${ifDefined(
                                                                                this
                                                                                        .collapsible
                                                                                    ? (!this
                                                                                        .collapsed)
                                                                                    : undefined,
                                                                            )}"
                                                                            @click="${this
                                                                                .onHeaderClick}"
                                                                            @keydown="${this
                                                                                .onHeaderKeydown}"
                                                                        >
                                                                            <div class="header-bar-left"><slot name="header"></slot></div>
                                                                            <div class="header-bar-right" data-header-action>
                                                                                ${customize
                                                                                    ? this
                                                                                        .#renderCustomizer(
                                                                                            allCols,
                                                                                            activeCols
                                                                                                .length,
                                                                                        )
                                                                                    : nothing}
                                                                            </div>
                                                                            ${headerToggleIcon(
                                                                                this.collapsible,
                                                                            )}
                                                                        </div>
                                                                    `
                                                                    : nothing}
                                                                <div class="table-scroll-container" part="scroll-container">
                                                                    <table part="table" role="table">
                                                                        ${showHeader
                                                                            ? this
                                                                                .#renderHeader(
                                                                                    activeCols,
                                                                                    allSelected,
                                                                                )
                                                                            : nothing}
                                                                        <tbody part="tbody">
                                                                            ${displayRows
                                                                                    .length ===
                                                                                    0
                                                                                ? html`
                                                                                    <tr class="empty-row" role="row">
                                                                                        <td
                                                                                            colspan="${activeCols
                                                                                                .length +
                                                                                                (this
                                                                                                        .selectable
                                                                                                    ? 1
                                                                                                    : 0)}"
                                                                                            class="empty-cell"
                                                                                            part="empty"
                                                                                        >
                                                                                            <slot name="empty">${this
                                                                                                .emptyText}</slot>
                                                                                        </td>
                                                                                    </tr>
                                                                                `
                                                                                : repeat(
                                                                                    displayRows,
                                                                                    (
                                                                                        row,
                                                                                        idx,
                                                                                    ) => this
                                                                                        .getRowKey(
                                                                                            row,
                                                                                            startIndexOffset +
                                                                                                idx,
                                                                                        ),
                                                                                    (
                                                                                        row,
                                                                                        idx,
                                                                                    ) => this
                                                                                        .#renderRow(
                                                                                            row,
                                                                                            startIndexOffset +
                                                                                                idx,
                                                                                            activeCols,
                                                                                        ),
                                                                                )}
                                                                        </tbody>
                                                                    </table>
                                                                    ${this
                                                                            .loading
                                                                        ? html`
                                                                            <div class="loading-overlay" part="loading" role="status" aria-label="Loading table data"><div class="spinner" aria-hidden="true"></div></div>
                                                                        `
                                                                        : nothing}
                                                                </div>
                                                                <div class="footer-bar" part="footer">
                                                                    ${this
                                                                            .pagination
                                                                        ? html`
                                                                            <ui-pagination
                                                                                part="pagination"
                                                                                .page="${this.page}"
                                                                                .pageSize="${this.pageSize}"
                                                                                .total="${this.total}"
                                                                                .pageSizeOptions="${this.#pageSizeOptions}"
                                                                                .mode="${this.paginationMode ?? 'full'}"
                                                                                .stepperFormat="${this.stepperFormat ?? 'arrows'}"
                                                                                .discretePages="${this.discretePages ?? true}"
                                                                                @ui-page-change="${(event: CustomEvent) => {
                                                                                    if (event.target !== this) {
                                                                                        event.stopPropagation();
                                                                                        this.setPage(event.detail.page);
                                                                                    }
                                                                                }}"
                                                                                @ui-page-size-change="${(event: CustomEvent) => {
                                                                                    if (event.target !== this) {
                                                                                        event.stopPropagation();
                                                                                        this.setPageSize(event.detail.pageSize);
                                                                                    }
                                                                                }}"
                                                                            ></ui-pagination>
                                                                        `
                                                                        : html`
                                                                            <slot name="footer"></slot>
                                                                        `}
                                                                </div>
                                                                <div class="hidden-slot"><slot @slotchange="${this
                                                                    .#onSlotChange}"></slot></div>
                                                            </div>
                                                        `;
                                                    }
                                                }

                                                if (
                                                    !customElements.get(
                                                        UI_TAG_NAMES.TABLE,
                                                    )
                                                ) {
                                                    customElements.define(
                                                        UI_TAG_NAMES.TABLE,
                                                        UITable,
                                                    );
                                                }

                                                declare global {
                                                    interface HTMLElementTagNameMap {
                                                        "ui-table": UITable;
                                                    }
                                                }
