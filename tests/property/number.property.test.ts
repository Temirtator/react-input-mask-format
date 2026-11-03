import { describe, it, expect } from "vitest";
import { fc, holds } from "./arbitraries";
import { formatNumber } from "../../src/number/format-number";
import { digitsBeforeCaret, parseNumber, resolveCaret } from "../../src/number/parse-number";
import type { NumberFormatOptions } from "../../src/number/types";

const THOUSANDS = [",", " ", "'", ".", " ", ""];
const PREFIXES = ["$", "$ ", "€ ", "USD "];
const SUFFIXES = ["%", " %", " ₽", " kg"];
const NOISE = ["-", ".", ",", " ", "'", " ", "$", "%", "e", "+", "k"];

function thousandOf(o: NumberFormatOptions): string {
  return o.thousandSeparator === true ? "," : typeof o.thousandSeparator === "string" ? o.thousandSeparator : "";
}

function decimalOf(o: NumberFormatOptions): string {
  return o.decimalSeparator ?? ".";
}

function named<T extends object>(value: T): T {
  return Object.assign(value, { [fc.toStringMethod]: () => JSON.stringify(value) });
}

const options: fc.Arbitrary<NumberFormatOptions> = fc
  .record(
    {
      thousandSeparator: fc.oneof(fc.boolean(), fc.constantFrom(...THOUSANDS)),
      decimalSeparator: fc.constantFrom(".", ","),
      decimalScale: fc.integer({ min: 0, max: 4 }),
      fixedDecimalScale: fc.boolean(),
      prefix: fc.constantFrom(...PREFIXES),
      suffix: fc.constantFrom(...SUFFIXES),
      allowNegative: fc.boolean(),
      allowLeadingZeros: fc.boolean()
    },
    { requiredKeys: [] }
  )
  .filter(o => thousandOf(o) !== decimalOf(o))
  .map(named);

const digitUnit = fc.constantFrom(..."0123456789".split(""));

function textFor(o: NumberFormatOptions): fc.Arbitrary<string> {
  const raw = fc.string({
    unit: fc.oneof({ weight: 5, arbitrary: digitUnit }, { weight: 2, arbitrary: fc.constantFrom(...NOISE) }),
    maxLength: 20
  });
  return fc.oneof(raw, raw.map(text => `${o.prefix ?? ""}${text}${o.suffix ?? ""}`));
}

const withText = options.chain(o => fc.tuple(fc.constant(o), textFor(o)));

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shapeOf(o: NumberFormatOptions): RegExp {
  const prefix = escape(o.prefix ?? "");
  const suffix = escape(o.suffix ?? "");
  const thousand = escape(thousandOf(o));
  const decimal = escape(decimalOf(o));
  const lead = o.allowLeadingZeros ? "\\d" : "[1-9]";
  const int = thousand ? `(?:0|${lead}\\d{0,2}(?:${thousand}\\d{3})*)` : `(?:0|${lead}\\d*)`;
  const scale = o.decimalScale;
  const frac =
    scale === undefined
      ? `(?:${decimal}\\d*)?`
      : o.fixedDecimalScale && scale > 0
        ? `${decimal}\\d{${scale}}`
        : `(?:${decimal}\\d{0,${scale}})?`;
  const sign = o.allowNegative === false ? "" : "-?";
  const lone = o.allowNegative === false ? "" : `|${prefix}-${suffix}`;
  return new RegExp(`^(?:${prefix}${sign}${int}${frac}${suffix}${lone})?$`);
}

function padFraction(value: string, scale: number): string {
  if (!/\d/.test(value)) {
    return value;
  }
  const [int, frac = ""] = value.split(".");
  return `${int}.${frac.padEnd(scale, "0")}`;
}

function digitsOf(text: string): string {
  return text.replace(/\D/g, "");
}

const plainNumber = fc
  .oneof(
    fc.integer(),
    fc
      .tuple(fc.boolean(), fc.nat({ max: 1e12 }), fc.stringMatching(/^\d{0,6}$/))
      .map(([negative, int, frac]) => Number(`${negative ? "-" : ""}${int}.${frac}0`)),
    fc.double({ min: 1e6, max: 1e20, noNaN: true })
  )
  .filter(n => !/e/.test(String(n)));
const anyNumber = fc.double({ noNaN: true, noDefaultInfinity: true });

describe("formatNumber", () => {
  it("N1 is idempotent", () => {
    holds(
      fc.property(withText, ([o, text]) => {
        const once = formatNumber(text, o);
        expect(formatNumber(once, o)).toBe(once);
      })
    );
  });

  it("N2 returns digits, the configured separators, the sign and the affixes in their places", () => {
    holds(
      fc.property(withText, ([o, text]) => {
        expect(formatNumber(text, o)).toMatch(shapeOf(o));
      })
    );
    holds(
      fc.property(options, anyNumber, (o, n) => {
        expect(formatNumber(n, o)).toMatch(shapeOf(o));
      })
    );
  });

  it("N3 shows a minus exactly when the text has one and negatives are allowed", () => {
    holds(
      fc.property(withText, ([o, text]) => {
        expect(formatNumber(text, o).includes("-")).toBe(o.allowNegative !== false && text.includes("-"));
      })
    );
  });

  it("N4 decimalScale truncates the fraction and never rounds", () => {
    holds(
      fc.property(withText, ([o, text]) => {
        const truncated = { ...o, fixedDecimalScale: false };
        const unscaled = parseNumber(text, { ...truncated, decimalScale: undefined }).value;
        expect(unscaled.startsWith(parseNumber(text, truncated).value)).toBe(true);
      })
    );
    holds(
      fc.property(options, plainNumber, (o, n) => {
        const truncated = { ...o, fixedDecimalScale: false, allowNegative: true };
        const scaled = parseNumber(formatNumber(n, truncated), truncated).value;
        expect(String(n === 0 ? 0 : n).startsWith(scaled.replace(/\.$/, ""))).toBe(true);
      })
    );
  });

  it("N5 keeps every digit in order when leading zeros are allowed and the scale is free", () => {
    holds(
      fc.property(withText, ([o, text]) => {
        const free = { ...o, allowLeadingZeros: true, decimalScale: undefined };
        const kept = digitsOf(parseNumber(text, free).value);
        expect([digitsOf(text), `0${digitsOf(text)}`]).toContain(kept);
      })
    );
  });

  it("N6 a JS number keeps its value, below 1e-6 to 20 decimal places", () => {
    holds(
      fc.property(options, plainNumber, (o, n) => {
        const free = { ...o, decimalScale: undefined };
        const expected = o.allowNegative === false ? Math.abs(n) : n === 0 ? 0 : n;
        const values = parseNumber(formatNumber(n, free), free);
        expect(values.value).toBe(String(expected));
        expect(values.floatValue).toBe(expected);
      })
    );
    holds(
      fc.property(anyNumber, n => {
        const floatValue = parseNumber(formatNumber(n, {}), {}).floatValue as number;
        if (Math.abs(n) >= 1e-6) {
          expect(floatValue).toBe(n === 0 ? 0 : n);
        } else {
          expect(Math.abs(floatValue - n)).toBeLessThanOrEqual(1e-20);
        }
      })
    );
  });
});

describe("parseNumber", () => {
  it("N7 is the inverse of formatNumber", () => {
    holds(
      fc.property(withText, ([o, text]) => {
        const formatted = formatNumber(text, o);
        const direct = parseNumber(text, o);
        const again = parseNumber(formatted, o);
        expect(direct.formattedValue).toBe(formatted);
        expect(again.formattedValue).toBe(formatted);
        if (direct.floatValue === undefined) {
          expect([undefined, 0]).toContain(again.floatValue);
        } else {
          expect(again.floatValue).toBe(direct.floatValue);
        }
        const scale = o.decimalScale ?? 0;
        expect(again.value).toBe(o.fixedDecimalScale && scale > 0 ? padFraction(direct.value, scale) : direct.value);
      })
    );
  });

  it("N8 value is a plain number with a dot and floatValue is its parseFloat once a digit is entered", () => {
    holds(
      fc.property(withText, ([o, text]) => {
        const { value, floatValue } = parseNumber(text, o);
        expect(value).toMatch(/^-?(?:\d+(?:\.\d*)?)?$/);
        if (!/\d/.test(text)) {
          expect(floatValue).toBeUndefined();
        }
        if (floatValue !== undefined || /[1-9]/.test(value)) {
          expect(floatValue).toBe(parseFloat(value));
        }
        if (o.allowNegative === false) {
          expect(value.includes("-")).toBe(false);
        }
      })
    );
  });

  it("N9 thousand separator, prefix and suffix do not change the value", () => {
    holds(
      fc.property(
        withText,
        fc.oneof(fc.boolean(), fc.constantFrom(...THOUSANDS)),
        fc.constantFrom(...PREFIXES),
        fc.constantFrom(...SUFFIXES),
        ([o, text], thousandSeparator, prefix, suffix) => {
          const other = { ...o, thousandSeparator, prefix, suffix };
          fc.pre(thousandOf(other) !== decimalOf(other));
          fc.pre(decimalOf(o) === "." || !text.includes("."));
          const value = parseNumber(formatNumber(text, o), o).value;
          expect(parseNumber(formatNumber(text, other), other).value).toBe(value);
        }
      )
    );
  });

  it("N10 the decimal separator does not change the value of a JS number", () => {
    holds(
      fc.property(options, anyNumber, (o, n) => {
        const dot = { ...o, decimalSeparator: ".", thousandSeparator: " " };
        const comma = { ...o, decimalSeparator: ",", thousandSeparator: " " };
        expect(parseNumber(formatNumber(n, comma), comma).value).toBe(parseNumber(formatNumber(n, dot), dot).value);
      })
    );
  });

  it("N11 resolveCaret keeps the digits left of the caret and steps past a just-typed trailing decimal separator", () => {
    holds(
      fc.property(withText, fc.nat({ max: 25 }), ([o, text], n) => {
        const values = parseNumber(text, o);
        const shown = values.formattedValue;
        const caret = resolveCaret(values, n, o);
        expect(digitsBeforeCaret(shown, caret)).toBe(Math.min(n, digitsOf(shown).length));
        if (values.value.endsWith(".") && n > 0 && n === digitsOf(values.value).length) {
          expect(shown.slice(0, caret).endsWith(decimalOf(o))).toBe(true);
        }
      })
    );
  });
});
