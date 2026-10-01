import { describe, expect, it } from "vitest";
import "../../index.ts";
import { UI_TAG_NAMES } from "../../constants.ts";
import type { UIDialog, UIStructForm, UITable } from "../../index.ts";
import { mount, record } from "../harness.ts";

const heroes: Array<Record<string, unknown>> = [
    { id: "o", name: "Odysseus" },
    { id: "a", name: "Ajax" },
    { id: "p", name: "Paris" },
];

function rowNames(rows: ReadonlyArray<Record<string, unknown>>): string[] {
    return rows.map((row) => {
        if (typeof row.name !== "string") {
            throw new Error("expected a string name");
        }
        return row.name;
    });
}

describe("collection contract", () => {
    it("sorts table rows ascending by name and emits ui-sort once", () => {
        const table = mount(document.createElement(UI_TAG_NAMES.TABLE));
        table.columns = [{ key: "name", label: "Name", sortable: true }];
        table.data = heroes;
        const sorts = record<
            { column: string; direction: string; data: Record<string, unknown>[] }
        >(table, "ui-sort");
        const legacy = record(table, "sort");

        table.sort("name");

        expect(rowNames(table.data)).toEqual(["Ajax", "Odysseus", "Paris"]);
        expect(sorts).toHaveLength(1);
        expect(sorts[0]?.detail.column).toBe("name");
        expect(sorts[0]?.detail.direction).toBe("asc");
        expect(rowNames(sorts[0]?.detail.data ?? [])).toEqual([
            "Ajax",
            "Odysseus",
            "Paris",
        ]);
        expect(legacy).toHaveLength(0);
    });

    it("shows hostile cell text instead of parsing it as markup", () => {
        const table = mount(
            document.createElement(UI_TAG_NAMES.TABLE) as UITable,
        );
        table.columns = [{ key: "name", label: "Name" }];
        table.data = [{ name: '<img id="xss">' }];

        expect(table.shadowRoot?.querySelector("#xss")).toBeNull();
        expect(table.shadowRoot?.textContent).toContain('<img id="xss">');
    });

    it("selects one list item when selection mode is single", () => {
        const list = mount(document.createElement(UI_TAG_NAMES.LIST));
        list.selectable = true;
        list.selectionMode = "single";
        list.data = heroes;
        const changes = record<{ selectedKeys: string[] }>(
            list,
            "ui-selection-change",
        );
        const legacy = record(list, "selection-change");

        list.toggleItemSelection(heroes[0]!, 0);
        list.toggleItemSelection(heroes[1]!, 1);

        expect(list.selectedKeys).toEqual(["a"]);
        expect(changes.map((event) => event.detail.selectedKeys)).toEqual([[
            "o",
        ], ["a"]]);
        expect(legacy).toHaveLength(0);
    });

    it("submits the struct form values a caller set", () => {
        const form = mount(
            document.createElement(UI_TAG_NAMES.STRUCT_FORM) as UIStructForm,
        );
        form.fields = [{ key: "name", label: "Name", widget: "text" }];
        const changes = record<
            {
                fieldKey: string;
                fieldValue: unknown;
                values: Record<string, unknown>;
            }
        >(
            form,
            "ui-form-change",
        );
        const submits = record<{ values: Record<string, unknown> }>(
            form,
            "ui-form-submit",
        );
        const legacyChange = record(form, "form-change");
        const legacySubmit = record(form, "form-submit");

        form.setFieldValue("name", "Ada");
        form.submit();

        expect(form.getFieldValue("name")).toBe("Ada");
        expect(changes.map((event) => event.detail)).toEqual([
            { fieldKey: "name", fieldValue: "Ada", values: { name: "Ada" } },
        ]);
        expect(submits.map((event) => event.detail)).toEqual([{
            values: { name: "Ada" },
        }]);
        expect(legacyChange).toHaveLength(0);
        expect(legacySubmit).toHaveLength(0);
    });

    it("opens and closes a dialog once each", () => {
        const dialog = mount(
            document.createElement(UI_TAG_NAMES.DIALOG) as UIDialog,
        );
        const inner = dialog.shadowRoot?.querySelector("dialog");
        if (inner && typeof inner.showModal !== "function") {
            inner.showModal = () => {
                inner.open = true;
            };
            inner.close = () => {
                inner.open = false;
            };
        }
        const opened = record(dialog, "ui-open");
        const closed = record(dialog, "ui-close");
        const legacyOpen = record(dialog, "open");
        const legacyClose = record(dialog, "close");

        dialog.showModal();
        dialog.close();

        expect(dialog.open).toBe(false);
        expect(opened).toHaveLength(1);
        expect(closed).toHaveLength(1);
        expect(legacyOpen).toHaveLength(0);
        expect(legacyClose).toHaveLength(0);
    });
});
