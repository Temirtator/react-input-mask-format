import { describe, it, expect } from "vitest";
import { detectPhoneCountry, phonePresets, kzPhone, ruPhone, uzPhone, tmPhone } from "../../src/presets";

describe("detectPhoneCountry", () => {
  it.each([
    ["+7 701 234 56 78", "KZ"],
    ["+7 (777) 123-45-67", "KZ"],
    ["+7 612 345 67 89", "KZ"],
    ["+7 912 345-67-89", "RU"],
    ["+74951234567", "RU"],
    ["+998 90 123 45 67", "UZ"],
    ["+996 555 12 34 56", "KG"],
    ["+375 29 123-45-67", "BY"],
    ["+992 93 123 4567", "TJ"],
    ["+374 91 123456", "AM"],
    ["+994 50 123 45 67", "AZ"],
    ["+995 555 12 34 56", "GE"],
    ["+373 69 123 456", "MD"],
    ["+380 67 123 45 67", "UA"],
    ["+993 65 123456", "TM"],
    ["00998901234567", "UZ"],
    ["+76", "KZ"],
    ["+77", "KZ"],
    ["+79", "RU"],
    ["  +380671234567", "UA"]
  ])("%s → %s", (value, country) => {
    expect(detectPhoneCountry(value)).toBe(country);
  });

  it.each([
    "+7",
    "+99",
    "+998",
    "+1 202 555 0143",
    "+49 30 123456",
    "87012345678",
    "77012345678",
    "998901234567",
    "",
    "phone: +77012345678"
  ])("does not guess from %s", value => {
    expect(detectPhoneCountry(value)).toBeNull();
  });

  it.each([null, undefined])("handles %s", value => {
    expect(detectPhoneCountry(value as unknown as string)).toBeNull();
  });
});

describe("phonePresets", () => {
  it("maps ISO codes to the phone presets", () => {
    expect(phonePresets.KZ).toBe(kzPhone);
    expect(phonePresets.RU).toBe(ruPhone);
    expect(phonePresets.UZ).toBe(uzPhone);
    expect(phonePresets.TM).toBe(tmPhone);
    expect(Object.keys(phonePresets)).toHaveLength(12);
  });
});
