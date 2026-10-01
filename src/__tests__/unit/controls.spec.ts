import { describe, expect, it } from "vitest";
import "../../index.ts";
import { UI_TAG_NAMES } from "../../constants.ts";
import type {
    UIAccordionItem,
    UIAlert,
    UIButton,
    UIChip,
    UIField,
    UIInput,
    UINumberInput,
    UISegmentedControl,
    UISegmentItem,
    UISwitch,
    UITab,
    UITabs,
} from "../../index.ts";
import { mount, record } from "../harness.ts";

describe("control contract", () => {
    it("does not notify click listeners on a disabled button", () => {
        const button = mount(
            document.createElement(UI_TAG_NAMES.BUTTON) as UIButton,
        );
        button.disabled = true;
        const clicks = record(button, "click");

        button.click();

        expect(clicks).toHaveLength(0);
        expect(button.hasAttribute("disabled")).toBe(true);
    });

    it("does not notify click listeners while a button is loading", () => {
        const button = mount(
            document.createElement(UI_TAG_NAMES.BUTTON) as UIButton,
        );
        button.loading = true;
        const clicks = record(button, "click");

        button.click();

        expect(clicks).toHaveLength(0);
    });

    it("notifies one click on an enabled button", () => {
        const button = mount(
            document.createElement(UI_TAG_NAMES.BUTTON) as UIButton,
        );
        const clicks = record(button, "click");

        button.click();

        expect(clicks).toHaveLength(1);
    });

    it("reports a typed value once as ui-input and not as input", () => {
        const input = mount(
            document.createElement(UI_TAG_NAMES.INPUT) as UIInput,
        );
        const typed = record<{ value: string }>(input, "ui-input");
        const legacy = record(input, "input");
        const field = input.shadowRoot?.querySelector("input");
        if (!field) throw new Error("missing input");

        field.value = "Ada";
        field.dispatchEvent(new Event("input"));

        expect(input.value).toBe("Ada");
        expect(typed.map((event) => event.detail)).toEqual([{ value: "Ada" }]);
        expect(legacy).toHaveLength(0);
    });

    it("clears the value and reports both the edit and the commit", () => {
        const input = mount(
            document.createElement(UI_TAG_NAMES.INPUT) as UIInput,
        );
        input.clearable = true;
        input.value = "Ada";
        const typed = record<{ value: string }>(input, "ui-input");
        const committed = record<{ value: string }>(input, "ui-change");

        input.shadowRoot?.querySelector("button")?.dispatchEvent(
            new MouseEvent("click", { bubbles: true }),
        );

        expect(input.value).toBe("");
        expect(typed.map((event) => event.detail)).toEqual([{ value: "" }]);
        expect(committed.map((event) => event.detail)).toEqual([{ value: "" }]);
    });

    it("keeps markup in a field error as text", () => {
        const field = mount(
            document.createElement(UI_TAG_NAMES.FIELD) as UIField,
        );
        field.label = "Name";
        field.error = '<img id="xss" src="x">';

        expect(field.shadowRoot?.querySelector("#xss")).toBeNull();
        expect(field.shadowRoot?.textContent).toContain(
            '<img id="xss" src="x">',
        );
    });

    it("clamps a number to its max", () => {
        const input = mount(
            document.createElement(UI_TAG_NAMES.NUMBER_INPUT) as UINumberInput,
        );
        input.min = 0;
        input.max = 20;
        input.value = 50;

        expect(input.value).toBe(20);
    });

    it("rounds a number to the requested precision", () => {
        const input = mount(
            document.createElement(UI_TAG_NAMES.NUMBER_INPUT) as UINumberInput,
        );
        input.value = 1.239;
        input.precision = 2;

        expect(input.value).toBe(1.24);
    });

    it("does not step or emit when a number input is disabled", () => {
        const input = mount(
            document.createElement(UI_TAG_NAMES.NUMBER_INPUT) as UINumberInput,
        );
        input.value = 4;
        input.disabled = true;
        const changes = record(input, "ui-change");

        input.stepUp();

        expect(input.value).toBe(4);
        expect(changes).toHaveLength(0);
    });

    it("steps a number by its step and reports the new value once", () => {
        const input = mount(
            document.createElement(UI_TAG_NAMES.NUMBER_INPUT) as UINumberInput,
        );
        input.value = 10;
        input.step = 2;
        const changes = record<{ value: number }>(input, "ui-change");
        const legacy = record(input, "change");

        input.stepUp();

        expect(input.value).toBe(12);
        expect(changes.map((event) => event.detail)).toEqual([{ value: 12 }]);
        expect(legacy).toHaveLength(0);
    });

    it("toggles a switch on and off with one ui-change each time", () => {
        const toggle = mount(
            document.createElement(UI_TAG_NAMES.SWITCH) as UISwitch,
        );
        const changes = record<{ checked: boolean }>(toggle, "ui-change");
        const legacy = record(toggle, "change");

        toggle.toggle();
        toggle.toggle();

        expect(changes.map((event) => event.detail)).toEqual([
            { checked: true },
            { checked: false },
        ]);
        expect(legacy).toHaveLength(0);
    });

    it("does not toggle a disabled switch", () => {
        const toggle = mount(
            document.createElement(UI_TAG_NAMES.SWITCH) as UISwitch,
        );
        toggle.disabled = true;
        const changes = record(toggle, "ui-change");

        toggle.toggle();

        expect(toggle.checked).toBe(false);
        expect(changes).toHaveLength(0);
    });

    it("renders track and thumb with correct structure and size classes", async () => {
        const toggle = mount(
            document.createElement(UI_TAG_NAMES.SWITCH) as UISwitch,
        );
        toggle.size = "sm";
        await toggle.updateComplete;

        const track = toggle.shadowRoot?.querySelector(".track");
        const thumb = toggle.shadowRoot?.querySelector(".thumb");

        expect(track).not.toBeNull();
        expect(thumb).not.toBeNull();
        expect(track?.classList.contains("size-sm")).toBe(true);

        toggle.size = "lg";
        await toggle.updateComplete;
        expect(track?.classList.contains("size-lg")).toBe(true);

        toggle.checked = true;
        await toggle.updateComplete;
        expect(track?.classList.contains("checked")).toBe(true);
    });

    it("selects a segment and reports that value once", () => {
        const control = mount(
            document.createElement(
                UI_TAG_NAMES.SEGMENTED_CONTROL,
            ) as UISegmentedControl,
        );
        const melee = document.createElement(
            UI_TAG_NAMES.SEGMENT_ITEM,
        ) as UISegmentItem;
        melee.value = "melee";
        control.append(melee);
        const changes = record<{ value: string }>(control, "ui-change");
        const legacy = record(control, "change");

        control.setValue("melee");

        expect(control.value).toBe("melee");
        expect(changes.map((event) => event.detail)).toEqual([{
            value: "melee",
        }]);
        expect(legacy).toHaveLength(0);
    });

    it("selects the clicked tab and does not emit change", () => {
        const tabs = mount(document.createElement(UI_TAG_NAMES.TABS) as UITabs);
        const first = document.createElement(UI_TAG_NAMES.TAB) as UITab;
        const second = document.createElement(UI_TAG_NAMES.TAB) as UITab;
        first.value = "one";
        second.value = "two";
        tabs.append(first, second);
        const changes = record<{ value: string }>(tabs, "ui-change");
        const legacy = record(tabs, "change");

        second.click();

        expect(tabs.value).toBe("two");
        expect(second.active).toBe(true);
        expect(first.active).toBe(false);
        expect(changes.map((event) => event.detail)).toEqual([{
            value: "two",
        }]);
        expect(legacy).toHaveLength(0);
    });

    it("opens an accordion item once and ignores a disabled item", () => {
        const item = mount(
            document.createElement(
                UI_TAG_NAMES.ACCORDION_ITEM,
            ) as UIAccordionItem,
        );
        const changes = record<{ open: boolean }>(item, "ui-accordion-change");

        item.toggle();
        expect(item.open).toBe(true);
        expect(changes.map((event) => event.detail.open)).toEqual([true]);

        item.disabled = true;
        item.toggle();
        expect(item.open).toBe(true);
        expect(changes).toHaveLength(1);
    });

    it("selects a selectable chip and removes it on close", () => {
        const chip = mount(document.createElement(UI_TAG_NAMES.CHIP) as UIChip);
        chip.value = "fire";
        chip.selectable = true;
        const selected = record<{ value: string; selected: boolean }>(
            chip,
            "ui-chip-select",
        );
        const closed = record<{ value: string }>(chip, "ui-chip-close");

        chip.toggle();
        expect(chip.selected).toBe(true);
        expect(selected.map((event) => event.detail)).toEqual([{
            value: "fire",
            selected: true,
        }]);

        chip.close();
        expect(chip.isConnected).toBe(false);
        expect(closed.map((event) => event.detail)).toEqual([{
            value: "fire",
        }]);
    });

    it("dismisses an alert once under ui-alert-close", () => {
        const alert = mount(
            document.createElement(UI_TAG_NAMES.ALERT) as UIAlert,
        );
        alert.title = "<b>Heads up</b>";
        alert.closable = true;
        const closed = record(alert, "ui-alert-close");
        const legacy = record(alert, "close");

        expect(alert.shadowRoot?.querySelector("b")).toBeNull();
        expect(alert.shadowRoot?.textContent).toContain("<b>Heads up</b>");

        alert.dismiss();

        expect(alert.isConnected).toBe(false);
        expect(closed).toHaveLength(1);
        expect(legacy).toHaveLength(0);
    });
});
