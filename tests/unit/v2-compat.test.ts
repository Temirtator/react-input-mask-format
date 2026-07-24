import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  resolveMaskPlaceholder,
  toRegExpFormatChars,
  createBeforeMaskedStateChangeAdapter,
  warnDeprecatedOnce,
  __resetDeprecationWarnings
} from "../../src/v2-compat";

beforeEach(() => __resetDeprecationWarnings());

describe("resolveMaskPlaceholder", () => {
  it("v3 prop wins over v2 alias", () => {
    expect(resolveMaskPlaceholder("-", "*")).toBe("-");
  });
  it("falls back to maskChar including explicit null", () => {
    expect(resolveMaskPlaceholder(undefined, "*")).toBe("*");
    expect(resolveMaskPlaceholder(undefined, null)).toBeNull();
  });
  it("returns undefined when neither given (component applies default)", () => {
    expect(resolveMaskPlaceholder(undefined, undefined)).toBeUndefined();
  });
});

describe("toRegExpFormatChars", () => {
  it("converts string patterns to RegExp", () => {
    const result = toRegExpFormatChars({ "#": "[0-9]" })!;
    expect(result["#"]).toBeInstanceOf(RegExp);
    expect(result["#"].test("5")).toBe(true);
    expect(result["#"].test("a")).toBe(false);
  });
  it("returns undefined for undefined", () => {
    expect(toRegExpFormatChars(undefined)).toBeUndefined();
  });
});

describe("createBeforeMaskedStateChangeAdapter", () => {
  it("maps v3 args to v2 signature", () => {
    const v2fn = vi.fn((newState) => newState);
    const maskOptions = { mask: "99", maskChar: "_", alwaysShowMask: false, formatChars: { "9": "[0-9]" }, permanents: [] };
    const adapter = createBeforeMaskedStateChangeAdapter(v2fn, maskOptions);
    const prev = { value: "_", selection: { start: 0, end: 0 } };
    const next = { value: "1_", selection: { start: 1, end: 1 }, enteredString: "1" };
    const result = adapter({ previousState: prev, currentState: prev, nextState: next });
    expect(v2fn).toHaveBeenCalledWith(next, prev, "1", maskOptions);
    expect(result).toBe(next);
  });
});

describe("warnDeprecatedOnce", () => {
  it("warns once per prop", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnDeprecatedOnce("maskChar", "msg");
    warnDeprecatedOnce("maskChar", "msg");
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
