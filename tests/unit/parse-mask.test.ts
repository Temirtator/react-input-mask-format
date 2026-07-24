import { describe, it, expect } from "vitest";
import parseMask from "../../src/utils/parse-mask";

describe("parseMask", () => {
  it("returns null options without mask", () => {
    expect(parseMask({ mask: null, maskPlaceholder: "_" })).toEqual({
      maskPlaceholder: null,
      mask: null,
      prefix: null,
      lastEditablePosition: null,
      permanents: []
    });
  });

  it("parses string mask with permanents", () => {
    const result = parseMask({ mask: "99/99", maskPlaceholder: "_" });
    expect(result.permanents).toEqual([2]);
    expect(result.prefix).toBe("");
    expect(result.lastEditablePosition).toBe(4);
    expect(result.maskPlaceholder).toBe("__/__");
    expect(result.mask).toHaveLength(5);
    expect(result.mask![0]).toBeInstanceOf(RegExp);
    expect(result.mask![2]).toBe("/");
  });

  it("handles escaped format characters and prefix", () => {
    // "+4\\9 99" in JS source is the string +4\9 99 — the 9 after backslash is permanent
    const result = parseMask({ mask: "+4\\9 99", maskPlaceholder: "_" });
    expect(result.permanents).toEqual([0, 1, 2, 3]);
    expect(result.prefix).toBe("+49 ");
    expect(result.lastEditablePosition).toBe(5);
    expect(result.maskPlaceholder).toBe("+49 __");
  });

  it("parses array mask", () => {
    const digit = /[0-9]/;
    const result = parseMask({ mask: [digit, digit, "-", digit], maskPlaceholder: null });
    expect(result.permanents).toEqual([2]);
    expect(result.maskPlaceholder).toBeNull();
    expect(result.mask).toEqual([digit, digit, "-", digit]);
  });

  it("expands multi-character maskPlaceholder", () => {
    const result = parseMask({ mask: "99/99", maskPlaceholder: "dd/mm" });
    expect(result.maskPlaceholder).toBe("dd/mm");
  });
});
