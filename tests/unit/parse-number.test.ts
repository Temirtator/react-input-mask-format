import { describe, it, expect } from "vitest";
import { parseNumber, caretAfterReformat, digitsBeforeCaret, resolveCaret, readTyped } from "../../src/number/parse-number";

describe("parseNumber", () => {
  it("returns value/formattedValue/floatValue", () => {
    const r = parseNumber("$ 1,234.56", { prefix: "$ ", thousandSeparator: ",", decimalScale: 2 });
    expect(r.value).toBe("1234.56");
    expect(r.formattedValue).toBe("$ 1,234.56");
    expect(r.floatValue).toBe(1234.56);
  });

  it("parses European format", () => {
    const r = parseNumber("1 234,5", { thousandSeparator: " ", decimalSeparator: "," });
    expect(r.value).toBe("1234.5");
    expect(r.floatValue).toBe(1234.5);
  });

  it("handles negative and empty", () => {
    expect(parseNumber("-8", { allowNegative: true }).floatValue).toBe(-8);
    const empty = parseNumber("", {});
    expect(empty.value).toBe("");
    expect(empty.floatValue).toBeUndefined();
    const lone = parseNumber("-", { allowNegative: true });
    expect(lone.value).toBe("-");
    expect(lone.floatValue).toBeUndefined();
  });

  it("keeps a trailing decimal separator while typing", () => {
    const r = parseNumber("1.", { decimalSeparator: "." });
    expect(r.value).toBe("1.");
    expect(r.floatValue).toBe(1);
    expect(r.formattedValue).toBe("1.");
  });

  it("returns undefined floatValue when no digits are entered", () => {
    expect(parseNumber(".", { decimalSeparator: "." }).floatValue).toBeUndefined();
    expect(parseNumber("-.", { decimalSeparator: ".", allowNegative: true }).floatValue).toBeUndefined();
    expect(parseNumber(",", { decimalSeparator: "," }).floatValue).toBeUndefined();
    expect(parseNumber("1.", { decimalSeparator: "." }).floatValue).toBe(1); // trailing sep, one digit → still defined
  });
});

describe("caret helpers", () => {
  it("counts digits before the caret", () => {
    expect(digitsBeforeCaret("1,234", 3)).toBe(2); // "1,2" → two digits
    expect(digitsBeforeCaret("$ 12", 4)).toBe(2);
  });

  it("places the caret after N digits in the reformatted string", () => {
    // "1234" typed → "1,234"; caret was after 4 digits → end (index 5)
    expect(caretAfterReformat("1,234", 4)).toBe(5);
    // caret after 2 digits in "1,234" → index 3 (after "1,2")
    expect(caretAfterReformat("1,234", 2)).toBe(3);
  });
});

describe("resolveCaret", () => {
  it("steps past a just-typed trailing decimal separator", () => {
    const opts = { thousandSeparator: "," as const, decimalScale: 2 };
    const values = parseNumber("1,234.", opts);
    expect(resolveCaret(values, 4, opts)).toBe(6); // caret lands AFTER the "."
  });
  it("keeps the caret before a decimal separator that has fraction digits", () => {
    const opts = { thousandSeparator: "," as const };
    const values = parseNumber("1,234.5", opts);
    expect(resolveCaret(values, 4, opts)).toBe(5); // still editing the integer part
  });
  it("steps past the separator the user just typed in front of a fixed fraction", () => {
    const opts = { thousandSeparator: "," as const, decimalScale: 2, fixedDecimalScale: true };
    expect(resolveCaret(parseNumber("1,234..00", opts), 4, opts, true)).toBe(6);
    const comma = { thousandSeparator: " ", decimalSeparator: ",", decimalScale: 2, fixedDecimalScale: true };
    expect(resolveCaret(parseNumber("1 234,,00", comma), 4, comma, true)).toBe(6);
  });
  it("steps past the fixed separator when another allowed separator is typed", () => {
    const comma = { thousandSeparator: " ", decimalSeparator: ",", decimalScale: 2, fixedDecimalScale: true };
    expect(resolveCaret(parseNumber("1 234.,00", comma), 4, comma, true)).toBe(6);
    expect(readTyped("1 234.,00", 6, comma, true).separator).toBe(true);
  });
  it("steps past a separator typed into the integer part", () => {
    const opts = { decimalSeparator: "," };
    expect(resolveCaret(parseNumber("12,34", opts), 2, opts, true)).toBe(3);
  });
  it("puts the caret after the separator typed into an empty field", () => {
    const opts = { decimalScale: 2, fixedDecimalScale: true, prefix: "$ " };
    expect(resolveCaret(parseNumber(".", opts), 0, opts, true)).toBe(4);
    expect(resolveCaret(parseNumber(".", {}), 0, {}, true)).toBe(2);
  });
  it("does not step over the separator after a deletion", () => {
    const opts = { thousandSeparator: "," as const, decimalScale: 2, fixedDecimalScale: true };
    expect(resolveCaret(parseNumber("1,234.0", opts), 4, opts, false)).toBe(5);
  });
  it("keeps the caret in front of the separator when a digit was typed", () => {
    const opts = { thousandSeparator: "," as const, decimalScale: 2, fixedDecimalScale: true };
    expect(resolveCaret(parseNumber("1,2345.00", opts), 5, opts, false)).toBe(6);
  });
});

describe("readTyped", () => {
  it("flags a separator only when it was inserted", () => {
    expect(readTyped("1,234..00", 6, {}, true).separator).toBe(true);
    expect(readTyped("1,234.0", 6, {}, false).separator).toBe(false);
    expect(readTyped("1,2345", 5, {}, true).separator).toBe(false);
  });
  it("drops a typed separator when decimalScale is 0", () => {
    expect(readTyped("1.,234", 2, { decimalScale: 0 }, true)).toEqual({ raw: "1,234", caret: 1, separator: false });
    expect(readTyped("1.5", 3, { decimalScale: 0 }, false)).toEqual({ raw: "1.5", caret: 3, separator: false });
  });
});
