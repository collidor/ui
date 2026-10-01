import { afterEach } from "vitest";

export function mount<T extends HTMLElement>(element: T): T {
    document.body.appendChild(element);
    return element;
}

export function record<T>(target: EventTarget, type: string): CustomEvent<T>[] {
    const events: CustomEvent<T>[] = [];
    target.addEventListener(type, (event) => {
        events.push(event as CustomEvent<T>);
    });
    return events;
}

afterEach(() => {
    document.body.replaceChildren();
});
