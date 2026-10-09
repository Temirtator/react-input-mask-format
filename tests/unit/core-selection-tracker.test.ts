import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSelectionTracker } from "../../src/core/selection-tracker";

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

let input: HTMLInputElement;
beforeEach(() => {
  input = document.createElement("input");
  input.value = "12/34";
  document.body.appendChild(input);
});
afterEach(() => {
  input.remove();
});

describe("createSelectionTracker", () => {
  it("starts with a null selection", () => {
    const tracker = createSelectionTracker(() => input);
    expect(tracker.getLast()).toEqual({ start: null, end: null });
  });

  it("observes the selection each frame while started", async () => {
    const tracker = createSelectionTracker(() => input);
    input.focus();
    tracker.start();
    input.setSelectionRange(1, 3);
    await nextFrame();
    await nextFrame();
    expect(tracker.getLast()).toMatchObject({ start: 1, end: 3 });
    tracker.stop();
  });

  it("stops observing after stop", async () => {
    const tracker = createSelectionTracker(() => input);
    input.focus();
    tracker.start();
    input.setSelectionRange(1, 1);
    await nextFrame();
    await nextFrame();
    tracker.stop();
    input.setSelectionRange(4, 4);
    await nextFrame();
    await nextFrame();
    expect(tracker.getLast()).toMatchObject({ start: 1, end: 1 });
  });

  it("start is idempotent", async () => {
    const tracker = createSelectionTracker(() => input);
    const spy = vi.spyOn(window, "requestAnimationFrame");
    input.focus();
    tracker.start();
    tracker.start();
    const calls = spy.mock.calls.length;
    expect(calls).toBe(1);
    tracker.stop();
    spy.mockRestore();
  });

  it("set applies the selection and stores the actual one", () => {
    const tracker = createSelectionTracker(() => input);
    input.focus();
    tracker.set({ start: 2, end: 99 });
    expect(input.selectionStart).toBe(2);
    expect(input.selectionEnd).toBe(5);
    expect(tracker.getLast()).toMatchObject({ start: 2, end: 5 });
  });

  it("set is a no-op on an unfocused input", () => {
    const tracker = createSelectionTracker(() => input);
    const spy = vi.spyOn(input, "setSelectionRange");
    tracker.set({ start: 1, end: 1 });
    expect(spy).not.toHaveBeenCalled();
    expect(tracker.getLast()).toEqual({ start: null, end: null });
  });

  it("does not throw when the input is gone", async () => {
    let current: HTMLInputElement | null = input;
    const tracker = createSelectionTracker(() => current);
    input.focus();
    tracker.start();
    current = null;
    await nextFrame();
    await nextFrame();
    expect(() => tracker.getLast()).not.toThrow();
    tracker.stop();
  });
});
