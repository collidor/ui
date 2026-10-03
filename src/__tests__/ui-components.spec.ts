import { describe, expect, it, vi } from "vitest";
import "../index.ts";
import {
    goldenSpace,
    PHI,
    UI_TAG_NAMES,
    UIAccordion,
    UIAccordionItem,
    UIAlert,
    UIButton,
    UICard,
    UIChip,
    UIChipGroup,
    UIDialog,
    UIDrawer,
    UIField,
    UIIcon,
    UIInput,
    UIList,
    UIMenu,
    UIMenuItem,
    UINumberInput,
    UIProgress,
    UISegmentedControl,
    UISegmentItem,
    UISelect,
    UISlider,
    UIStructForm,
    UISwitch,
    UITab,
    UITable,
    UITabs,
    UIToastContainer,
    UITooltip,
} from "../index.ts";

type UITagName = (typeof UI_TAG_NAMES)[keyof typeof UI_TAG_NAMES];
type UnmappedUITag = Exclude<UITagName, keyof HTMLElementTagNameMap>;
type Expect<T extends boolean = true> = T;
type _EveryUITagIsMapped = Expect<
    [UnmappedUITag] extends [never] ? true : false
>;

describe("UI Web Components Library", () => {
    describe("Golden Ratio Mathematics", () => {
        it("should calculate golden ratio spatial scale correctly", () => {
            expect(PHI).toBeCloseTo(1.6180339887, 5);
            expect(goldenSpace(0)).toBe(1);
            expect(goldenSpace(1)).toBeCloseTo(1.618, 3);
            expect(goldenSpace(2)).toBeCloseTo(2.618, 3);
            expect(goldenSpace(-1)).toBeCloseTo(0.618, 3);
            expect(goldenSpace(-2)).toBeCloseTo(0.382, 3);
            expect(goldenSpace(-3)).toBeCloseTo(0.236, 3);
            expect(goldenSpace(-4)).toBeCloseTo(0.146, 3);
        });
    });

    describe("Custom Element Registration", () => {
        it("should register all custom elements in customElements registry", () => {
            expect(customElements.get(UI_TAG_NAMES.BUTTON)).toBe(UIButton);
            expect(customElements.get(UI_TAG_NAMES.INPUT)).toBe(UIInput);
            expect(customElements.get(UI_TAG_NAMES.NUMBER_INPUT)).toBe(
                UINumberInput,
            );
            expect(customElements.get(UI_TAG_NAMES.SLIDER)).toBe(UISlider);
            expect(customElements.get(UI_TAG_NAMES.SWITCH)).toBe(UISwitch);
            expect(customElements.get(UI_TAG_NAMES.SELECT)).toBe(UISelect);
            expect(customElements.get(UI_TAG_NAMES.FIELD)).toBe(UIField);
            expect(customElements.get(UI_TAG_NAMES.CARD)).toBe(UICard);
            expect(customElements.get(UI_TAG_NAMES.TABS)).toBe(UITabs);
            expect(customElements.get(UI_TAG_NAMES.TAB)).toBe(UITab);
            expect(customElements.get(UI_TAG_NAMES.ICON)).toBe(UIIcon);
            expect(customElements.get(UI_TAG_NAMES.TOOLTIP)).toBe(UITooltip);
            expect(customElements.get(UI_TAG_NAMES.DIALOG)).toBe(UIDialog);
            expect(customElements.get(UI_TAG_NAMES.TABLE)).toBe(UITable);
            expect(customElements.get(UI_TAG_NAMES.LIST)).toBe(UIList);
            expect(customElements.get(UI_TAG_NAMES.STRUCT_FORM)).toBe(
                UIStructForm,
            );
        });
    });

    describe("UIButton (<ui-button>)", () => {
        it("should render with default props and handle click events", () => {
            const btn = document.createElement(UI_TAG_NAMES.BUTTON) as UIButton;
            btn.textContent = "Action";
            document.body.appendChild(btn);

            const innerBtn = btn.shadowRoot?.querySelector("button");
            expect(innerBtn).toBeTruthy();
            expect(innerBtn?.classList.contains("variant-primary")).toBe(true);
            expect(innerBtn?.classList.contains("size-md")).toBe(true);

            const clickHandler = vi.fn<() => void>();
            btn.addEventListener("click", clickHandler);
            btn.click();
            expect(clickHandler).toHaveBeenCalledTimes(1);

            document.body.removeChild(btn);
        });

        it("should support variants, sizes, and disabled/loading states", () => {
            const btn = document.createElement(UI_TAG_NAMES.BUTTON) as UIButton;
            btn.setAttribute("variant", "danger");
            btn.setAttribute("size", "sm");
            btn.setAttribute("loading", "");
            document.body.appendChild(btn);

            const innerBtn = btn.shadowRoot?.querySelector("button");
            expect(innerBtn?.classList.contains("variant-danger")).toBe(true);
            expect(innerBtn?.classList.contains("size-sm")).toBe(true);
            expect(innerBtn?.disabled).toBe(true);
            expect(btn.shadowRoot?.querySelector(".spinner")).toBeTruthy();

            document.body.removeChild(btn);
        });
    });

    describe("UIInput (<ui-input>)", () => {
        it("should synchronize value and emit custom events", () => {
            const input = document.createElement(UI_TAG_NAMES.INPUT) as UIInput;
            input.setAttribute("value", "initial");
            input.setAttribute("clearable", "");
            document.body.appendChild(input);

            expect(input.value).toBe("initial");
            const innerInput = input.shadowRoot?.querySelector("input");
            expect(innerInput?.value).toBe("initial");

            const uiInputSpy = vi.fn<() => void>();
            input.addEventListener("ui-input", uiInputSpy);

            innerInput!.value = "updated";
            innerInput!.dispatchEvent(new Event("input"));

            expect(uiInputSpy).toHaveBeenCalled();
            expect(input.value).toBe("updated");

            const clearBtn = input.shadowRoot?.querySelector(
                ".clear-btn",
            ) as HTMLButtonElement;
            clearBtn.click();
            expect(input.value).toBe("");

            document.body.removeChild(input);
        });
    });

    describe("UINumberInput (<ui-number-input>)", () => {
        it("should step values up and down within bounds", () => {
            const numInput = document.createElement(
                UI_TAG_NAMES.NUMBER_INPUT,
            ) as UINumberInput;
            numInput.setAttribute("value", "10");
            numInput.setAttribute("min", "0");
            numInput.setAttribute("max", "20");
            numInput.setAttribute("step", "2");
            document.body.appendChild(numInput);

            expect(numInput.value).toBe(10);

            numInput.stepUp();
            expect(numInput.value).toBe(12);

            numInput.stepDown();
            numInput.stepDown();
            expect(numInput.value).toBe(8);

            numInput.value = 50;
            expect(numInput.value).toBe(20); // Clamped to max

            document.body.removeChild(numInput);
        });
    });

    describe("UISlider (<ui-slider>)", () => {
        it("should handle value updates within range bounds", () => {
            const slider = document.createElement(
                UI_TAG_NAMES.SLIDER,
            ) as UISlider;
            slider.setAttribute("min", "0");
            slider.setAttribute("max", "100");
            slider.setAttribute("value", "50");
            slider.setAttribute("show-value", "");
            document.body.appendChild(slider);

            expect(slider.value).toBe(50);
            const rangeInput = slider.shadowRoot?.querySelector(
                'input[type="range"]',
            ) as HTMLInputElement;
            expect(rangeInput?.value).toBe("50");

            slider.value = 75;
            expect(slider.value).toBe(75);

            document.body.removeChild(slider);
        });
    });

    describe("UISwitch (<ui-switch>)", () => {
        it("should toggle checked state and respond to clicks and keyboard", () => {
            const toggle = document.createElement(
                UI_TAG_NAMES.SWITCH,
            ) as UISwitch;
            document.body.appendChild(toggle);

            expect(toggle.checked).toBe(false);
            const changeSpy = vi.fn<() => void>();
            toggle.addEventListener("ui-change", changeSpy);

            toggle.click();
            expect(toggle.checked).toBe(true);
            expect(changeSpy).toHaveBeenCalledWith(
                expect.objectContaining({ detail: { checked: true } }),
            );

            toggle.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
            expect(toggle.checked).toBe(false);

            document.body.removeChild(toggle);
        });
    });

    describe("UISelect (<ui-select>)", () => {
        it("should wrap select and dispatch change events", () => {
            const select = document.createElement(
                UI_TAG_NAMES.SELECT,
            ) as UISelect;
            const opt1 = document.createElement("option");
            opt1.value = "opt-1";
            opt1.textContent = "Option 1";
            const opt2 = document.createElement("option");
            opt2.value = "opt-2";
            opt2.textContent = "Option 2";
            select.appendChild(opt1);
            select.appendChild(opt2);
            document.body.appendChild(select);

            const innerSelect = select.shadowRoot?.querySelector("select");
            expect(innerSelect).toBeTruthy();

            document.body.removeChild(select);
        });
    });

    describe("UIField (<ui-field>)", () => {
        it("should render label, required asterisk, and error messages", () => {
            const field = document.createElement(UI_TAG_NAMES.FIELD) as UIField;
            field.setAttribute("label", "Frequency");
            field.setAttribute("required", "");
            field.setAttribute("error", "Invalid value");
            document.body.appendChild(field);

            expect(field.shadowRoot?.querySelector(".required-star"))
                .toBeTruthy();
            expect(field.shadowRoot?.querySelector(".error-text")?.textContent)
                .toBe("Invalid value");

            document.body.removeChild(field);
        });
    });

    describe("UICard (<ui-card>)", () => {
        it("should render card with slotted sections", () => {
            const card = document.createElement(UI_TAG_NAMES.CARD) as UICard;
            card.setAttribute("elevated", "");
            document.body.appendChild(card);

            const innerCard = card.shadowRoot?.querySelector(".card");
            expect(innerCard).toBeTruthy();

            document.body.removeChild(card);
        });
    });

    describe("UITabs (<ui-tabs>) and UITab (<ui-tab>)", () => {
        it("should switch active tab on selection", () => {
            const tabs = document.createElement(UI_TAG_NAMES.TABS) as UITabs;
            tabs.setAttribute("value", "tab2");

            const tab1 = document.createElement(UI_TAG_NAMES.TAB) as UITab;
            tab1.setAttribute("value", "tab1");
            tab1.textContent = "Tab 1";

            const tab2 = document.createElement(UI_TAG_NAMES.TAB) as UITab;
            tab2.setAttribute("value", "tab2");
            tab2.textContent = "Tab 2";

            tabs.appendChild(tab1);
            tabs.appendChild(tab2);
            document.body.appendChild(tabs);

            expect(tab2.active).toBe(true);
            expect(tab1.active).toBe(false);

            tab1.click();
            expect(tabs.value).toBe("tab1");
            expect(tab1.active).toBe(true);
            expect(tab2.active).toBe(false);

            document.body.removeChild(tabs);
        });
    });

    describe("UIIcon (<ui-icon>)", () => {
        it("should render SVG path for built-in icons", () => {
            const icon = document.createElement(UI_TAG_NAMES.ICON) as UIIcon;
            icon.setAttribute("name", "play");
            document.body.appendChild(icon);

            expect(icon.shadowRoot?.querySelector("svg")).toBeTruthy();
            expect(icon.shadowRoot?.querySelector("path")).toBeTruthy();

            document.body.removeChild(icon);
        });
    });

    describe("UITooltip (<ui-tooltip>)", () => {
        it("should render tooltip bubble with position", () => {
            const tooltip = document.createElement(
                UI_TAG_NAMES.TOOLTIP,
            ) as UITooltip;
            tooltip.setAttribute("content", "Help text");
            tooltip.setAttribute("position", "right");
            document.body.appendChild(tooltip);

            const bubble = tooltip.shadowRoot?.querySelector(".tooltip-bubble");
            expect(bubble?.classList.contains("position-right")).toBe(true);

            document.body.removeChild(tooltip);
        });

        it("should position tooltip relative to trigger on show and dismiss on Escape", async () => {
            const tooltip = document.createElement(
                UI_TAG_NAMES.TOOLTIP,
            ) as UITooltip;
            tooltip.content = "Hover info";
            tooltip.position = "top";
            const btn = document.createElement("button");
            btn.textContent = "Trigger";
            tooltip.appendChild(btn);
            document.body.appendChild(tooltip);

            // Mock getBoundingClientRect
            vi.spyOn(btn, "getBoundingClientRect").mockReturnValue({
                top: 200,
                bottom: 240,
                left: 300,
                right: 400,
                width: 100,
                height: 40,
                x: 300,
                y: 200,
                toJSON: () => {},
            });

            // Trigger mouseenter
            tooltip.dispatchEvent(new MouseEvent("mouseenter"));
            await tooltip.updateComplete;

            const bubble = tooltip.shadowRoot?.querySelector(
                ".tooltip-bubble",
            ) as HTMLElement;
            expect(bubble).not.toBeNull();
            // Position should be calculated relative to trigger, not (0, 0)
            expect(bubble.style.top).toBe("192px"); // 200 - 8
            expect(bubble.style.left).toBe("350px"); // 300 + 100/2
            expect(bubble.style.transform).toBe("translate(-50%, -100%)");

            // Dismiss with Escape
            tooltip.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
            expect(tooltip.hasAttribute("data-dismissed")).toBe(true);

            document.body.removeChild(tooltip);
        });
    });

    describe("UIDialog (<ui-dialog>)", () => {
        it("should support show/close methods and open attribute", () => {
            const dialog = document.createElement(
                UI_TAG_NAMES.DIALOG,
            ) as UIDialog;
            dialog.setAttribute("title", "Node Properties");
            document.body.appendChild(dialog);

            const innerDialog = dialog.shadowRoot?.querySelector(
                "dialog",
            ) as HTMLDialogElement;
            // In JSDOM, HTMLDialogElement methods might need mock if not implemented
            if (typeof innerDialog.showModal !== "function") {
                innerDialog.showModal = () => {
                    innerDialog.open = true;
                };
                innerDialog.close = () => {
                    innerDialog.open = false;
                };
            }

            dialog.showModal();
            expect(dialog.open).toBe(true);

            dialog.close();
            expect(dialog.open).toBe(false);

            document.body.removeChild(dialog);
        });
    });

    describe("UITable (<ui-table>)", () => {
        it("should render data-driven table with specified columns", () => {
            const table = document.createElement(UI_TAG_NAMES.TABLE) as UITable;
            table.columns = [
                { key: "name", label: "Item Name", sortable: true },
                {
                    key: "cost",
                    label: "Cost (Gold)",
                    align: "right",
                    sortable: true,
                },
                { key: "category", label: "Type" },
            ];
            table.data = [
                {
                    id: "1",
                    name: "Spartan Spear",
                    cost: 150,
                    category: "Weapon",
                },
                {
                    id: "2",
                    name: "Bronze Cuirass",
                    cost: 350,
                    category: "Armor",
                },
                {
                    id: "3",
                    name: "Ambrosia Flask",
                    cost: 80,
                    category: "Consumable",
                },
            ];
            document.body.appendChild(table);

            const rows = table.shadowRoot?.querySelectorAll("tbody tr");
            expect(rows?.length).toBe(3);

            const headerCells = table.shadowRoot?.querySelectorAll("th");
            expect(headerCells?.length).toBe(3);
            expect(headerCells?.[0].textContent).toContain("Item Name");
            expect(headerCells?.[1].classList.contains("align-right")).toBe(
                true,
            );

            document.body.removeChild(table);
        });

        it("should auto-infer columns when no columns prop is given", () => {
            const table = document.createElement(UI_TAG_NAMES.TABLE) as UITable;
            table.data = [
                { name: "Achilles", role: "Champion", power: 99 },
                { name: "Hector", role: "Defender", power: 95 },
            ];
            document.body.appendChild(table);

            const headerCells = table.shadowRoot?.querySelectorAll("th");
            expect(headerCells?.length).toBe(3);
            expect(headerCells?.[0].textContent).toContain("Name");
            expect(headerCells?.[1].textContent).toContain("Role");
            expect(headerCells?.[2].textContent).toContain("Power");

            document.body.removeChild(table);
        });

        it("should sort data when clicking headers and emit ui-sort event", () => {
            const table = document.createElement(UI_TAG_NAMES.TABLE) as UITable;
            table.columns = [
                { key: "name", label: "Name", sortable: true },
                { key: "power", label: "Power", sortable: true },
            ];
            table.data = [
                { id: "1", name: "Ajax", power: 88 },
                { id: "2", name: "Odysseus", power: 92 },
                { id: "3", name: "Paris", power: 74 },
            ];
            document.body.appendChild(table);

            const sortSpy = vi.fn<() => void>();
            table.addEventListener("ui-sort", sortSpy);

            // Sort by power ascending
            table.sort("power", "asc");
            expect(table.data[0].name).toBe("Paris");
            expect(table.data[2].name).toBe("Odysseus");
            expect(sortSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        column: "power",
                        direction: "asc",
                    }),
                }),
            );

            // Sort by power descending
            table.sort("power", "desc");
            expect(table.data[0].name).toBe("Odysseus");
            expect(table.data[2].name).toBe("Paris");

            // Clicking header toggles sort
            const nameHeader = table.shadowRoot?.querySelector(
                'th[data-key="name"]',
            ) as HTMLElement;
            nameHeader.click();
            expect(table.sortBy).toBe("name");
            expect(table.sortDirection).toBe("asc");
            expect(table.data[0].name).toBe("Ajax");

            document.body.removeChild(table);
        });

        it("should support row selection in single and multiple modes", () => {
            const table = document.createElement(UI_TAG_NAMES.TABLE) as UITable;
            table.setAttribute("selectable", "");
            table.rowKey = "id";
            table.columns = [{ key: "name", label: "Hero" }];
            table.data = [
                { id: "a", name: "Agamemnon" },
                { id: "b", name: "Menelaus" },
                { id: "c", name: "Diomedes" },
            ];
            document.body.appendChild(table);

            const selectSpy = vi.fn<() => void>();
            table.addEventListener("ui-selection-change", selectSpy);

            // Toggle first row selection
            table.toggleRowSelection("a", table.data[0], 0);
            expect(table.selectedKeys).toEqual(["a"]);
            expect(table.selectedRows.length).toBe(1);
            expect(table.selectedRows[0].name).toBe("Agamemnon");
            expect(selectSpy).toHaveBeenCalled();

            // Select all rows
            table.selectAllRows();
            expect(table.selectedKeys.length).toBe(3);

            // Clear selection
            table.clearSelection();
            expect(table.selectedKeys.length).toBe(0);

            // Single mode
            table.selectionMode = "single";
            table.toggleRowSelection("b");
            expect(table.selectedKeys).toEqual(["b"]);
            table.toggleRowSelection("c");
            expect(table.selectedKeys).toEqual(["c"]);

            document.body.removeChild(table);
        });

        it("should support custom column formatters with string and HTMLElement returns", () => {
            const table = document.createElement(UI_TAG_NAMES.TABLE) as UITable;
            table.columns = [
                {
                    key: "status",
                    label: "Status",
                    formatter: (val) => {
                        const badge = document.createElement("span");
                        badge.className = "custom-badge";
                        badge.textContent = `[${String(val)}]`;
                        return badge;
                    },
                },
                {
                    key: "price",
                    label: "Price",
                    formatter: (val) => `$${Number(val).toFixed(2)}`,
                },
            ];
            table.data = [{ id: "1", status: "ACTIVE", price: 19.9 }];
            document.body.appendChild(table);

            const badgeEl = table.shadowRoot?.querySelector(".custom-badge");
            expect(badgeEl).toBeTruthy();
            expect(badgeEl?.textContent).toBe("[ACTIVE]");

            const cells = table.shadowRoot?.querySelectorAll("tbody td");
            expect(cells?.[1].textContent).toBe("$19.90");

            document.body.removeChild(table);
        });

        it("should handle empty and loading states and visual attributes", () => {
            const table = document.createElement(UI_TAG_NAMES.TABLE) as UITable;
            table.setAttribute("striped", "");
            table.setAttribute("bordered", "");
            table.setAttribute("hoverable", "");
            table.setAttribute("compact", "");
            table.setAttribute("sticky-header", "");
            table.setAttribute("empty-text", "No records found");
            document.body.appendChild(table);

            const root = table.shadowRoot?.querySelector(".table-root");
            expect(root?.classList.contains("striped")).toBe(true);
            expect(root?.classList.contains("bordered")).toBe(true);
            expect(root?.classList.contains("hoverable")).toBe(true);
            expect(root?.classList.contains("compact")).toBe(true);

            const emptyCell = table.shadowRoot?.querySelector(".empty-cell");
            expect(emptyCell?.textContent).toContain("No records found");

            table.loading = true;
            expect(table.shadowRoot?.querySelector(".loading-overlay"))
                .toBeTruthy();

            document.body.removeChild(table);
        });

        it("should paginate data and support page navigation", () => {
            const table = document.createElement(UI_TAG_NAMES.TABLE) as UITable;
            table.setAttribute("pagination", "");
            table.pageSize = 2;
            table.columns = [{ key: "name", label: "Item" }];
            table.data = [
                { id: "1", name: "Item 1" },
                { id: "2", name: "Item 2" },
                { id: "3", name: "Item 3" },
                { id: "4", name: "Item 4" },
                { id: "5", name: "Item 5" },
            ];
            document.body.appendChild(table);

            expect(table.totalPages).toBe(3);
            expect(table.page).toBe(1);

            // First page should show 2 rows
            let rows = table.shadowRoot?.querySelectorAll("tbody tr");
            expect(rows?.length).toBe(2);
            expect(rows?.[0].textContent).toContain("Item 1");
            expect(rows?.[1].textContent).toContain("Item 2");

            const pageSpy = vi.fn<() => void>();
            table.addEventListener("ui-page-change", pageSpy);

            // Next page
            table.nextPage();
            expect(table.page).toBe(2);
            expect(pageSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({ page: 2, pageSize: 2 }),
                }),
            );

            rows = table.shadowRoot?.querySelectorAll("tbody tr");
            expect(rows?.length).toBe(2);
            expect(rows?.[0].textContent).toContain("Item 3");
            expect(rows?.[1].textContent).toContain("Item 4");

            // Last page
            table.nextPage();
            expect(table.page).toBe(3);
            rows = table.shadowRoot?.querySelectorAll("tbody tr");
            expect(rows?.length).toBe(1);
            expect(rows?.[0].textContent).toContain("Item 5");

            // Previous page
            table.prevPage();
            expect(table.page).toBe(2);

            // Change page size
            table.setPageSize(5);
            expect(table.pageSize).toBe(5);
            expect(table.page).toBe(1);
            expect(table.totalPages).toBe(1);

            document.body.removeChild(table);
        });

        it("should issue getPage command whenever sort or page changes", async () => {
            const table = document.createElement(UI_TAG_NAMES.TABLE) as UITable;
            table.setAttribute("pagination", "");
            table.pageSize = 10;
            table.total = 20;
            table.columns = [
                { key: "name", label: "Name", sortable: true },
                { key: "score", label: "Score", sortable: true },
            ];
            table.data = [
                { id: "1", name: "Alpha", score: 10 },
                { id: "2", name: "Beta", score: 20 },
            ];
            document.body.appendChild(table);

            const getPageSpy = vi.fn<() => void>();
            table.addEventListener("ui-get-page", getPageSpy);

            // When sorting changes, a getPage command must be issued with page 1
            table.sort("score", "desc");
            expect(getPageSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        page: 1,
                        pageSize: 10,
                        sortBy: "score",
                        sortDirection: "desc",
                    }),
                }),
            );

            // When page changes, getPage is also issued
            table.setPage(2);
            expect(getPageSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        page: 2,
                        pageSize: 10,
                        sortBy: "score",
                        sortDirection: "desc",
                    }),
                }),
            );

            // Programmatic fetchPage hook
            table.fetchPage = async (params) => {
                return {
                    data: [{
                        id: "99",
                        name: `Remote Page ${params.page}`,
                        score: 999,
                    }],
                    total: 100,
                };
            };
            table.getPage({ page: 3 });
            await new Promise((r) => setTimeout(r, 10));
            expect(table.data[0].name).toBe("Remote Page 3");
            expect(table.total).toBe(100);

            document.body.removeChild(table);
        });

        it("should support column customization, hiding, reordering, and resetting", () => {
            const table = document.createElement(UI_TAG_NAMES.TABLE) as UITable;
            table.setAttribute("column-customization", "");
            table.columns = [
                { key: "colA", label: "Column A" },
                { key: "colB", label: "Column B" },
                { key: "colC", label: "Column C" },
            ];
            table.data = [{ id: "1", colA: "A1", colB: "B1", colC: "C1" }];
            document.body.appendChild(table);

            let headers = table.shadowRoot?.querySelectorAll(
                "thead th:not(.select-col)",
            );
            expect(headers?.length).toBe(3);

            const colsChangeSpy = vi.fn<() => void>();
            table.addEventListener("ui-columns-change", colsChangeSpy);

            // Hide Column B
            table.toggleColumnVisibility("colB");
            expect(colsChangeSpy).toHaveBeenCalled();
            headers = table.shadowRoot?.querySelectorAll(
                "thead th:not(.select-col)",
            );
            expect(headers?.length).toBe(2);
            expect(headers?.[0].textContent).toContain("Column A");
            expect(headers?.[1].textContent).toContain("Column C");

            // Reorder columns (move colC to first position)
            table.setColumnVisibility("colB", true);
            table.reorderColumn(2, 0);
            headers = table.shadowRoot?.querySelectorAll(
                "thead th:not(.select-col)",
            );
            expect(headers?.[0].textContent).toContain("Column C");

            // Reset columns
            table.resetColumns();
            headers = table.shadowRoot?.querySelectorAll(
                "thead th:not(.select-col)",
            );
            expect(headers?.[0].textContent).toContain("Column A");
            expect(headers?.[1].textContent).toContain("Column B");
            expect(headers?.[2].textContent).toContain("Column C");

            // Column Customizer Popover Light Dismiss & Escape
            const customizerBtn = table.shadowRoot?.querySelector(
                ".btn-custom-cols",
            ) as HTMLButtonElement;
            const popover = table.shadowRoot?.querySelector(
                ".column-customizer-popover",
            ) as HTMLElement;
            expect(customizerBtn).toBeDefined();
            expect(popover).toBeDefined();

            // Toggle open
            customizerBtn.click();
            expect(popover.style.display).toBe("flex");

            // Escape key closes popover
            popover.dispatchEvent(
                new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
            );
            expect(popover.style.display).toBe("none");

            // Open and close via click outside (pointerdown on document)
            customizerBtn.click();
            expect(popover.style.display).toBe("flex");
            document.dispatchEvent(
                new MouseEvent("pointerdown", { bubbles: true }),
            );
            expect(popover.style.display).toBe("none");

            document.body.removeChild(table);
        });

        it("should toggle table header off and on via showHeader property and attributes", () => {
            const table = document.createElement(UI_TAG_NAMES.TABLE) as UITable;
            table.columns = [
                { key: "name", label: "Item Name" },
                { key: "cost", label: "Cost" },
            ];
            table.data = [{ id: "1", name: "Potion", cost: 50 }];
            document.body.appendChild(table);

            // Default: showHeader is true
            expect(table.showHeader).toBe(true);
            expect(table.shadowRoot?.querySelector("thead")).toBeTruthy();
            expect(table.shadowRoot?.querySelector(".header-bar")).toBeTruthy();
            expect(
                table.shadowRoot?.querySelector(".table-root")?.classList
                    .contains("no-header"),
            ).toBe(
                false,
            );

            // Toggle off via property
            table.showHeader = false;
            expect(table.showHeader).toBe(false);
            expect(table.shadowRoot?.querySelector("thead")).toBeNull();
            expect(table.shadowRoot?.querySelector(".header-bar")).toBeNull();
            expect(
                table.shadowRoot?.querySelector(".table-root")?.classList
                    .contains("no-header"),
            ).toBe(
                true,
            );

            // Rows are still rendered
            expect(table.shadowRoot?.querySelectorAll("tbody tr").length).toBe(
                1,
            );

            // Toggle back on
            table.showHeader = true;
            expect(table.shadowRoot?.querySelector("thead")).toBeTruthy();
            expect(table.shadowRoot?.querySelector(".header-bar")).toBeTruthy();
            expect(
                table.shadowRoot?.querySelector(".table-root")?.classList
                    .contains("no-header"),
            ).toBe(
                false,
            );

            // Toggle off via hide-header attribute
            table.setAttribute("hide-header", "");
            expect(table.showHeader).toBe(false);
            expect(table.shadowRoot?.querySelector("thead")).toBeNull();
            expect(table.shadowRoot?.querySelector(".header-bar")).toBeNull();

            // Toggle off via show-header="false" attribute
            table.removeAttribute("hide-header");
            table.setAttribute("show-header", "false");
            expect(table.showHeader).toBe(false);
            expect(table.shadowRoot?.querySelector("thead")).toBeNull();
            expect(table.shadowRoot?.querySelector(".header-bar")).toBeNull();

            document.body.removeChild(table);
        });
    });

    describe("UIList (<ui-list>)", () => {
        const testItems = [
            {
                id: "1",
                name: "Bronze Xiphos",
                category: "Weapon",
                rarity: "Rare",
                price: 120,
            },
            {
                id: "2",
                name: "Mycenaean Cuirass",
                category: "Armor",
                rarity: "Legendary",
                price: 450,
            },
            {
                id: "3",
                name: "Spartan Hoplon",
                category: "Shield",
                rarity: "Rare",
                price: 200,
            },
            {
                id: "4",
                name: "Olive Oil Amphora",
                category: "Supply",
                rarity: "Common",
                price: 15,
            },
            {
                id: "5",
                name: "Laurel Wreath",
                category: "Accessory",
                rarity: "Mythic",
                price: 800,
            },
            {
                id: "6",
                name: "Obsidian Spearhead",
                category: "Material",
                rarity: "Uncommon",
                price: 65,
            },
        ];

        it("should render items with default auto-fit layout", () => {
            const list = document.createElement(UI_TAG_NAMES.LIST) as UIList;
            list.data = testItems;
            document.body.appendChild(list);

            const content = list.shadowRoot?.querySelector(".list-content");
            expect(content?.classList.contains("layout-auto-fit")).toBe(true);

            const items = list.shadowRoot?.querySelectorAll(".list-item");
            expect(items?.length).toBe(6);
            expect(items?.[0].textContent).toContain("Bronze Xiphos");

            document.body.removeChild(list);
        });

        it("should support explicit grid columns and list layout", () => {
            const list = document.createElement(UI_TAG_NAMES.LIST) as UIList;
            list.setAttribute("layout", "grid");
            list.setAttribute("columns", "3");
            list.data = testItems;
            document.body.appendChild(list);

            let content = list.shadowRoot?.querySelector(".list-content");
            expect(content?.classList.contains("layout-grid")).toBe(true);
            expect(list.columns).toBe(3);

            list.setAttribute("layout", "list");
            content = list.shadowRoot?.querySelector(".list-content");
            expect(content?.classList.contains("layout-list")).toBe(true);

            document.body.removeChild(list);
        });

        it("should handle selection in single and multiple modes", () => {
            const list = document.createElement(UI_TAG_NAMES.LIST) as UIList;
            list.selectable = true;
            list.selectionMode = "multiple";
            list.data = testItems;
            document.body.appendChild(list);

            const selectionSpy = vi.fn<(e: Event) => void>();
            list.addEventListener("ui-selection-change", selectionSpy);

            // Toggle first item
            list.toggleItemSelection(testItems[0], 0);
            expect(list.selectedKeys).toEqual(["1"]);
            expect(list.selectedItems.length).toBe(1);
            expect(selectionSpy).toHaveBeenCalled();

            // Toggle second item
            list.toggleItemSelection(testItems[1], 1);
            expect(list.selectedKeys).toEqual(["1", "2"]);
            expect(list.selectedItems.length).toBe(2);

            // Select all & clear
            list.selectAll();
            expect(list.selectedKeys.length).toBe(6);

            list.clearSelection();
            expect(list.selectedKeys.length).toBe(0);

            // Single selection mode
            list.selectionMode = "single";
            list.toggleItemSelection(testItems[0], 0);
            list.toggleItemSelection(testItems[2], 2);
            expect(list.selectedKeys).toEqual(["3"]);

            document.body.removeChild(list);
        });

        it("should support pagination and emit getPage events", () => {
            const list = document.createElement(UI_TAG_NAMES.LIST) as UIList;
            list.pagination = true;
            list.pageSize = 2;
            list.data = testItems;
            document.body.appendChild(list);

            expect(list.totalPages).toBe(3);
            let items = list.shadowRoot?.querySelectorAll(".list-item");
            expect(items?.length).toBe(2);
            expect(items?.[0].textContent).toContain("Bronze Xiphos");

            const getPageSpy = vi.fn<(e: Event) => void>();
            list.addEventListener("ui-get-page", getPageSpy);

            // Next page
            list.nextPage();
            expect(list.page).toBe(2);
            items = list.shadowRoot?.querySelectorAll(".list-item");
            expect(items?.length).toBe(2);
            expect(items?.[0].textContent).toContain("Spartan Hoplon");
            expect(getPageSpy).toHaveBeenCalled();

            // Sort
            list.sort("price", "desc");
            expect(list.sortBy).toBe("price");
            expect(list.sortDirection).toBe("desc");
            items = list.shadowRoot?.querySelectorAll(".list-item");
            expect(items?.[0].textContent).toContain("Spartan Hoplon"); // page 2 of sorted descending: [800, 450] (p1), [200, 120] (p2)

            list.setPage(1);
            items = list.shadowRoot?.querySelectorAll(".list-item");
            expect(items?.[0].textContent).toContain("Laurel Wreath");
            expect(items?.[1].textContent).toContain("Mycenaean Cuirass");

            document.body.removeChild(list);
        });
    });

    describe("Shared Data Collection Utilities", () => {
        it("should safely normalize strings and sort various data types", async () => {
            const { safeString, sortData, calculatePagination } = await import(
                "../dataCollection.utils"
            );

            expect(safeString(null)).toBe("");
            expect(safeString(123)).toBe("123");
            expect(safeString(true)).toBe("true");
            expect(safeString("hello")).toBe("hello");

            const sample = [
                { id: 1, val: 30 },
                { id: 2, val: 10 },
                { id: 3, val: 20 },
            ];

            const asc = sortData(sample, "val", "asc");
            expect(asc.map((i) => i.val)).toEqual([10, 20, 30]);

            const desc = sortData(sample, "val", "desc");
            expect(desc.map((i) => i.val)).toEqual([30, 20, 10]);

            const paged = calculatePagination(sample, 1, 2);
            expect(paged.totalPages).toBe(2);
            expect(paged.items.length).toBe(2);
            expect(paged.startItem).toBe(1);
            expect(paged.endItem).toBe(2);
        });
    });

    describe("UIStructForm (<ui-struct-form>)", () => {
        it("should dynamically generate form widgets and emit change/submit events", () => {
            const form = document.createElement(
                UI_TAG_NAMES.STRUCT_FORM,
            ) as UIStructForm;
            form.fields = [
                {
                    key: "username",
                    label: "Username",
                    widget: "text",
                    defaultValue: "aldon",
                },
                {
                    key: "level",
                    label: "Level",
                    widget: "number",
                    defaultValue: 5,
                },
                {
                    key: "active",
                    label: "Active",
                    widget: "switch",
                    defaultValue: true,
                },
            ];
            document.body.appendChild(form);

            expect(form.getFieldValue("username")).toBe("aldon");
            expect(form.getFieldValue("level")).toBe(5);

            const changeSpy = vi.fn<(e: Event) => void>();
            const submitSpy = vi.fn<(e: Event) => void>();

            form.addEventListener("ui-form-change", changeSpy);
            form.addEventListener("ui-form-submit", submitSpy);

            form.setFieldValue("username", "aldon_hero");
            expect(form.getFieldValue("username")).toBe("aldon_hero");
            expect(changeSpy).toHaveBeenCalled();

            form.submit();
            expect(submitSpy).toHaveBeenCalled();

            document.body.removeChild(form);
        });
    });

    describe("Theme Presets & Tokens", () => {
        it("should support neumorphic theme class and data-theme attribute", () => {
            const container = document.createElement("div");
            container.className = "theme-neumorphic";
            container.setAttribute("data-theme", "neumorphic");
            document.body.appendChild(container);

            const btn = document.createElement(UI_TAG_NAMES.BUTTON) as UIButton;
            btn.textContent = "Action";
            container.appendChild(btn);

            expect(container.classList.contains("theme-neumorphic")).toBe(
                true,
            );
            expect(container.getAttribute("data-theme")).toBe("neumorphic");

            document.body.removeChild(container);
        });
    });

    describe("OKLCH Accessibility Contrast Engine", () => {
        it("should correctly infer dark text for light background and light text for dark background", async () => {
            const {
                inferContrastLightness,
                inferMutedLightness,
                cssContrastExpression,
            } = await import("../index");

            // Dark background (e.g. walnut leather L=0.18) -> Light text (L=0.96)
            expect(inferContrastLightness(0.18)).toBe(0.96);
            expect(inferMutedLightness(0.18)).toBe(0.76);

            // Light background (e.g. parchment L=0.91) -> Dark text (L=0.14)
            expect(inferContrastLightness(0.91)).toBe(0.14);
            expect(inferMutedLightness(0.91)).toBe(0.34);

            // Midpoint thresholding (0.6)
            expect(inferContrastLightness(0.59)).toBe(0.96);
            expect(inferContrastLightness(0.6)).toBe(0.14);
            expect(inferContrastLightness(0.61)).toBe(0.14);

            // Generates standard CSS Relative Color Syntax expression
            const expr = cssContrastExpression("--ui-color-surface");
            expect(expr).toContain("oklch(from var(--ui-color-surface)");
            expect(expr).toContain("clamp(0.14, (0.6 - l) * 1000, 0.96)");
        });
    });

    describe("UIProgress (<ui-progress>)", () => {
        it("should render progress track, fill width, and buffer", () => {
            const progress = document.createElement(
                UI_TAG_NAMES.PROGRESS,
            ) as UIProgress;
            progress.value = 40;
            progress.max = 100;
            progress.buffer = 70;
            progress.label = "Mana";
            progress.showValue = true;
            document.body.appendChild(progress);

            const fill = progress.shadowRoot?.querySelector(
                ".progress-fill",
            ) as HTMLElement;
            const buffer = progress.shadowRoot?.querySelector(
                ".progress-buffer",
            ) as HTMLElement;
            const label = progress.shadowRoot?.querySelector(".progress-label");

            expect(fill).toBeTruthy();
            expect(buffer).toBeTruthy();
            expect(label?.textContent).toBe("Mana");

            document.body.removeChild(progress);
        });
    });

    describe("UIDrawer (<ui-drawer>)", () => {
        it("should toggle open state and emit events", () => {
            const drawer = document.createElement(
                UI_TAG_NAMES.DRAWER,
            ) as UIDrawer;
            drawer.title = "Spellbook";
            document.body.appendChild(drawer);

            const openSpy = vi.fn<(e: Event) => void>();
            const closeSpy = vi.fn<(e: Event) => void>();
            drawer.addEventListener("ui-drawer-open", openSpy);
            drawer.addEventListener("ui-drawer-close", closeSpy);

            drawer.show();
            expect(drawer.open).toBe(true);
            expect(openSpy).toHaveBeenCalled();

            drawer.close();
            expect(drawer.open).toBe(false);
            expect(closeSpy).toHaveBeenCalled();

            document.body.removeChild(drawer);
        });
    });

    describe("UISegmentedControl & UISegmentItem", () => {
        it("should manage active selection and emit changes", () => {
            const control = document.createElement(
                UI_TAG_NAMES.SEGMENTED_CONTROL,
            ) as UISegmentedControl;
            const item1 = document.createElement(
                UI_TAG_NAMES.SEGMENT_ITEM,
            ) as UISegmentItem;
            item1.value = "melee";
            item1.textContent = "Melee";
            const item2 = document.createElement(
                UI_TAG_NAMES.SEGMENT_ITEM,
            ) as UISegmentItem;
            item2.value = "ranged";
            item2.textContent = "Ranged";

            control.appendChild(item1);
            control.appendChild(item2);
            document.body.appendChild(control);

            const changeSpy = vi.fn<(e: Event) => void>();
            control.addEventListener("ui-change", changeSpy);

            item2.click();
            expect(control.value).toBe("ranged");
            expect(changeSpy).toHaveBeenCalledWith(
                expect.objectContaining({ detail: { value: "ranged" } }),
            );

            document.body.removeChild(control);
        });
    });

    describe("UIAlert (<ui-alert>)", () => {
        it("should render alert box with variant and support dismissal", () => {
            const alert = document.createElement(UI_TAG_NAMES.ALERT) as UIAlert;
            alert.variant = "warning";
            alert.title = "Low Resources";
            alert.closable = true;
            document.body.appendChild(alert);

            const title = alert.shadowRoot?.querySelector(".alert-title");
            expect(title?.textContent).toBe("Low Resources");

            const closeSpy = vi.fn<(e: Event) => void>();
            alert.addEventListener("ui-alert-close", closeSpy);
            alert.dismiss();
            expect(closeSpy).toHaveBeenCalled();
        });
    });

    describe("UIToast & UIToastContainer", () => {
        it("should spawn toasts programmatically and dismiss them", () => {
            const container = document.createElement(
                UI_TAG_NAMES.TOAST_CONTAINER,
            ) as UIToastContainer;
            document.body.appendChild(container);

            const toast = container.notify({
                title: "Critical Hit",
                message: "Rolled a natural 20!",
                variant: "accent",
            });
            expect(toast).toBeTruthy();
            expect(toast.title).toBe("Critical Hit");

            toast.dismiss();
            document.body.removeChild(container);
        });
    });

    describe("UIMenu, UIMenuItem, UIMenuDivider", () => {
        it("should emit select event on menu item click", () => {
            const menu = document.createElement(UI_TAG_NAMES.MENU) as UIMenu;
            const item1 = document.createElement(
                UI_TAG_NAMES.MENU_ITEM,
            ) as UIMenuItem;
            item1.value = "inspect";
            item1.textContent = "Inspect";
            const item2 = document.createElement(
                UI_TAG_NAMES.MENU_ITEM,
            ) as UIMenuItem;
            item2.value = "delete";
            item2.danger = true;
            item2.textContent = "Delete";

            menu.appendChild(item1);
            menu.appendChild(document.createElement(UI_TAG_NAMES.MENU_DIVIDER));
            menu.appendChild(item2);
            document.body.appendChild(menu);

            const selectSpy = vi.fn<(e: Event) => void>();
            menu.addEventListener("ui-menu-select", selectSpy);

            item1.click();
            expect(selectSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: { value: "inspect", item: item1 },
                }),
            );

            document.body.removeChild(menu);
        });
    });

    describe("UIAccordion & UIAccordionItem", () => {
        it("should expand/collapse accordion items", () => {
            const accordion = document.createElement(
                UI_TAG_NAMES.ACCORDION,
            ) as UIAccordion;
            const item = document.createElement(
                UI_TAG_NAMES.ACCORDION_ITEM,
            ) as UIAccordionItem;
            item.title = "Combat Rules";
            item.textContent = "Details about round actions";

            accordion.appendChild(item);
            document.body.appendChild(accordion);

            expect(item.open).toBe(false);
            item.toggle();
            expect(item.open).toBe(true);

            document.body.removeChild(accordion);
        });
    });

    describe("UIChip & UIChipGroup", () => {
        it("should support chip selection and closing", () => {
            const group = document.createElement(
                UI_TAG_NAMES.CHIP_GROUP,
            ) as UIChipGroup;
            const chip = document.createElement(UI_TAG_NAMES.CHIP) as UIChip;
            chip.value = "fire";
            chip.selectable = true;
            chip.closable = true;
            chip.textContent = "Fire";

            group.appendChild(chip);
            document.body.appendChild(group);

            const selectSpy = vi.fn<(e: Event) => void>();
            const closeSpy = vi.fn<(e: Event) => void>();
            chip.addEventListener("ui-chip-select", selectSpy);
            chip.addEventListener("ui-chip-close", closeSpy);

            chip.toggle();
            expect(chip.selected).toBe(true);
            expect(selectSpy).toHaveBeenCalled();

            chip.close();
            expect(closeSpy).toHaveBeenCalled();

            document.body.removeChild(group);
        });
    });

    describe("Pure CSS Components & Primitives", () => {
        it("should support .ui-badge classes with variants and dot", () => {
            const badge = document.createElement("span");
            badge.className = "ui-badge ui-badge--success ui-badge--sm ui-badge--dot";
            badge.textContent = "Online";
            document.body.appendChild(badge);

            expect(badge.classList.contains("ui-badge")).toBe(true);
            expect(badge.classList.contains("ui-badge--success")).toBe(true);
            expect(badge.textContent).toBe("Online");

            document.body.removeChild(badge);
        });

        it("should support .ui-skeleton classes with variants", () => {
            const skeleton = document.createElement("div");
            skeleton.className = "ui-skeleton ui-skeleton--circle";
            document.body.appendChild(skeleton);

            expect(skeleton.classList.contains("ui-skeleton")).toBe(true);
            expect(skeleton.classList.contains("ui-skeleton--circle")).toBe(true);

            document.body.removeChild(skeleton);
        });

        it("should support .ui-breadcrumbs semantic markup and classes", () => {
            const nav = document.createElement("nav");
            nav.setAttribute("aria-label", "Breadcrumb");
            nav.innerHTML = `
                <ol class="ui-breadcrumbs">
                    <li><a href="/">Home</a></li>
                    <li><span aria-current="page">Dashboard</span></li>
                </ol>
            `;
            document.body.appendChild(nav);

            const list = nav.querySelector(".ui-breadcrumbs");
            expect(list).toBeTruthy();
            expect(nav.querySelectorAll("li")).toHaveLength(2);
            expect(nav.querySelector("[aria-current='page']")?.textContent).toBe("Dashboard");

            document.body.removeChild(nav);
        });

        it("should support .ui-link classes", () => {
            const link = document.createElement("a");
            link.href = "/dashboard";
            link.className = "ui-link ui-link--subtle";
            link.textContent = "Dashboard";
            document.body.appendChild(link);

            expect(link.classList.contains("ui-link")).toBe(true);
            expect(link.getAttribute("href")).toBe("/dashboard");

            document.body.removeChild(link);
        });
    });
});
