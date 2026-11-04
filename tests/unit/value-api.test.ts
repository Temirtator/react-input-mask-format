import { describe, it, expect } from "vitest";
import { isMaskComplete } from "../../src/index";
import { kzPhone, iban, detectPhoneCountry } from "../../src/presets";
import { parseDate } from "../../src/date";
import { parseTime } from "../../src/time";
import { parseCardExpiry } from "../../src/card";

describe("complete flags", () => {
  it.each<[string, boolean, string]>([
    ["12.05.2024", true, "2024-05-12"],
    ["31.02.2024", true, ""],
    ["12.05.20", false, ""],
    ["", false, ""]
  ])("date %s", (text, complete, value) => {
    expect(parseDate(text)).toMatchObject({ complete, value });
  });

  it.each<[string, boolean]>([
    ["09:30", true],
    ["09:3", false],
    ["", false]
  ])("time %s", (text, complete) => {
    expect(parseTime(text).complete).toBe(complete);
  });

  it.each<[string, boolean]>([
    ["12/26", true],
    ["12/2", false],
    ["1", false]
  ])("card expiry %s", (text, complete) => {
    expect(parseCardExpiry(text).complete).toBe(complete);
  });
});

describe("isMaskComplete", () => {
  it.each<[string, boolean]>([
    ["+7 (701) 234-56-78", true],
    ["7012345678", true],
    ["+7 (701) 234-56-7_", false],
    ["+7 (7__) ___-__-__", false],
    ["", false]
  ])("kzPhone %s", (value, complete) => {
    expect(isMaskComplete(value, kzPhone)).toBe(complete);
  });

  it("works with a custom placeholder, no placeholder and custom tokens", () => {
    expect(isMaskComplete("12-34", { mask: "99-99", maskPlaceholder: "•" })).toBe(true);
    expect(isMaskComplete("12-3•", { mask: "99-99", maskPlaceholder: "•" })).toBe(false);
    expect(isMaskComplete("12-3", { mask: "99-99", maskPlaceholder: null })).toBe(false);
    expect(isMaskComplete("AF-12", { mask: "##-99", formatChars: { "#": /[A-F]/, "9": /[0-9]/ } })).toBe(true);
    expect(isMaskComplete("KZ86 125K ZT50 0410 0100", iban)).toBe(false);
  });
});

describe("detectPhoneCountry", () => {
  it("returns undefined when nothing matches, like detectCardBrand", () => {
    expect(detectPhoneCountry("12345")).toBeUndefined();
  });
});
