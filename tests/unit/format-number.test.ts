import { describe, it, expect } from "vitest";
import { formatNumber } from "../../src/number/format-number";

describe("formatNumber", () => {
  it("groups thousands and keeps decimals", () => {
    expect(formatNumber("1234.56", { thousandSeparator: ",", decimalScale: 2 })).toBe("1,234.56");
    expect(formatNumber("1234567", { thousandSeparator: "," })).toBe("1,234,567");
  });

  it("supports European separators", () => {
    // input string is in the option's own format (comma decimal)
    expect(
      formatNumber("1234,5", { thousandSeparator: " ", decimalSeparator: ",", decimalScale: 2, fixedDecimalScale: true })
    ).toBe("1 234,50");
    // a JS number is always canonical (dot) regardless of the display separator
    expect(
      formatNumber(1234.5, { thousandSeparator: " ", decimalSeparator: ",", decimalScale: 2, fixedDecimalScale: true })
    ).toBe("1 234,50");
  });

  it("truncates to decimalScale (no rounding)", () => {
    expect(formatNumber("1234.567", { decimalScale: 2 })).toBe("1234.56");
  });

  it("drops the decimal separator when decimalScale is 0", () => {
    expect(formatNumber("12.", { decimalScale: 0 })).toBe("12");
    expect(formatNumber("1.5", { decimalScale: 0 })).toBe("1");
    expect(formatNumber("1,234.56", { thousandSeparator: ",", decimalScale: 0 })).toBe("1,234");
    expect(formatNumber("12,", { thousandSeparator: " ", decimalSeparator: ",", decimalScale: 0 })).toBe("12");
    expect(formatNumber(".", { decimalScale: 0 })).toBe("");
    expect(formatNumber(1234.9, { decimalScale: 0, fixedDecimalScale: true })).toBe("1234");
  });

  it("reads a typed or pasted dot as the decimal separator of a comma format", () => {
    const ru = { thousandSeparator: " ", decimalSeparator: ",", decimalScale: 2 };
    expect(formatNumber("12.5", ru)).toBe("12,5");
    expect(formatNumber("1.234,56", ru)).toBe("1 234,56");
    expect(formatNumber("1.234.567", ru)).toBe("1 234 567");
    expect(formatNumber("12.5", { thousandSeparator: ".", decimalSeparator: ",", decimalScale: 2 })).toBe("125");
    expect(formatNumber("12.5", { ...ru, allowedDecimalSeparators: [] })).toBe("125");
    expect(formatNumber("12/5", { ...ru, allowedDecimalSeparators: ["/"] })).toBe("12,5");
  });

  it("does not read a dot of the suffix or prefix as the decimal separator", () => {
    const rub = { thousandSeparator: " ", decimalSeparator: ",", suffix: " руб." };
    expect(formatNumber("12 руб.3", rub)).toBe("123 руб.");
    expect(formatNumber("12 руб.3", { ...rub, decimalScale: 0 })).toBe("123 руб.");
    expect(formatNumber("12,5 руб.", rub)).toBe("12,5 руб.");
    expect(formatNumber("12.5 руб.", rub)).toBe("12,5 руб.");
    expect(formatNumber("5р. 12", { decimalSeparator: ",", prefix: "р. " })).toBe("р. 512");
  });

  it("pads with fixedDecimalScale", () => {
    expect(formatNumber("5", { decimalScale: 2, fixedDecimalScale: true })).toBe("5.00");
    expect(formatNumber("1234.5", { thousandSeparator: ",", decimalScale: 2, fixedDecimalScale: true })).toBe("1,234.50");
  });

  it("applies prefix and suffix", () => {
    expect(formatNumber("1234.5", { prefix: "$ ", thousandSeparator: ",", decimalScale: 2, fixedDecimalScale: true })).toBe("$ 1,234.50");
    expect(formatNumber("50", { suffix: " %" })).toBe("50 %");
  });

  it("honors allowNegative", () => {
    expect(formatNumber("-1234", { allowNegative: true, thousandSeparator: "," })).toBe("-1,234");
    expect(formatNumber("-1234", { allowNegative: false, thousandSeparator: "," })).toBe("1,234");
  });

  it("handles leading zeros", () => {
    expect(formatNumber("007", {})).toBe("7");
    expect(formatNumber("007", { allowLeadingZeros: true })).toBe("007");
  });

  it("keeps partial input while typing", () => {
    expect(formatNumber("1.", { decimalSeparator: "." })).toBe("1.");
    expect(formatNumber(".5", { decimalSeparator: "." })).toBe("0.5");
    expect(formatNumber("-", { allowNegative: true })).toBe("-");
    expect(formatNumber("", {})).toBe("");
  });

  it("accepts a numeric input", () => {
    expect(formatNumber(1234.5, { thousandSeparator: ",", decimalScale: 2, fixedDecimalScale: true })).toBe("1,234.50");
    expect(formatNumber(-8, { allowNegative: false })).toBe("8");
  });

  it("expands exponential notation instead of corrupting it", () => {
    // String(1e21)="1e+21", String(1e-7)="1e-7" must NOT be read as digits / negative sign
    expect(formatNumber(1e21, {})).toBe("1000000000000000000000");
    const tiny = formatNumber(1e-7, { decimalScale: 2 });
    expect(tiny).not.toContain("e");
    expect(tiny).not.toContain("-");
    expect(tiny).toBe("0.00");
  });
});
