import { describe, it, expect } from "vitest";
import { findLastIndex, repeat, toString, isFunction, isDOMElement } from "../../src/utils/helpers";

describe("helpers", () => {
  it("findLastIndex returns last matching index", () => {
    expect(findLastIndex([1, 2, 3, 2], x => x === 2)).toBe(3);
    expect(findLastIndex([1, 2, 3], x => x === 9)).toBe(-1);
  });

  it("repeat repeats string n times", () => {
    expect(repeat("ab", 3)).toBe("ababab");
    expect(repeat("x")).toBe("x");
  });

  it("toString stringifies values", () => {
    expect(toString(12)).toBe("12");
    expect(toString("a")).toBe("a");
  });

  it("isFunction detects functions", () => {
    expect(isFunction(() => {})).toBe(true);
    expect(isFunction("x")).toBe(false);
  });

  it("isDOMElement detects DOM elements (jsdom)", () => {
    const el = document.createElement("input");
    document.body.appendChild(el);
    expect(isDOMElement(el)).toBe(true);
    expect(isDOMElement(null)).toBe(false);
  });
});
