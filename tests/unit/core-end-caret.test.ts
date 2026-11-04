import { describe, it, expect } from "vitest";
import { resolveMaskConfig } from "../../src/core/config";
import { decideChange } from "../../src/core/decide";
import { kzPhone } from "../../src/presets";

const at = (value: string, caret: number) => ({ value, selection: { start: caret, end: caret, length: 0 } });

describe("decideChange with the caret past the last slot", () => {
  const phone = resolveMaskConfig(kzPhone);

  it("types into the slot after the last filled one instead of dropping the character", () => {
    const next = decideChange(phone, at("+7 (701) ___-__-__2", 19), at("+7 (701) ___-__-__", 18));
    expect(next.value).toBe("+7 (701) 2__-__-__");
    expect(next.selection).toEqual({ start: 10, end: 10 });
  });

  it("uses the slot after the last filled one, not the first empty slot", () => {
    const next = decideChange(phone, at("+7 (7_1) ___-__-__9", 19), at("+7 (7_1) ___-__-__", 18));
    expect(next.value).toBe("+7 (7_1) 9__-__-__");
    expect(next.selection).toEqual({ start: 10, end: 10 });
  });

  it("pastes into the slot after the last filled one", () => {
    const next = decideChange(phone, at("+7 (701) ___-__-__2345678", 25), at("+7 (701) ___-__-__", 18));
    expect(next.value).toBe("+7 (701) 234-56-78");
    expect(next.selection).toEqual({ start: 18, end: 18 });
  });

  it("reads a pasted international number as if pasted after the prefix", () => {
    const next = decideChange(phone, at("+7 (7__) ___-__-__+7 701 234 56 78", 34), at("+7 (7__) ___-__-__", 18));
    expect(next.value).toBe("+7 (701) 234-56-78");
    expect(next.selection).toEqual({ start: 18, end: 18 });
  });

  it("types into the first slot of an untouched template", () => {
    const next = decideChange(phone, at("+7 (7__) ___-__-__0", 19), at("+7 (7__) ___-__-__", 18));
    expect(next.value).toBe("+7 (70_) ___-__-__");
    expect(next.selection).toEqual({ start: 6, end: 6 });
  });

  it("skips a trailing literal", () => {
    const cfg = resolveMaskConfig({ mask: "(999)", maskPlaceholder: "_" });
    const next = decideChange(cfg, at("(1__)2", 6), at("(1__)", 5));
    expect(next.value).toBe("(12_)");
    expect(next.selection).toEqual({ start: 3, end: 3 });
  });

  it("still ignores typing past a filled value", () => {
    const next = decideChange(phone, at("+7 (701) 234-56-789", 19), at("+7 (701) 234-56-78", 18));
    expect(next.value).toBe("+7 (701) 234-56-78");
  });

  it("still ignores typing at the end when the last slot is filled", () => {
    const next = decideChange(phone, at("+7 (701) ___-__-_89", 19), at("+7 (701) ___-__-_8", 18));
    expect(next.value).toBe("+7 (701) ___-__-_8");
    expect(next.selection).toEqual({ start: 18, end: 18 });
  });

  it.each([["x"], [" "]])("drops %j, a key no slot accepts, and moves the caret to the slot after the last filled one", key => {
    const next = decideChange(phone, at(`+7 (701) ___-__-__${key}`, 19), at("+7 (701) ___-__-__", 18));
    expect(next.value).toBe("+7 (701) ___-__-__");
    expect(next.selection).toEqual({ start: 9, end: 9 });
  });

  it("keeps typing at a caret placed inside the empty part", () => {
    const next = decideChange(phone, at("+7 (701) ___-5__-__", 14), at("+7 (701) ___-__-__", 13));
    expect(next.value).toBe("+7 (701) ___-5_-__");
  });

  it("(by design) replaces a placeholder character typed into the last slot with the next typed character", () => {
    const cfg = resolveMaskConfig({ mask: [/[A-Za-z0-9]/], maskPlaceholder: "_" });
    const typed = decideChange(cfg, at("__", 1), at("_", 0));
    expect(typed.value).toBe("_");
    expect(typed.selection).toEqual({ start: 1, end: 1 });
    const next = decideChange(cfg, at("_0", 2), at("_", 1));
    expect(next.value).toBe("0");
    expect(next.selection).toEqual({ start: 1, end: 1 });
  });
});
