import { describe, it, expect } from "vitest";
import { parseNumber, caretAfterReformat, digitsBeforeCaret } from "../../src/number/parse-number";

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
