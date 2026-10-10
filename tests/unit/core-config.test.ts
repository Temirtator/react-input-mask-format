import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveMaskConfig } from "../../src/core/config";
import { __resetDeprecationWarnings } from "../../src/v2-compat";
import type { BeforeMaskedValueChangeFn } from "../../src/types";

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  __resetDeprecationWarnings();
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe("resolveMaskConfig", () => {
  it("defaults maskPlaceholder to _", () => {
    const cfg = resolveMaskConfig({ mask: "99" });
    expect(cfg.maskPlaceholder).toBe("_");
    expect(cfg.maskUtils.formatValue("1")).toBe("1_");
    expect(cfg.alwaysShowMask).toBe(false);
  });

  it("prefers maskPlaceholder over maskChar and keeps explicit null", () => {
    expect(resolveMaskConfig({ mask: "99", maskPlaceholder: "-", maskChar: "*" }).maskPlaceholder).toBe("-");
    expect(resolveMaskConfig({ mask: "99", maskChar: "*" }).maskPlaceholder).toBe("*");
    expect(resolveMaskConfig({ mask: "99", maskPlaceholder: null }).maskPlaceholder).toBeNull();
  });

  it("warns once for maskChar with the migration link", () => {
    resolveMaskConfig({ mask: "99", maskChar: "*" });
    resolveMaskConfig({ mask: "99", maskChar: "*" });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("#migrating-from-react-input-mask");
  });

  it("normalizes string formatChars and warns once", () => {
    const cfg = resolveMaskConfig({ mask: "##", formatChars: { "#": "[0-9]" } });
    expect(cfg.maskUtils.formatValue("12")).toBe("12");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("formatChars");
  });

  it("applies transform", () => {
    const cfg = resolveMaskConfig({ mask: "aa", transform: "uppercase" });
    expect(cfg.maskUtils.transform!("a", 0)).toBe("A");
  });

  it("wraps beforeMaskedValueChange into beforeMaskedStateChange and warns", () => {
    const v2 = vi.fn<BeforeMaskedValueChangeFn>(newState => newState);
    const cfg = resolveMaskConfig({ mask: "99", beforeMaskedValueChange: v2 });
    const next = { value: "1_", selection: { start: 1, end: 1 } };
    cfg.beforeMaskedStateChange!({ nextState: next });
    expect(v2).toHaveBeenCalledTimes(1);
    expect(v2.mock.calls[0][3]).toMatchObject({ mask: "99", maskChar: "_", alwaysShowMask: false });
    expect(v2.mock.calls[0][3]!.permanents).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("beforeMaskedValueChange");
  });

  it("prefers beforeMaskedStateChange over beforeMaskedValueChange", () => {
    const v3 = vi.fn(({ nextState }) => nextState);
    const v2 = vi.fn(newState => newState);
    const cfg = resolveMaskConfig({ mask: "99", beforeMaskedStateChange: v3, beforeMaskedValueChange: v2 });
    expect(cfg.beforeMaskedStateChange).toBe(v3);
  });

  it("accepts a null mask", () => {
    const cfg = resolveMaskConfig({ mask: null });
    expect(cfg.maskUtils.maskOptions.mask).toBeNull();
  });
});
