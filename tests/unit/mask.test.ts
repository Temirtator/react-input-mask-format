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

  it("formatValue reads a partial number without + as national and a complete one with the code", () => {
    expect(phone().formatValue("9989")).toBe("+998 (99) 89_-__-__");
    expect(phone().formatValue("998901")).toBe("+998 (99) 890-1_-__");
    expect(phone().formatValue("+998901234")).toBe("+998 (90) 123-4_-__");
    expect(phone().formatValue("998901234")).toBe("+998 (90) 123-4_-__");
    expect(phone().formatValue("998")).toBe("+998 (99) 8__-__-__");
  });

  it("formatValue keeps the last characters of an overflowing unprefixed value", () => {
    expect(phone().formatValue("9989012345678")).toBe("+998 (01) 234-56-78");
  });

  it("masks without a significant prefix are unchanged", () => {
    expect(new MaskUtils({ mask: "99/99/9999", maskPlaceholder: "_" }).formatValue("12345678"))
      .toBe("12/34/5678");
    expect(new MaskUtils({ mask: "9999 9999 9999 9999", maskPlaceholder: "_" }).formatValue("42424242424242421"))
      .toBe("4242 4242 4242 4242");
    expect(new MaskUtils({ mask: "(999) 999-9999", maskPlaceholder: "_" }).formatValue("5551234567"))
      .toBe("(555) 123-4567");
  });

  it("formatValue reads a complete national number that starts with the prefix's last digits", () => {
    // kzPhone: "+7 (7" — a 10-digit national number already includes the fixed operator 7
    const kz = new MaskUtils({ mask: "+7 (799) 999-99-99", maskPlaceholder: "_" });
    expect(kz.formatValue("7771234567")).toBe("+7 (777) 123-45-67");
    expect(kz.formatValue("7712345678")).toBe("+7 (771) 234-56-78");
    expect(kz.formatValue("77771234567")).toBe("+7 (777) 123-45-67");
    expect(kz.formatValue("777")).toBe("+7 (777) ___-__-__");
  });
});

describe("MaskUtils partial number without + reads as national", () => {
  const kz = () => new MaskUtils({ mask: "+7 (799) 999-99-99", maskPlaceholder: "_" });
  const uz = () => new MaskUtils({ mask: "+\\9\\98 (99) 999-99-99", maskPlaceholder: "_" });
  const kg = () => new MaskUtils({ mask: ["+", "9", "9", "6", " ", "(", /[2-9]/, /\d/, /\d/, ")", " ", /\d/, /\d/, "-", /\d/, /\d/, "-", /\d/, /\d/], maskPlaceholder: "_" });
  const pasteOverAll = (utils: MaskUtils, text: string) => {
    const empty = utils.formatValue("");
    return utils.processChange(
      { value: text, selection: { start: text.length, end: text.length } },
      { value: empty, selection: { start: 0, end: empty.length, length: empty.length } }
    ).value;
  };

  it.each<[string, () => MaskUtils, string, string]>([
    ["kz 70", kz, "70", "+7 (70_) ___-__-__"],
    ["kz 701", kz, "701", "+7 (701) ___-__-__"],
    ["kz 70112", kz, "70112", "+7 (701) 12_-__-__"],
    ["kz 777", kz, "777", "+7 (777) ___-__-__"],
    ["kz 77012", kz, "77012", "+7 (770) 12_-__-__"],
    ["kz 0555", kz, "0555", "+7 (705) 55_-__-__"],
    ["kz single 7", kz, "7", "+7 (7__) ___-__-__"],
    ["uz 90", uz, "90", "+998 (90) ___-__-__"],
    ["uz 98", uz, "98", "+998 (98) ___-__-__"],
    ["uz 881", uz, "881", "+998 (88) 1__-__-__"],
    ["uz 99890", uz, "99890", "+998 (99) 890-__-__"],
    ["uz single 9", uz, "9", "+998 (__) ___-__-__"],
    ["uz complete with the code", uz, "998901234567", "+998 (90) 123-45-67"],
    ["kg 99655", kg, "99655", "+996 (996) 55-__-__"],
    ["kg 0555", kg, "0555", "+996 (555) __-__-__"]
  ])("%s: paste and formatValue agree", (_name, make, text, expected) => {
    expect(pasteOverAll(make(), text)).toBe(expected);
    expect(make().formatValue(text)).toBe(expected);
  });
});

describe("MaskUtils text that fills no slot from the prefix", () => {
  const uz = () => new MaskUtils({ mask: "+\\9\\98 (99) 999-99-99", maskPlaceholder: "_" });
  const change = (utils: MaskUtils, before: string, start: number, end: number, text: string) =>
    utils.processChange(
      { value: before.slice(0, start) + text + before.slice(end), selection: { start: start + text.length, end: start + text.length } },
      { value: before, selection: { start, end, length: end - start } }
    );

  it("keeps the value when junk replaces a selection that starts in the prefix", () => {
    const utils = new MaskUtils({ mask: "+7 99", maskPlaceholder: "_" });
    const result = change(utils, "+7 1_", 0, 5, "!");
    expect(result.value).toBe("+7 1_");
    expect(result.selection).toEqual({ start: 3, end: 3 });
  });

  it("puts the caret after the prefix once the country code is complete", () => {
    const result = change(uz(), "+998 (__) ___-__-__", 0, 19, "+998");
    expect(result.value).toBe("+998 (__) ___-__-__");
    expect(result.selection).toEqual({ start: 6, end: 6 });
  });

  it("keeps the caret inside the prefix while the country code is being typed", () => {
    const result = change(uz(), "+998 (90) 123-45-67", 0, 19, "+");
    expect(result.value).toBe("+998 (__) ___-__-__");
    expect(result.selection).toEqual({ start: 1, end: 1 });
  });

  it("puts the caret after the prefix when a character of the text is skipped", () => {
    const result = change(uz(), "+998 (__) ___-__-__", 0, 19, "+a");
    expect(result.selection).toEqual({ start: 6, end: 6 });
  });
});
