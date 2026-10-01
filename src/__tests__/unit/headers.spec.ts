import { describe, expect, it } from "vitest";
import "../../index.ts";
import { UI_TAG_NAMES } from "../../constants.ts";
import type {
    UIAccordionItem,
    UICard,
    UIDialog,
    UIStatCard,
    UITable,
} from "../../index.ts";
import { mount, record } from "../harness.ts";

describe("header surfaces", () => {
    it("collapses a card body from its header and reports the state once", () => {
        const card = mount(document.createElement(UI_TAG_NAMES.CARD) as UICard);
        card.collapsible = true;
        card.headerSurface = "banner";
        const toggles = record<{ collapsed: boolean }>(card, "ui-collapse-toggle");

        const header = card.shadowRoot?.querySelector("[part='header']");
        header?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(card.headerSurface).toBe("banner");
        expect(card.getAttribute("header-surface")).toBe("banner");
        expect(card.collapsed).toBe(true);
        expect(card.hasAttribute("collapsed")).toBe(true);
        expect(card.shadowRoot?.querySelector("[part='body']")).toBeTruthy();
        expect(toggles.map((event) => event.detail)).toEqual([{ collapsed: true }]);
    });

    it("does not collapse a card when a header action is clicked", () => {
        const card = mount(document.createElement(UI_TAG_NAMES.CARD) as UICard);
        card.collapsible = true;
        const action = document.createElement("button");
        action.slot = "header";
        action.textContent = "Edit";
        card.append(action);
        const toggles = record(card, "ui-collapse-toggle");

        action.click();

        expect(card.collapsed).toBe(false);
        expect(toggles).toHaveLength(0);
    });

    it("keeps a stat card collapse on the same event", () => {
        const card = mount(document.createElement(UI_TAG_NAMES.STAT_CARD) as UIStatCard);
        card.title = "ATTACK";
        card.collapsible = true;
        card.headerSurface = "raised";
        const toggles = record<{ collapsed: boolean }>(card, "ui-collapse-toggle");

        card.toggleCollapse();

        expect(card.collapsed).toBe(true);
        expect(card.getAttribute("header-surface")).toBe("raised");
        expect(toggles.map((event) => event.detail)).toEqual([{ collapsed: true }]);
    });

    it("collapses a table from the header bar without sorting", () => {
        const table = mount(document.createElement(UI_TAG_NAMES.TABLE) as UITable);
        table.collapsible = true;
        table.headerSurface = "sunken";
        table.columns = [{ key: "name", label: "Name", sortable: true }];
        table.data = [{ name: "Ajax" }];
        const sorts = record(table, "ui-sort");
        const toggles = record<{ collapsed: boolean }>(table, "ui-collapse-toggle");

        table.shadowRoot?.querySelector("[part='header']")?.dispatchEvent(
            new MouseEvent("click", { bubbles: true }),
        );

        expect(table.collapsed).toBe(true);
        expect(table.shadowRoot?.querySelector("[part='scroll-container']")).toBeTruthy();
        expect(sorts).toHaveLength(0);
        expect(toggles).toHaveLength(1);
    });

    it("still opens an accordion item from its header", () => {
        const item = mount(
            document.createElement(UI_TAG_NAMES.ACCORDION_ITEM) as UIAccordionItem,
        );
        item.headerSurface = "accent";
        const header = item.shadowRoot?.querySelector("[part='header']");

        header?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        expect(item.getAttribute("header-surface")).toBe("accent");
        expect(item.open).toBe(true);
    });

    it("closes a dialog from its header button without collapsing", () => {
        const dialog = mount(document.createElement(UI_TAG_NAMES.DIALOG) as UIDialog);
        dialog.collapsible = true;
        const inner = dialog.shadowRoot?.querySelector("dialog");
        if (inner && typeof inner.showModal !== "function") {
            inner.showModal = () => {
                inner.open = true;
            };
            inner.close = () => {
                inner.open = false;
            };
        }
        dialog.showModal();
        const toggles = record(dialog, "ui-collapse-toggle");

        dialog.shadowRoot?.querySelector("[part='close-btn']")?.dispatchEvent(
            new MouseEvent("click", { bubbles: true }),
        );

        expect(dialog.open).toBe(false);
        expect(dialog.collapsed).toBe(false);
        expect(toggles).toHaveLength(0);
    });
});
