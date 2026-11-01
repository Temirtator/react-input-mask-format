import { describe, it, expect } from "vitest";
import { formatCardCvc, parseCardCvc } from "../../src/card/card-cvc";

describe("formatCardCvc", () => {
  it.each([
    ["12345", undefined, "123"],
    ["12345", "amex", "1234"],
    ["12345", "visa", "123"],
    ["12345", "mir", "123"],
    ["1a2", undefined, "12"],
    ["", undefined, ""],
  ] as const)("%j with %s → %j", (input, brand, expected) => {
    expect(formatCardCvc(input, { brand })).toBe(expected);
  });

  it("accepts a number and no options", () => {
    expect(formatCardCvc(1234)).toBe("123");
  });
});

describe("parseCardCvc", () => {
  it("is complete only at the brand's length", () => {
    expect(parseCardCvc("12")).toEqual({ value: "12", formattedValue: "12", complete: false });
    expect(parseCardCvc("123")).toEqual({ value: "123", formattedValue: "123", complete: true });
    expect(parseCardCvc("123", { brand: "amex" })).toMatchObject({ complete: false });
    expect(parseCardCvc("1234", { brand: "amex" })).toMatchObject({ complete: true });
  });
});
