import { describe, it, expect } from "vitest";
import { formatCardNumber, parseCardNumber } from "../../src/card/card-number";
import { CARD_BRANDS } from "../../src/card/brands";
import { withLuhn } from "./card-test-numbers";

describe("formatCardNumber", () => {
  it.each([
    ["4111111111111111", "4111 1111 1111 1111"],
    ["378282246310005", "3782 822463 10005"],
    ["3782822463100051", "3782 822463 10005"],
    ["30569309025904", "3056 930902 5904"],
    ["305693090259041", "3056 9309 0259 041"],
    ["4111111111111111111", "4111 1111 1111 1111 111"],
    ["41111111111111111112", "4111 1111 1111 1111 111"],
    ["4222222222222", "4222 2222 2222 2"],
    ["1234567890123456789012", "1234 5678 9012 3456 789"],
    ["5555555555554444", "5555 5555 5555 4444"],
    ["55555555555544441", "5555 5555 5555 4444"],
    ["4111", "4111"],
    ["41111", "4111 1"],
    ["4111-1111 1111.1111", "4111 1111 1111 1111"],
    ["", ""],
  ])("%j → %j", (input, expected) => {
    expect(formatCardNumber(input)).toBe(expected);
  });

  it("accepts a number and a custom separator", () => {
    expect(formatCardNumber(4111111111111111, { separator: "-" })).toBe("4111-1111-1111-1111");
  });
});

describe("parseCardNumber", () => {
  it("reports a complete Luhn-valid Visa", () => {
    expect(parseCardNumber("4111 1111 1111 1111")).toEqual({
      value: "4111111111111111",
      formattedValue: "4111 1111 1111 1111",
      brand: "visa",
      complete: true,
      valid: true,
    });
  });

  it("reports an invalid checksum", () => {
    expect(parseCardNumber("4111 1111 1111 1112")).toMatchObject({ complete: true, valid: false });
  });

  it("is not complete at a length the brand does not issue", () => {
    expect(parseCardNumber("411111111111111")).toMatchObject({
      brand: "visa",
      complete: false,
      valid: false,
    });
  });

  it("skips Luhn for UnionPay", () => {
    const valid = withLuhn("620000000000000");
    const broken = valid.slice(0, -1) + String((Number(valid.at(-1)) + 1) % 10);
    expect(parseCardNumber(broken)).toMatchObject({
      brand: "unionpay",
      complete: true,
      valid: true,
    });
  });

  it("is neither complete nor valid for an unknown prefix", () => {
    expect(parseCardNumber(withLuhn("123456789012345"))).toMatchObject({
      brand: undefined,
      complete: false,
      valid: false,
    });
  });

  it("parses with a custom separator", () => {
    expect(parseCardNumber("4111-1111", { separator: "-" })).toMatchObject({
      value: "41111111",
      formattedValue: "4111-1111",
    });
  });

  const ends = CARD_BRANDS.flatMap((info) =>
    [Math.min(...info.lengths), Math.max(...info.lengths)].map((length) => ({
      brand: info.brand,
      length,
      number: withLuhn(info.ranges[0][0].padEnd(length - 1, "0")),
    }))
  );

  it.each(ends)("$brand at $length digits is complete and valid", ({ brand, length, number }) => {
    const values = parseCardNumber(number);
    expect(values.brand).toBe(brand);
    expect(values.value).toHaveLength(length);
    expect(values.complete).toBe(true);
    expect(values.valid).toBe(true);
  });
});
