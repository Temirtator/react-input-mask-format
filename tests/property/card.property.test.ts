import { describe, it, expect } from "vitest";
import { fc, holds } from "./arbitraries";
import { detectCardBrand } from "../../src/card/brands";
import { formatCardNumber, parseCardNumber } from "../../src/card/card-number";
import { formatCardExpiry, parseCardExpiry, parseCardExpiryEdit, isCardExpired } from "../../src/card/card-expiry";
import { formatCardCvc, parseCardCvc } from "../../src/card/card-cvc";
import type { CardBrand } from "../../src/card/types";
import type { CardNumberValues } from "../../src/card/card-number";
import type { CardExpiryOptions, CardExpiryValues } from "../../src/card/card-expiry";
import { withLuhn } from "../unit/card-test-numbers";

interface BrandRow {
  brand: CardBrand;
  ranges: [string, string][];
  lengths: number[];
  cvc: number;
}

const UP_TO_19 = [16, 17, 18, 19];

const TABLE: BrandRow[] = [
  { brand: "visa", ranges: [["4", "4"]], lengths: [13, 16, 19], cvc: 3 },
  { brand: "mastercard", ranges: [["51", "55"], ["2221", "2720"]], lengths: [16], cvc: 3 },
  { brand: "amex", ranges: [["34", "34"], ["37", "37"]], lengths: [15], cvc: 4 },
  { brand: "diners", ranges: [["300", "305"], ["36", "36"], ["38", "39"]], lengths: [14, 15, ...UP_TO_19], cvc: 3 },
  { brand: "discover", ranges: [["6011", "6011"], ["644", "659"]], lengths: UP_TO_19, cvc: 3 },
  { brand: "unionpay", ranges: [["62", "62"], ["81", "81"]], lengths: UP_TO_19, cvc: 3 },
  { brand: "jcb", ranges: [["3528", "3589"]], lengths: UP_TO_19, cvc: 3 },
  {
    brand: "maestro",
    ranges: [["50", "50"], ["5600", "5613"], ["5615", "5899"], ["63", "63"], ["67", "67"]],
    lengths: [12, 13, 14, 15, ...UP_TO_19],
    cvc: 3
  },
  { brand: "mir", ranges: [["2200", "2204"]], lengths: UP_TO_19, cvc: 3 },
  { brand: "uzcard", ranges: [["8600", "8600"], ["5614", "5614"]], lengths: [16], cvc: 3 },
  { brand: "humo", ranges: [["9860", "9860"]], lengths: [16], cvc: 3 },
  { brand: "belkart", ranges: [["9112", "9112"]], lengths: [16], cvc: 3 },
  { brand: "elcart", ranges: [["9417", "9417"]], lengths: [16], cvc: 3 }
];

const NUMBER_SEPARATORS = [" ", "-", " - ", ""];
const EXPIRY_SEPARATORS = ["/", " / ", "-", "."];
const JUNK = [" ", "-", ".", "/", "a"];

function fits(digits: string, [lo, hi]: [string, string]): boolean {
  for (let n = Number(lo); n <= Number(hi); n++) {
    const start = String(n).padStart(lo.length, "0");
    if (start.startsWith(digits) || digits.startsWith(start)) {
      return true;
    }
  }
  return false;
}

function rowOf(digits: string): BrandRow | undefined {
  const rows = TABLE.filter(row => row.ranges.some(range => fits(digits, range)));
  return rows.length === 1 ? rows[0] : undefined;
}

function groupsOf(value: string, row: BrandRow | undefined): string[] {
  const sizes =
    row?.brand === "amex" ? [4, 6, 5] : row?.brand === "diners" && value.length <= 14 ? [4, 6, 4] : [4, 4, 4, 4, 3];
  const groups: string[] = [];
  let start = 0;
  for (const size of sizes) {
    groups.push(value.slice(start, start + size));
    start += size;
  }
  return groups.filter(Boolean);
}

function passesLuhn(digits: string): boolean {
  return digits.length > 0 && withLuhn(digits.slice(0, -1)) === digits;
}

function reported({ value, brand, complete, valid }: CardNumberValues): Omit<CardNumberValues, "formattedValue"> {
  return { value, brand, complete, valid };
}

function digitsOf(text: string | number): string {
  return String(text).replace(/\D/g, "");
}

function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

const digitUnit = fc.constantFrom(..."0123456789".split(""));
const tail = (maxLength: number) => fc.string({ unit: digitUnit, maxLength });

const row = fc.constantFrom(...TABLE);
const startOf = (r: BrandRow) =>
  fc
    .constantFrom(...r.ranges)
    .chain(([lo, hi]) => fc.integer({ min: Number(lo), max: Number(hi) }).map(n => String(n).padStart(lo.length, "0")));

const cardDigits: fc.Arbitrary<string> = fc.oneof(
  tail(22),
  row.chain(startOf).chain(start => tail(20).map(rest => start + rest)),
  fc.constantFrom("", "2", "22", "220", "222", "3", "35", "5", "56", "6", "8", "9")
);

const cardText: fc.Arbitrary<string> = fc
  .tuple(cardDigits, fc.array(fc.tuple(fc.nat(), fc.constantFrom(...JUNK)), { maxLength: 6 }))
  .map(([digits, junk]) =>
    junk.reduce((text, [at, char]) => {
      const i = at % (text.length + 1);
      return text.slice(0, i) + char + text.slice(i);
    }, digits)
  );

const numberSeparator = fc.constantFrom(...NUMBER_SEPARATORS);

const issued = row.chain(r =>
  fc
    .tuple(startOf(r), fc.constantFrom(...r.lengths), tail(19))
    .map(([start, length, rest]) => ({ row: r, number: withLuhn((start + rest).padEnd(length - 1, "0").slice(0, length - 1)) }))
);

describe("card number", () => {
  it("C1 formatCardNumber is idempotent", () => {
    holds(
      fc.property(cardText, numberSeparator, (text, separator) => {
        const once = formatCardNumber(text, { separator });
        expect(formatCardNumber(once, { separator })).toBe(once);
      })
    );
  });

  it("C2 value is the digits in order, cut at the brand's longest length or 19", () => {
    holds(
      fc.property(fc.oneof(cardText, fc.maxSafeNat()), numberSeparator, (input, separator) => {
        const digits = digitsOf(input);
        const brandRow = rowOf(digits);
        const { value, formattedValue } = parseCardNumber(String(input), { separator });
        expect(value).toBe(digits.slice(0, brandRow ? Math.max(...brandRow.lengths) : 19));
        expect(digitsOf(formattedValue)).toBe(value);
        expect(formatCardNumber(input, { separator })).toBe(formattedValue);
      })
    );
  });

  it("C3 groups the digits as the brand table says", () => {
    holds(
      fc.property(cardText, numberSeparator, (text, separator) => {
        const { value, formattedValue } = parseCardNumber(text, { separator });
        expect(formattedValue).toBe(groupsOf(value, rowOf(value)).join(separator));
      })
    );
  });

  it("C4 the brand is set once the digits fit only one brand of the table", () => {
    holds(
      fc.property(cardText, text => {
        const brand = rowOf(digitsOf(text))?.brand;
        expect(detectCardBrand(text)).toBe(brand);
        expect(parseCardNumber(text).brand).toBe(brand);
      })
    );
  });

  it("C5 separators in the text and the separator option do not change value, brand, complete or valid", () => {
    holds(
      fc.property(cardText, numberSeparator, numberSeparator, (text, a, b) => {
        const digitsOnly = reported(parseCardNumber(digitsOf(text), { separator: b }));
        expect(reported(parseCardNumber(text, { separator: a }))).toEqual(digitsOnly);
      })
    );
  });

  it("C6 complete means a known brand at one of its lengths, valid means complete and Luhn except UnionPay", () => {
    holds(
      fc.property(fc.oneof(cardText, issued.map(({ number }) => number)), text => {
        const { value, brand, complete, valid } = parseCardNumber(text);
        const brandRow = rowOf(value);
        expect(complete).toBe(brandRow !== undefined && brandRow.lengths.includes(value.length));
        expect(valid).toBe(complete && (brand === "unionpay" || passesLuhn(value)));
      })
    );
  });

  it("C7 every issued length of every range with a Luhn check digit is complete and valid, a wrong check digit is not", () => {
    holds(
      fc.property(issued, fc.integer({ min: 1, max: 9 }), ({ row: r, number }, shift) => {
        expect(parseCardNumber(number)).toMatchObject({ value: number, brand: r.brand, complete: true, valid: true });
        const wrong = number.slice(0, -1) + String((Number(number[number.length - 1]) + shift) % 10);
        expect(parseCardNumber(wrong)).toMatchObject({ brand: r.brand, complete: true, valid: r.brand === "unionpay" });
      })
    );
  });
});

const expirySeparator = fc.constantFrom(...EXPIRY_SEPARATORS);
const expiryOptions: fc.Arbitrary<CardExpiryOptions | undefined> = fc.option(
  fc.record({ separator: expirySeparator }, { requiredKeys: [] }),
  { nil: undefined }
);
const expiryText: fc.Arbitrary<string | number> = fc.oneof(
  fc.string({
    unit: fc.oneof({ weight: 5, arbitrary: digitUnit }, { weight: 1, arbitrary: fc.constantFrom("/", " ", "-", ".") }),
    maxLength: 8
  }),
  fc
    .tuple(fc.string({ unit: digitUnit, minLength: 1, maxLength: 3 }), fc.constantFrom("/", " / ", "-"), tail(5))
    .map(parts => parts.join("")),
  fc.nat({ max: 999999 })
);

function typeExpiry(o: CardExpiryOptions, digits: string): CardExpiryValues[] {
  const steps: CardExpiryValues[] = [];
  let previous = "";
  for (const digit of digits) {
    const raw = previous + digit;
    const values = parseCardExpiryEdit(raw, o, previous, digitsOf(raw).length);
    steps.push(values);
    previous = values.formattedValue;
  }
  return steps;
}

describe("card expiry", () => {
  it("C8 formatCardExpiry is idempotent", () => {
    holds(
      fc.property(expiryOptions, expiryText, (o, input) => {
        const once = formatCardExpiry(input, o);
        expect(formatCardExpiry(once, o)).toBe(once);
      })
    );
  });

  it("C9 shows the month, clamped to 01-12 once complete, then the separator and up to two year digits", () => {
    holds(
      fc.property(expiryOptions, expiryText, (o, input) => {
        const sep = escape(o?.separator ?? "/");
        expect(formatCardExpiry(input, o)).toMatch(new RegExp(`^(?:\\d|(?:0[1-9]|1[0-2])${sep}\\d{0,2})?$`));
      })
    );
  });

  it("C10 value is MM/YY with '/' once month and year are complete, year is 2000 + YY", () => {
    holds(
      fc.property(expiryOptions, expiryText, (o, input) => {
        const values = parseCardExpiry(String(input), o);
        const digits = digitsOf(values.formattedValue);
        const [mm, yy] = [digits.slice(0, 2), digits.slice(2)];
        expect(values.formattedValue).toBe(formatCardExpiry(input, o));
        expect(values.month).toBe(mm.length === 2 ? Number(mm) : undefined);
        expect(values.year).toBe(yy.length === 2 ? 2000 + Number(yy) : undefined);
        expect(values.value).toBe(digits.length === 4 ? `${mm}/${yy}` : "");
        expect(parseCardExpiry(values.formattedValue, o)).toEqual(values);
      })
    );
  });

  it("C11 a pasted M/YYYY, MM/YY or M/YY lands in the right fields", () => {
    holds(
      fc.property(
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 2000, max: 2099 }),
        fc.boolean(),
        fc.boolean(),
        fc.constantFrom("/", " / ", "-", ".", " "),
        expiryOptions,
        (month, year, padMonth, fullYear, written, o) => {
          const text = `${padMonth ? pad(month) : month}${written}${fullYear ? year : pad(year % 100)}`;
          expect(parseCardExpiry(text, o)).toEqual({
            value: `${pad(month)}/${pad(year % 100)}`,
            formattedValue: `${pad(month)}${o?.separator ?? "/"}${pad(year % 100)}`,
            month,
            year
          });
        }
      )
    );
  });

  it("C12 the separator option does not change value, month or year", () => {
    holds(
      fc.property(expiryText, expirySeparator, expirySeparator, (input, a, b) => {
        const first = parseCardExpiry(String(input), { separator: a });
        const second = parseCardExpiry(String(input), { separator: b });
        expect(second.formattedValue).toBe(first.formattedValue.replace(a, b));
        expect([second.value, second.month, second.year]).toEqual([first.value, first.month, first.year]);
      })
    );
  });

  it("C13 typing digits one by one equals formatting them and never changes a complete month", () => {
    holds(
      fc.property(expiryOptions, tail(6), (o, digits) => {
        const steps = typeExpiry(o ?? {}, digits);
        steps.forEach((values, i) => {
          if (i > 0 && steps[i - 1].formattedValue.replace(/\D/g, "").length >= 2) {
            expect(values.formattedValue.slice(0, 2)).toBe(steps[i - 1].formattedValue.slice(0, 2));
          }
        });
        expect(steps.length ? steps[steps.length - 1].formattedValue : "").toBe(formatCardExpiry(digits, o));
      })
    );
  });

  it("C14 a card is valid through the last moment of its month, local time", () => {
    holds(
      fc.property(
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 2000, max: 2099 }),
        fc.date({ min: new Date(1999, 0, 1), max: new Date(2101, 0, 1), noInvalidDate: true }),
        (month, year, now) => {
          expect(isCardExpired(month, year, now)).toBe(now.getTime() >= new Date(year, month, 1).getTime());
        }
      )
    );
  });
});

const cvcBrand = fc.option(fc.constantFrom(...TABLE.map(r => r.brand)), { nil: undefined });

describe("card CVC", () => {
  it("C15 keeps the first digits up to 4 for Amex and 3 otherwise, complete at that length", () => {
    holds(
      fc.property(fc.oneof(cardText, fc.nat()), cvcBrand, (input, brand) => {
        const length = TABLE.find(r => r.brand === brand)?.cvc ?? 3;
        const value = digitsOf(input).slice(0, length);
        expect(formatCardCvc(input, { brand })).toBe(value);
        expect(formatCardCvc(value, { brand })).toBe(value);
        expect(parseCardCvc(String(input), { brand })).toEqual({ value, formattedValue: value, complete: value.length === length });
      })
    );
  });
});
