import { describe, it, expect } from "vitest";
import {
  formatCardExpiry,
  parseCardExpiry,
  parseCardExpiryEdit,
  isCardExpired,
} from "../../src/card/card-expiry";

describe("formatCardExpiry", () => {
  it.each([
    ["1", "1"],
    ["12", "12/"],
    ["1226", "12/26"],
    ["00", "01/"],
    ["13", "12/"],
    ["12/2026", "12/26"],
    ["1/26", "01/26"],
    ["01 / 2026", "01/26"],
    ["122", "12/2"],
    ["12345", "12/34"],
    ["12/2", "12/2"],
    ["", ""],
  ])("%j → %j", (input, expected) => {
    expect(formatCardExpiry(input)).toBe(expected);
  });

  it("uses a custom separator and accepts a number", () => {
    expect(formatCardExpiry("1226", { separator: " / " })).toBe("12 / 26");
    expect(formatCardExpiry(1226)).toBe("12/26");
  });
});

describe("parseCardExpiry", () => {
  it("reports MM/YY with / whatever the separator", () => {
    expect(parseCardExpiry("12 / 26", { separator: " / " })).toEqual({
      value: "12/26",
      formattedValue: "12 / 26",
      month: 12,
      year: 2026,
    });
  });

  it("reports an empty value while the date is partial", () => {
    expect(parseCardExpiry("12/2")).toEqual({
      value: "",
      formattedValue: "12/2",
      month: 12,
      year: undefined,
    });
    expect(parseCardExpiry("1")).toMatchObject({ value: "", month: undefined });
  });
});

describe("parseCardExpiryEdit", () => {
  it("clamps the month only when the keystroke completes it", () => {
    expect(parseCardExpiryEdit("1/96", {}, "12/96", 1)).toMatchObject({
      formattedValue: "19/6",
      value: "",
      month: undefined,
    });
    expect(parseCardExpiryEdit("19", {}, "1", 2)).toMatchObject({ formattedValue: "12/" });
  });

  it("splits fields when the edit is a paste", () => {
    expect(parseCardExpiryEdit("1/2026", {}, "", 0).formattedValue).toBe("01/26");
  });
});

describe("isCardExpired", () => {
  it.each([
    [10, 2026, new Date(2026, 9, 30), false],
    [9, 2026, new Date(2026, 9, 30), true],
    [12, 2026, new Date(2027, 0, 1), true],
    [1, 2027, new Date(2027, 0, 31), false],
  ])("%i/%i at %s → %s", (month, year, now, expired) => {
    expect(isCardExpired(month, year, now)).toBe(expired);
  });

  it("uses the current date by default", () => {
    expect(isCardExpired(1, 2000)).toBe(true);
    expect(isCardExpired(12, 2999)).toBe(false);
  });
});
