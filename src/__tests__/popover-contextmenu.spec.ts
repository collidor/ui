import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../index.ts";
import { UI_TAG_NAMES, UIContextMenu, UIMenu, UIMenuItem, UIPopover, UITooltip } from "../index.ts";

describe("UIPopover and UIContextMenu Web Components", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    describe("UIPopover", () => {
        it("should be registered in customElements", () => {
            expect(customElements.get(UI_TAG_NAMES.POPOVER)).toBeDefined();
            const popover = document.createElement(
                UI_TAG_NAMES.POPOVER,
            ) as UIPopover;
            expect(popover).toBeInstanceOf(UIPopover);
        });

        it("should toggle open/closed state correctly", () => {
            const popover = document.createElement(
                UI_TAG_NAMES.POPOVER,
            ) as UIPopover;
            container.appendChild(popover);

            const openSpy = vi.fn<() => void>();
            const closeSpy = vi.fn<() => void>();
            popover.addEventListener("ui-popover-open", openSpy);
            popover.addEventListener("ui-popover-close", closeSpy);

            expect(popover.open).toBe(false);
            popover.show();
            expect(popover.open).toBe(true);
            expect(openSpy).toHaveBeenCalled();

            popover.hide();
            expect(popover.open).toBe(false);
            expect(closeSpy).toHaveBeenCalled();

            popover.toggle();
            expect(popover.open).toBe(true);
        });

        it("should handle placement and backdrop attributes", () => {
            const popover = document.createElement(
                UI_TAG_NAMES.POPOVER,
            ) as UIPopover;
            popover.setAttribute("placement", "top-start");
            popover.setAttribute("backdrop", "");
            popover.setAttribute("offset", "12");
            container.appendChild(popover);

            expect(popover.placement).toBe("top-start");
            expect(popover.backdrop).toBe(true);
            expect(popover.offset).toBe(12);
        });

        it("should position at anchor element and coordinates", () => {
            const anchor = document.createElement("button");
            anchor.style.position = "fixed";
            anchor.style.left = "100px";
            anchor.style.top = "100px";
            anchor.style.width = "80px";
            anchor.style.height = "30px";
            container.appendChild(anchor);

            const popover = document.createElement(
                UI_TAG_NAMES.POPOVER,
            ) as UIPopover;
            container.appendChild(popover);

            popover.show(anchor);
            expect(popover.open).toBe(true);

            popover.show({ x: 250, y: 150 });
            expect(popover.open).toBe(true);
        });
    });

    describe("UIContextMenu", () => {
        it("should be registered in customElements", () => {
            expect(customElements.get(UI_TAG_NAMES.CONTEXT_MENU)).toBeDefined();
            const menu = document.createElement(
                UI_TAG_NAMES.CONTEXT_MENU,
            ) as UIContextMenu;
            expect(menu).toBeInstanceOf(UIContextMenu);
        });

        it("should intercept contextmenu on target and open at click location", () => {
            const target = document.createElement("div");
            target.id = "context-target";
            container.appendChild(target);

            const menu = document.createElement(
                UI_TAG_NAMES.CONTEXT_MENU,
            ) as UIContextMenu;
            menu.setAttribute("target", "#context-target");

            const item1 = document.createElement(
                UI_TAG_NAMES.MENU_ITEM,
            ) as UIMenuItem;
            item1.setAttribute("value", "copy");
            item1.textContent = "Copy";
            menu.appendChild(item1);

            container.appendChild(menu);

            const openSpy = vi.fn<(e: Event) => void>();
            menu.addEventListener("ui-context-menu-open", openSpy);

            // Dispatch contextmenu event on target
            const contextEvent = new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                clientX: 120,
                clientY: 240,
            });
            target.dispatchEvent(contextEvent);

            expect(contextEvent.defaultPrevented).toBe(true);
            expect(menu.open).toBe(true);
            expect(openSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: { x: 120, y: 240 },
                }),
            );
        });

        it("should emit select event and close on item click", () => {
            const menu = document.createElement(
                UI_TAG_NAMES.CONTEXT_MENU,
            ) as UIContextMenu;
            const item1 = document.createElement(
                UI_TAG_NAMES.MENU_ITEM,
            ) as UIMenuItem;
            item1.setAttribute("value", "cut");
            item1.textContent = "Cut";

            const item2 = document.createElement(
                UI_TAG_NAMES.MENU_ITEM,
            ) as UIMenuItem;
            item2.setAttribute("value", "paste");
            item2.textContent = "Paste";

            menu.appendChild(item1);
            menu.appendChild(item2);
            container.appendChild(menu);

            const selectSpy = vi.fn<(e: Event) => void>();
            menu.addEventListener("ui-menu-select", selectSpy);

            menu.showAt(50, 50);
            expect(menu.open).toBe(true);

            item1.click();
            expect(selectSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: { value: "cut", item: item1 },
                }),
            );
            expect(menu.open).toBe(false);
        });

        it("should navigate and select via keyboard", () => {
            const menu = document.createElement(
                UI_TAG_NAMES.CONTEXT_MENU,
            ) as UIContextMenu;
            const item1 = document.createElement(
                UI_TAG_NAMES.MENU_ITEM,
            ) as UIMenuItem;
            item1.setAttribute("value", "action-1");
            item1.textContent = "Action 1";

            const item2 = document.createElement(
                UI_TAG_NAMES.MENU_ITEM,
            ) as UIMenuItem;
            item2.setAttribute("value", "action-2");
            item2.textContent = "Action 2";

            menu.appendChild(item1);
            menu.appendChild(item2);
            container.appendChild(menu);

            menu.showAt(100, 100);

            // Test Escape key closes menu
            window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "Escape" }),
            );
            expect(menu.open).toBe(false);
        });

        it("should reposition cleanly when right-clicking another location while already open", () => {
            const target = document.createElement("div");
            target.id = "workspace-target";
            container.appendChild(target);

            const menu = document.createElement(
                UI_TAG_NAMES.CONTEXT_MENU,
            ) as UIContextMenu;
            menu.setAttribute("target", "#workspace-target");
            container.appendChild(menu);

            // First right click at (100, 100)
            target.dispatchEvent(
                new MouseEvent("contextmenu", {
                    bubbles: true,
                    cancelable: true,
                    clientX: 100,
                    clientY: 100,
                }),
            );
            expect(menu.open).toBe(true);

            // Second right click at (300, 400) while open
            // Simulates browser sequence: pointerdown(button 2) -> contextmenu
            window.dispatchEvent(
                new PointerEvent("pointerdown", {
                    bubbles: true,
                    cancelable: true,
                    button: 2,
                    clientX: 300,
                    clientY: 400,
                }),
            );
            target.dispatchEvent(
                new MouseEvent("contextmenu", {
                    bubbles: true,
                    cancelable: true,
                    clientX: 300,
                    clientY: 400,
                }),
            );

            expect(menu.open).toBe(true);
        });

        it("should intercept contextmenu via delegated document listener", () => {
            const dynamicTarget = document.createElement("div");
            dynamicTarget.id = "dynamic-target";
            container.appendChild(dynamicTarget);

            const menu = document.createElement(UI_TAG_NAMES.CONTEXT_MENU) as UIContextMenu;
            menu.setAttribute("target", "#dynamic-target");
            const item = document.createElement(UI_TAG_NAMES.MENU_ITEM) as UIMenuItem;
            item.setAttribute("value", "test");
            item.textContent = "Test Item";
            menu.appendChild(item);
            container.appendChild(menu);

            const event = new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                clientX: 150,
                clientY: 250,
            });
            dynamicTarget.dispatchEvent(event);

            expect(event.defaultPrevented).toBe(true);
            expect(menu.open).toBe(true);
        });
    });

    describe("UIMenu inline and dropdown behavior", () => {
        it("should render inline by default and remain visible on selection", () => {
            const menu = document.createElement(UI_TAG_NAMES.MENU) as UIMenu;
            const item = document.createElement(UI_TAG_NAMES.MENU_ITEM) as UIMenuItem;
            item.setAttribute("value", "action");
            item.textContent = "Action";
            menu.appendChild(item);
            container.appendChild(menu);

            expect(menu.isDropdown).toBe(false);

            const selectSpy = vi.fn();
            menu.addEventListener("ui-menu-select", selectSpy);
            item.click();

            expect(selectSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: { value: "action", item },
                }),
            );
            // Inline menu does not close itself on item click
            expect(menu.open).toBe(false);
        });

        it("should operate as a dropdown when trigger is set", () => {
            const btn = document.createElement("button");
            btn.id = "menu-trigger-btn";
            container.appendChild(btn);

            const menu = document.createElement(UI_TAG_NAMES.MENU) as UIMenu;
            menu.setAttribute("trigger", "#menu-trigger-btn");
            const item = document.createElement(UI_TAG_NAMES.MENU_ITEM) as UIMenuItem;
            item.setAttribute("value", "save");
            item.textContent = "Save";
            menu.appendChild(item);
            container.appendChild(menu);

            expect(menu.isDropdown).toBe(true);
            expect(menu.open).toBe(false);

            // Click trigger button opens dropdown
            btn.click();
            expect(menu.open).toBe(true);

            // Item click emits event and closes dropdown
            const selectSpy = vi.fn();
            menu.addEventListener("ui-menu-select", selectSpy);
            item.click();

            expect(selectSpy).toHaveBeenCalled();
            expect(menu.open).toBe(false);
        });
    });

    describe("UIPopover anchor and trigger integration", () => {
        it("should support anchor method chaining", () => {
            const btn = document.createElement("button");
            container.appendChild(btn);

            const popover = document.createElement(UI_TAG_NAMES.POPOVER) as UIPopover;
            container.appendChild(popover);

            popover.anchor(btn);
            popover.toggle();
            expect(popover.open).toBe(true);

            popover.toggle();
            expect(popover.open).toBe(false);
        });

        it("should automatically bind to trigger attribute", () => {
            const triggerBtn = document.createElement("button");
            triggerBtn.id = "popover-btn";
            container.appendChild(triggerBtn);

            const popover = document.createElement(UI_TAG_NAMES.POPOVER) as UIPopover;
            popover.setAttribute("trigger", "#popover-btn");
            container.appendChild(popover);

            expect(popover.open).toBe(false);
            triggerBtn.click();
            expect(popover.open).toBe(true);
        });
    });
});
