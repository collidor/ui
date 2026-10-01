import { describe, expect, it, vi } from "vitest";
import "../../index.ts";
import { UI_TAG_NAMES } from "../../constants.ts";
import { UIPagination, UITable } from "../../index.ts";
import { mount, record } from "../harness.ts";

describe("UIPagination Component", () => {
    it("renders pagination with default properties and info text", async () => {
        const pagination = mount(
            document.createElement(UI_TAG_NAMES.PAGINATION) as UIPagination,
        );
        pagination.total = 45;
        pagination.pageSize = 10;
        pagination.page = 1;
        await pagination.updateComplete;

        expect(pagination.totalPages).toBe(5);
        expect(pagination.page).toBe(1);

        const info = pagination.shadowRoot?.querySelector(".pagination-info");
        expect(info?.textContent).toContain("Showing 1–10 of 45");

        const comboBtn = pagination.shadowRoot?.querySelector(".pagination-combo-btn");
        expect(comboBtn).not.toBeNull();
        expect(comboBtn?.getAttribute("role")).toBe("group");
        expect(comboBtn?.getAttribute("aria-label")).toBe("Pagination buttons");
    });

    it("enforces a single Tab stop into the combo button group (roving tabindex)", async () => {
        const pagination = mount(
            document.createElement(UI_TAG_NAMES.PAGINATION) as UIPagination,
        );
        pagination.total = 30;
        pagination.pageSize = 10;
        pagination.page = 1;
        await pagination.updateComplete;

        const buttons = Array.from(
            pagination.shadowRoot?.querySelectorAll<HTMLButtonElement>(
                ".pagination-combo-btn .page-btn",
            ) ?? [],
        );
        expect(buttons.length).toBeGreaterThan(1);

        // Exactly one button has tabindex="0", all other buttons have tabindex="-1"
        const tabStopButtons = buttons.filter((b) => b.getAttribute("tabindex") === "0");
        const nonTabButtons = buttons.filter((b) => b.getAttribute("tabindex") === "-1");

        expect(tabStopButtons.length).toBe(1);
        expect(nonTabButtons.length).toBe(buttons.length - 1);

        // By default on page 1, the active page button (page 1) has tabindex="0"
        expect(tabStopButtons[0].classList.contains("active")).toBe(true);
        expect(tabStopButtons[0].getAttribute("aria-current")).toBe("page");
    });

    it("supports arrow key navigation (Left/Right/Up/Down, Home/End) across enabled buttons", async () => {
        const pagination = mount(
            document.createElement(UI_TAG_NAMES.PAGINATION) as UIPagination,
        );
        pagination.total = 50;
        pagination.pageSize = 10;
        pagination.page = 2; // page 2 so prev is enabled
        await pagination.updateComplete;

        const container = pagination.shadowRoot?.querySelector(
            ".pagination-combo-btn",
        ) as HTMLElement;
        const enabledButtons = Array.from(
            container.querySelectorAll<HTMLButtonElement>("button.page-btn:not([disabled])"),
        );
        expect(enabledButtons.length).toBeGreaterThan(2);

        // Start focus on page 2 button
        const activePageBtn = enabledButtons.find((b) => b.classList.contains("active"))!;
        activePageBtn.focus();
        expect(activePageBtn.getAttribute("tabindex")).toBe("0");

        const currentIndex = enabledButtons.indexOf(activePageBtn);
        const nextExpectedBtn = enabledButtons[(currentIndex + 1) % enabledButtons.length];

        // ArrowRight navigates to next enabled button
        activePageBtn.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }),
        );
        await pagination.updateComplete;

        expect(nextExpectedBtn.getAttribute("tabindex")).toBe("0");
        expect(activePageBtn.getAttribute("tabindex")).toBe("-1");

        // ArrowLeft navigates back to previous enabled button
        nextExpectedBtn.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }),
        );
        await pagination.updateComplete;

        expect(activePageBtn.getAttribute("tabindex")).toBe("0");

        // End key moves to last enabled button
        const lastBtn = enabledButtons[enabledButtons.length - 1];
        activePageBtn.dispatchEvent(
            new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }),
        );
        await pagination.updateComplete;

        expect(lastBtn.getAttribute("tabindex")).toBe("0");

        // Home key moves to first enabled button
        const firstBtn = enabledButtons[0];
        lastBtn.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }),
        );
        await pagination.updateComplete;

        expect(firstBtn.getAttribute("tabindex")).toBe("0");
    });

    it("activates focused button on Space key and prevents scroll default", async () => {
        const pagination = mount(
            document.createElement(UI_TAG_NAMES.PAGINATION) as UIPagination,
        );
        pagination.total = 50;
        pagination.pageSize = 10;
        pagination.page = 1;
        await pagination.updateComplete;

        const pageEvents = record<{ page: number }>(pagination, "ui-page-change");

        const nextBtn = pagination.shadowRoot?.querySelector<HTMLButtonElement>(
            ".page-btn.page-next",
        )!;
        expect(nextBtn).not.toBeNull();
        expect(nextBtn.disabled).toBe(false);

        const spaceEvent = new KeyboardEvent("keydown", {
            key: " ",
            bubbles: true,
            cancelable: true,
        });
        const defaultPrevented = !nextBtn.dispatchEvent(spaceEvent);

        expect(defaultPrevented).toBe(true);
        expect(pageEvents.length).toBe(1);
        expect(pageEvents[0].detail.page).toBe(2);
        expect(pagination.page).toBe(2);
    });

    it("supports configurable '-+' stepper format", async () => {
        const pagination = mount(
            document.createElement(UI_TAG_NAMES.PAGINATION) as UIPagination,
        );
        pagination.total = 30;
        pagination.pageSize = 10;
        pagination.stepperFormat = "-+";
        await pagination.updateComplete;

        const prevBtn = pagination.shadowRoot?.querySelector(".page-btn.page-prev");
        const nextBtn = pagination.shadowRoot?.querySelector(".page-btn.page-next");
        const firstBtn = pagination.shadowRoot?.querySelector(".page-btn.page-first");
        const lastBtn = pagination.shadowRoot?.querySelector(".page-btn.page-last");

        expect(prevBtn?.textContent?.trim()).toBe("−");
        expect(nextBtn?.textContent?.trim()).toBe("+");
        // In -+ stepper format, first/last buttons are omitted
        expect(firstBtn).toBeNull();
        expect(lastBtn).toBeNull();
    });

    it("supports disabling discrete pages (stepper-only mode)", async () => {
        const pagination = mount(
            document.createElement(UI_TAG_NAMES.PAGINATION) as UIPagination,
        );
        pagination.total = 50;
        pagination.pageSize = 10;
        pagination.page = 2;
        pagination.discretePages = false;
        pagination.stepperFormat = "-+";
        await pagination.updateComplete;

        // No numbered page buttons
        const pageBtns = pagination.shadowRoot?.querySelectorAll(
            ".pagination-combo-btn button[data-page]",
        );
        expect(pageBtns?.length).toBe(0);

        // Page status indicator is rendered
        const status = pagination.shadowRoot?.querySelector(".page-status");
        expect(status?.textContent?.trim()).toBe("Page 2 of 5");

        // Combo button only contains prev (-) and next (+)
        const comboButtons = pagination.shadowRoot?.querySelectorAll(
            ".pagination-combo-btn button",
        );
        expect(comboButtons?.length).toBe(2);
    });

    it("supports combining '-+' stepper with discrete numbered pages", async () => {
        const pagination = mount(
            document.createElement(UI_TAG_NAMES.PAGINATION) as UIPagination,
        );
        pagination.total = 30;
        pagination.pageSize = 10;
        pagination.stepperFormat = "-+";
        pagination.discretePages = true;
        await pagination.updateComplete;

        const prevBtn = pagination.shadowRoot?.querySelector(".page-btn.page-prev");
        const nextBtn = pagination.shadowRoot?.querySelector(".page-btn.page-next");
        const pageBtns = pagination.shadowRoot?.querySelectorAll(
            ".pagination-combo-btn button[data-page]",
        );

        expect(prevBtn?.textContent?.trim()).toBe("−");
        expect(nextBtn?.textContent?.trim()).toBe("+");
        expect(pageBtns?.length).toBe(3); // Pages 1, 2, 3
    });

    it("emits ui-page-size-change and ui-page-change when page size is changed", async () => {
        const pagination = mount(
            document.createElement(UI_TAG_NAMES.PAGINATION) as UIPagination,
        );
        pagination.total = 100;
        pagination.pageSize = 10;
        pagination.page = 1;
        await pagination.updateComplete;

        const sizeEvents = record<{ pageSize: number; page: number }>(
            pagination,
            "ui-page-size-change",
        );
        const pageEvents = record<{ pageSize: number; page: number }>(
            pagination,
            "ui-page-change",
        );

        const select = pagination.shadowRoot?.querySelector<HTMLSelectElement>(
            ".page-size-select",
        )!;
        select.value = "25";
        select.dispatchEvent(new Event("change"));
        await pagination.updateComplete;

        expect(pagination.pageSize).toBe(25);
        expect(sizeEvents.length).toBe(1);
        expect(sizeEvents[0].detail.pageSize).toBe(25);
        expect(pageEvents.length).toBe(1);
        expect(pageEvents[0].detail.pageSize).toBe(25);
    });

    it("integrates seamlessly with UITable when table pagination is enabled", async () => {
        const table = mount(document.createElement(UI_TAG_NAMES.TABLE) as UITable);
        table.setAttribute("pagination", "");
        table.pageSize = 2;
        table.columns = [{ key: "name", label: "Item" }];
        table.data = [
            { id: "1", name: "Alpha" },
            { id: "2", name: "Beta" },
            { id: "3", name: "Gamma" },
            { id: "4", name: "Delta" },
        ];
        await table.updateComplete;

        const childPagination = table.shadowRoot?.querySelector(
            "ui-pagination",
        ) as UIPagination;
        expect(childPagination).not.toBeNull();
        expect(childPagination.page).toBe(1);
        expect(childPagination.pageSize).toBe(2);
        expect(childPagination.total).toBe(4);
        expect(childPagination.totalPages).toBe(2);

        // Clicking next page on child pagination triggers page change on table
        const tablePageEvents = record<{ page: number }>(table, "ui-page-change");
        childPagination.nextPage();
        await table.updateComplete;

        expect(table.page).toBe(2);
        expect(tablePageEvents.length).toBe(1);
        expect(tablePageEvents[0].detail.page).toBe(2);

        // Rows in table reflect page 2
        const rows = table.shadowRoot?.querySelectorAll("tbody tr");
        expect(rows?.length).toBe(2);
        expect(rows?.[0].textContent).toContain("Gamma");
        expect(rows?.[1].textContent).toContain("Delta");
    });
});
