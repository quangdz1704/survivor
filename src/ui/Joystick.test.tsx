// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Joystick } from "./Joystick";
import { bridge } from "../game/bridge";
import { useUI } from "./store";

let root: Root;
let host: HTMLDivElement;
function pointer(
  node: Element,
  type: string,
  x = 300,
  y = 700,
  id = 1,
  button = 0,
) {
  const e = new MouseEvent(type, {
    bubbles: true,
    clientX: x,
    clientY: y,
    button,
  });
  Object.defineProperty(e, "pointerId", { value: id });
  act(() => {
    node.dispatchEvent(e);
  });
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  useUI.setState({ sensitivity: 1 });
  act(() => root.render(<Joystick />));
  const node = host.querySelector(".joystick-surface")! as HTMLElement;
  node.setPointerCapture = vi.fn();
  node.getBoundingClientRect = () => ({
    x: 20,
    y: 30,
    left: 20,
    top: 30,
    right: 410,
    bottom: 874,
    width: 390,
    height: 844,
    toJSON: () => ({}),
  });
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

describe("floating joystick", () => {
  it("starts hidden, appears at the touch position, and starts with zero movement", () => {
    const spy = vi.spyOn(bridge, "send");
    const node = host.querySelector(".joystick-surface")!;
    expect(host.querySelector(".joystick")).toBeNull();
    pointer(node, "pointerdown");
    const base = host.querySelector(".joystick") as HTMLElement;
    expect(base.style.left).toBe("280px");
    expect(base.style.top).toBe("670px");
    expect(spy).toHaveBeenLastCalledWith("move", { x: 0, y: 0 });
    expect((node as HTMLElement).setPointerCapture).toHaveBeenCalledWith(1);
  });
  it("uses the initial touch as the anchor, clamps travel, and hides on release", () => {
    const spy = vi.spyOn(bridge, "send");
    const node = host.querySelector(".joystick-surface")!;
    pointer(node, "pointerdown");
    pointer(node, "pointermove", 338, 700);
    expect(spy).toHaveBeenLastCalledWith("move", { x: 1, y: 0 });
    pointer(node, "pointermove", 500, 700);
    expect(
      (host.querySelector(".joystick-knob") as HTMLElement).style.transform,
    ).toBe("translate(38px,0px)");
    pointer(node, "pointerup");
    expect(spy).toHaveBeenLastCalledWith("move", { x: 0, y: 0 });
    expect(host.querySelector(".joystick")).toBeNull();
  });
  it("relocates to a new touch anywhere, including near the top edge", () => {
    const node = host.querySelector(".joystick-surface")!;
    pointer(node, "pointerdown");
    pointer(node, "pointerup");
    pointer(node, "pointerdown", 22, 33);
    const base = host.querySelector(".joystick") as HTMLElement;
    expect(base.style.left).toBe("2px");
    expect(base.style.top).toBe("3px");
  });
  it("uses a dead zone and stops on lost pointer capture", () => {
    const spy = vi.spyOn(bridge, "send");
    const node = host.querySelector(".joystick-surface")!;
    pointer(node, "pointerdown");
    pointer(node, "pointermove", 302, 702);
    expect(spy).toHaveBeenLastCalledWith("move", { x: 0, y: 0 });
    pointer(node, "pointermove", 300, 662);
    expect(spy).toHaveBeenLastCalledWith("move", { x: 0, y: -1 });
    pointer(node, "lostpointercapture");
    expect(spy).toHaveBeenLastCalledWith("move", { x: 0, y: 0 });
    expect(host.querySelector(".joystick")).toBeNull();
  });
  it("ignores a second finger, including its cancel and lost capture events", () => {
    const spy = vi.spyOn(bridge, "send");
    const node = host.querySelector(".joystick-surface")!;
    pointer(node, "pointerdown");
    spy.mockClear();
    for (const type of [
      "pointerdown",
      "pointermove",
      "pointerup",
      "pointercancel",
      "lostpointercapture",
    ])
      pointer(node, type, 100, 200, 2);
    expect(spy).not.toHaveBeenCalled();
    expect(host.querySelector(".joystick")).not.toBeNull();
    pointer(node, "pointercancel");
    expect(spy).toHaveBeenLastCalledWith("move", { x: 0, y: 0 });
    expect(host.querySelector(".joystick")).toBeNull();
  });
  it("clears movement when the browser loses focus", () => {
    const spy = vi.spyOn(bridge, "send");
    const node = host.querySelector(".joystick-surface")!;
    pointer(node, "pointerdown");
    pointer(node, "pointermove", 338, 700);
    act(() => window.dispatchEvent(new Event("blur")));
    expect(spy).toHaveBeenLastCalledWith("move", { x: 0, y: 0 });
    expect(host.querySelector(".joystick")).toBeNull();
    spy.mockClear();
    pointer(node, "pointermove", 338, 700);
    expect(spy).not.toHaveBeenCalled();
  });
  it("ignores right clicks and applies the configured sensitivity", () => {
    const spy = vi.spyOn(bridge, "send");
    const node = host.querySelector(".joystick-surface")!;
    pointer(node, "pointerdown", 300, 700, 1, 2);
    expect(spy).not.toHaveBeenCalled();
    act(() => useUI.setState({ sensitivity: 0.6 }));
    pointer(node, "pointerdown");
    pointer(node, "pointermove", 338, 700);
    expect(spy).toHaveBeenLastCalledWith("move", { x: 0.6, y: 0 });
  });
});
