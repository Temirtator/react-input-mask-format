import { describe, it, expect } from "vitest";
import { setInputSelection, getInputSelection, isInputFocused } from "../../src/utils/input";

describe("input utils", () => {
  it("set/getInputSelection roundtrip", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.value = "12/34";
    input.focus();
    setInputSelection(input, 1, 3);
    expect(getInputSelection(input)).toEqual({ start: 1, end: 3, length: 2 });
    setInputSelection(input, 2); // end defaults to start
    expect(getInputSelection(input)).toEqual({ start: 2, end: 2, length: 0 });
  });

  it("sees focus on an input inside a shadow root", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const input = document.createElement("input");
    host.attachShadow({ mode: "open" }).appendChild(input);
    const outside = document.createElement("input");
    document.body.appendChild(outside);
    input.focus();
    expect(isInputFocused(input)).toBe(true);
    expect(isInputFocused(outside)).toBe(false);
    outside.focus();
    expect(isInputFocused(input)).toBe(false);
    expect(isInputFocused(outside)).toBe(true);
    host.remove();
    outside.remove();
  });

  it("treats a detached input as not focused", () => {
    expect(isInputFocused(document.createElement("input"))).toBe(false);
  });
});
