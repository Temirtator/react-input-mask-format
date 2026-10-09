import { describe, it, expect, vi } from "vitest";
import { resolveMaskConfig } from "../../src/core/config";
import { decideChange, decideFocus, decideBlur, decideClickSelection } from "../../src/core/decide";

const empty = { start: null, end: null };

describe("decideChange", () => {
  it("masks the typed character", () => {
    const cfg = resolveMaskConfig({ mask: "99/99" });
    const next = decideChange(
      cfg,
      { value: "1__/__", selection: { start: 1, end: 1 } },
      { value: "__/__", selection: { start: 0, end: 0 } }
    );
    expect(next.value).toBe("1_/__");
    expect(next.selection).toEqual({ start: 1, end: 1 });
  });

  it("calls beforeMaskedStateChange with currentState, previousState and nextState", () => {
    const before = vi.fn(({ nextState }) => ({ ...nextState, value: "9_/__" }));
    const cfg = resolveMaskConfig({ mask: "99/99", beforeMaskedStateChange: before });
    const currentState = { value: "1__/__", selection: { start: 1, end: 1 } };
    const previousState = { value: "__/__", selection: { start: 0, end: 0 } };
    const next = decideChange(cfg, currentState, previousState);
    expect(next.value).toBe("9_/__");
    const arg = before.mock.calls[0][0];
    expect(arg.currentState).toBe(currentState);
    expect(arg.previousState).toBe(previousState);
    expect(arg.nextState.value).toBe("1_/__");
  });
});

describe("decideFocus", () => {
  it("formats an unfilled value and places the caret", () => {
    const cfg = resolveMaskConfig({ mask: "99/99" });
    expect(decideFocus(cfg, { value: "", selection: empty })).toEqual({
      value: "__/__",
      selection: { start: 0, end: 0 }
    });
  });

  it("returns null for a filled value", () => {
    const cfg = resolveMaskConfig({ mask: "99/99" });
    expect(decideFocus(cfg, { value: "12/34", selection: { start: 5, end: 5 } })).toBeNull();
  });

  it("calls beforeMaskedStateChange without previousState", () => {
    const before = vi.fn(({ nextState }) => nextState);
    const cfg = resolveMaskConfig({ mask: "99/99", beforeMaskedStateChange: before });
    const currentState = { value: "", selection: empty };
    decideFocus(cfg, currentState);
    const arg = before.mock.calls[0][0];
    expect(Object.keys(arg).sort()).toEqual(["currentState", "nextState"]);
    expect(arg.currentState).toBe(currentState);
  });
});

describe("decideBlur", () => {
  it("clears an empty value", () => {
    const cfg = resolveMaskConfig({ mask: "99/99" });
    expect(decideBlur(cfg, { value: "__/__", selection: empty }, "__/__")).toEqual({
      value: "",
      selection: { start: null, end: null }
    });
  });

  it("returns null when the value has input", () => {
    const cfg = resolveMaskConfig({ mask: "99/99" });
    expect(decideBlur(cfg, { value: "1_/__", selection: empty }, "1_/__")).toBeNull();
  });

  it("returns null with alwaysShowMask", () => {
    const cfg = resolveMaskConfig({ mask: "99/99", alwaysShowMask: true });
    expect(decideBlur(cfg, { value: "__/__", selection: empty }, "__/__")).toBeNull();
  });

  it("decides from lastValue, not the DOM value", () => {
    const cfg = resolveMaskConfig({ mask: "99/99" });
    expect(decideBlur(cfg, { value: "1_/__", selection: empty }, "__/__")).not.toBeNull();
  });

  it("calls beforeMaskedStateChange without previousState", () => {
    const before = vi.fn(({ nextState }) => nextState);
    const cfg = resolveMaskConfig({ mask: "99/99", beforeMaskedStateChange: before });
    decideBlur(cfg, { value: "__/__", selection: empty }, "__/__");
    expect(Object.keys(before.mock.calls[0][0]).sort()).toEqual(["currentState", "nextState"]);
  });
});

describe("decideClickSelection", () => {
  it("returns the default selection for the value", () => {
    const cfg = resolveMaskConfig({ mask: "99/99" });
    expect(decideClickSelection(cfg, "12/__")).toMatchObject({ start: 3, end: 3 });
  });
});
