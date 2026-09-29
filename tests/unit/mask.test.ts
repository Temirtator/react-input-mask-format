import { describe, it, expect } from "vitest";
import MaskUtils from "../../src/utils/mask";

const date = () => new MaskUtils({ mask: "99/99/9999", maskPlaceholder: "_" });

describe("MaskUtils.formatValue", () => {
  it("formats partial value with placeholder", () => {
    expect(date().formatValue("12")).toBe("12/__/____");
  });

  it("formats full value inserting permanents", () => {
    expect(date().formatValue("12345678")).toBe("12/34/5678");
  });

  it("formats with null placeholder up to next editable position", () => {
    const utils = new MaskUtils({ mask: "99/99", maskPlaceholder: null });
    expect(utils.formatValue("12")).toBe("12/");
  });
});

describe("MaskUtils value state checks", () => {
  it("isValueEmpty / isValueFilled", () => {
    const utils = date();
    expect(utils.isValueEmpty("__/__/____")).toBe(true);
    expect(utils.isValueEmpty("1_/__/____")).toBe(false);
    expect(utils.isValueFilled("12/34/5678")).toBe(true);
    expect(utils.isValueFilled("12/34/567_")).toBe(false);
  });

  it("getDefaultSelectionForValue points to first empty editable position", () => {
    expect(date().getDefaultSelectionForValue("12/__/____")).toEqual({ start: 3, end: 3 });
  });
});

describe("MaskUtils.processChange", () => {
  const empty = { value: "__/__/____", selection: { start: 0, end: 0, length: 0 } };

  it("handles typing a character", () => {
    const result = date().processChange(
      { value: "1__/__/____", selection: { start: 1, end: 1 } },
      empty
    );
    expect(result.value).toBe("1_/__/____");
    expect(result.selection).toEqual({ start: 1, end: 1 });
    expect(result.enteredString).toBe("1");
  });

  it("skips permanent character on typing past it", () => {
    const result = date().processChange(
      { value: "123/__/____", selection: { start: 3, end: 3 } },
      { value: "12/__/____", selection: { start: 2, end: 2, length: 0 } }
    );
    expect(result.value).toBe("12/3_/____");
    expect(result.selection).toEqual({ start: 4, end: 4 });
  });

  it("handles backspace (single char delete)", () => {
    const result = date().processChange(
      { value: "1/__/____", selection: { start: 1, end: 1 } },
      { value: "12/__/____", selection: { start: 2, end: 2, length: 0 } }
    );
    expect(result.value).toBe("1_/__/____");
    expect(result.selection).toEqual({ start: 1, end: 1 });
  });

  it("handles paste of full string", () => {
    const result = date().processChange(
      { value: "12345678__/__/____", selection: { start: 8, end: 8 } },
      empty
    );
    expect(result.value).toBe("12/34/5678");
  });
});

describe("MaskUtils transform", () => {
  const upper = (c: string) => c.toUpperCase();

  it("uppercases entered characters at editable positions", () => {
    const utils = new MaskUtils({ mask: "aaa", maskPlaceholder: "_", transform: upper });
    expect(utils.formatValue("abc")).toBe("ABC");
  });

  it("does not transform permanent (literal) characters", () => {
    const utils = new MaskUtils({ mask: "aa-aa", maskPlaceholder: "_", transform: upper });
    expect(utils.formatValue("abcd")).toBe("AB-CD");
  });

  it("lets lowercase input fill an uppercase-only class via uppercase transform", () => {
    const utils = new MaskUtils({ mask: [/[A-Z]/, /[A-Z]/], maskPlaceholder: "_", transform: upper });
    expect(utils.formatValue("ab")).toBe("AB");
  });

  it("is identity when no transform is given", () => {
    const utils = new MaskUtils({ mask: "aaa", maskPlaceholder: "_" });
    expect(utils.formatValue("abc")).toBe("abc");
  });
});

describe("MaskUtils prefix-aware input", () => {
  const uzPhoneMask = "+\\9\\98 (99) 999-99-99";
  const phone = () => new MaskUtils({ mask: uzPhoneMask, maskPlaceholder: "_" });

  it("formatValue places bare national digits after the prefix", () => {
    expect(phone().formatValue("901234567")).toBe("+998 (90) 123-45-67");
  });

  it("formatValue drops a country code that overflows the slots", () => {
    expect(phone().formatValue("+998901234567")).toBe("+998 (90) 123-45-67");
    expect(phone().formatValue("998 90 123 45 67")).toBe("+998 (90) 123-45-67");
  });

  it("formatValue leaves formatted and partial prefixed values alone", () => {
    expect(phone().formatValue("+998 (90) 123-45-67")).toBe("+998 (90) 123-45-67");
    expect(phone().formatValue("+998 (90) 1__-__-__")).toBe("+998 (90) 1__-__-__");
  });

  it("formatValue normalises values for a prefixed mask without placeholder", () => {
    const utils = new MaskUtils({ mask: uzPhoneMask, maskPlaceholder: null });
    expect(utils.formatValue("901234567")).toBe("+998 (90) 123-45-67");
    expect(utils.formatValue("+998901234567")).toBe("+998 (90) 123-45-67");
  });

  it("masks without a significant prefix are unchanged", () => {
    expect(new MaskUtils({ mask: "99/99/9999", maskPlaceholder: "_" }).formatValue("12345678"))
      .toBe("12/34/5678");
    expect(new MaskUtils({ mask: "9999 9999 9999 9999", maskPlaceholder: "_" }).formatValue("42424242424242421"))
      .toBe("4242 4242 4242 4242");
    expect(new MaskUtils({ mask: "(999) 999-9999", maskPlaceholder: "_" }).formatValue("5551234567"))
      .toBe("(555) 123-4567");
  });

  it("trimOverflowingPrefix keeps the last slots-worth of characters entered at the start", () => {
    const utils = phone();
    expect(utils.trimOverflowingPrefix("+998 90 123 45 67", 6)).toBe("90 123 45 67");
    expect(utils.trimOverflowingPrefix("8 90 123 45 67", 6)).toBe("90 123 45 67");
    expect(utils.trimOverflowingPrefix("90 123 45 67", 6)).toBe("90 123 45 67");
    expect(utils.trimOverflowingPrefix("+998 90 123 45 67", 10)).toBe("+998 90 123 45 67");
  });
});
