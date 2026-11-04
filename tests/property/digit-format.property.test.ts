import { describe, it, expect } from "vitest";
import { fc, holds } from "./arbitraries";
import {
  collapseTrailingSeparator,
  deleteAcrossSeparator,
  digitsBeforeCaret,
  isSingleKeystroke,
  resolveDigitCaret,
  type DigitFormatKind,
  type DigitValues
} from "../../src/utils/digit-format";
import { timeKind } from "../../src/time/use-time-format";
import { dateKind } from "../../src/date/use-date-format";
import { cardNumberKind } from "../../src/card/use-card-number-format";
import { cardExpiryKind } from "../../src/card/use-card-expiry-format";

interface Layout {
  value: string;
  separator: string;
  separators: number[];
}

const SEPARATORS = [":", ".", "/", " ", "-", " / ", " : "];

const digitUnit = fc.constantFrom(..."0123456789".split(""));
const separator = fc.constantFrom(...SEPARATORS);
const anyText = fc.string({
  unit: fc.oneof({ weight: 3, arbitrary: digitUnit }, { weight: 1, arbitrary: fc.constantFrom(".", "/", ":", " ", "-") }),
  maxLength: 14
});

function named<T extends object>(value: T, name: string): T {
  return Object.assign(value, { [fc.toStringMethod]: () => name });
}

function layoutOf(separator: string, groups: string[], leading: boolean, trailing: boolean): Layout {
  let value = "";
  const separators: number[] = [];
  const add = () => {
    separators.push(value.length);
    value += separator;
  };
  if (leading) {
    add();
  }
  groups.forEach((group, i) => {
    if (i > 0) {
      add();
    }
    value += group;
  });
  if (trailing) {
    add();
  }
  return named({ value, separator, separators }, JSON.stringify({ value, separator }));
}

function layoutWith(trailing: fc.Arbitrary<boolean>): fc.Arbitrary<Layout> {
  return fc
    .tuple(
      separator,
      fc.array(fc.string({ unit: digitUnit, minLength: 1, maxLength: 4 }), { minLength: 1, maxLength: 5 }),
      fc.boolean(),
      trailing
    )
    .map(([sep, groups, leading, withTrailing]) => layoutOf(sep, groups, leading, withTrailing));
}

const layout = layoutWith(fc.boolean());
const trailingLayout = layoutWith(fc.constant(true));

function digitCount(value: string): number {
  return value.replace(/\D/g, "").length;
}

function afterDigits(value: string, count: number): number {
  let seen = 0;
  for (let i = 0; i < value.length; i++) {
    if (/\d/.test(value[i]) && ++seen === count) {
      return i + 1;
    }
  }
  return value.length;
}

function without(value: string, index: number): string {
  return value.slice(0, index) + value.slice(index + 1);
}

function lastDigitBefore(value: string, index: number): number {
  for (let i = index - 1; i >= 0; i--) {
    if (/\d/.test(value[i])) {
      return i;
    }
  }
  return -1;
}

function firstDigitFrom(value: string, index: number): number {
  for (let i = index; i < value.length; i++) {
    if (/\d/.test(value[i])) {
      return i;
    }
  }
  return -1;
}

describe("digit field helpers", () => {
  it("S1 digitsBeforeCaret counts the digits left of the caret", () => {
    holds(
      fc.property(anyText, fc.nat({ max: 16 }), (value, caret) => {
        expect(digitsBeforeCaret(value, caret)).toBe(digitCount(value.slice(0, caret)));
      })
    );
  });

  it("S2 resolveDigitCaret lands after the n-th digit and steps past a separator right after it", () => {
    holds(
      fc.property(layout, fc.nat({ max: 20 }), ({ value, separator: sep }, n) => {
        const caret = resolveDigitCaret(value, n, sep);
        expect(digitsBeforeCaret(value, caret)).toBe(Math.min(n, digitCount(value)));
        if (n === 0) {
          expect(caret).toBe(firstDigitFrom(value, 0));
        } else {
          const after = afterDigits(value, Math.min(n, digitCount(value)));
          expect(caret).toBe(value.startsWith(sep, after) ? after + sep.length : after);
        }
      })
    );
  });

  it("S3 isSingleKeystroke accepts one inserted digit or a deletion and rejects anything else inserted", () => {
    holds(
      fc.property(anyText, fc.nat(), fc.nat(), digitUnit, (previous, a, b, digit) => {
        const at = a % (previous.length + 1);
        const to = at + (b % (previous.length - at + 1));
        expect(isSingleKeystroke(previous, previous.slice(0, at) + digit + previous.slice(at))).toBe(true);
        expect(isSingleKeystroke(previous, previous.slice(0, at) + previous.slice(to))).toBe(true);
      })
    );
    holds(
      fc.property(
        anyText,
        fc.nat(),
        fc.oneof(fc.constantFrom(".", "/", ":", " ", "a"), fc.string({ unit: digitUnit, minLength: 2, maxLength: 8 })),
        (previous, a, inserted) => {
          const at = a % (previous.length + 1);
          expect(isSingleKeystroke(previous, previous.slice(0, at) + inserted + previous.slice(at))).toBe(false);
        }
      )
    );
  });

  it("S4 collapseTrailingSeparator removes the digit before a trailing separator that is being deleted", () => {
    holds(
      fc.property(trailingLayout, fc.nat(), ({ value, separator: sep }, k) => {
        const body = value.slice(0, -sep.length);
        const raw = value.slice(0, value.length - 1 - (k % sep.length));
        expect(collapseTrailingSeparator(raw, value, sep)).toBe(body.slice(0, -1));
      })
    );
  });

  it("S5 collapseTrailingSeparator leaves typing and digit deletions alone", () => {
    holds(
      fc.property(layout, fc.nat(), digitUnit, ({ value, separator: sep }, a, digit) => {
        const at = a % (value.length + 1);
        const typed = value.slice(0, at) + digit + value.slice(at);
        expect(collapseTrailingSeparator(typed, value, sep)).toBe(typed);
        const digits = value.split("").flatMap((char, i) => (/\d/.test(char) ? [i] : []));
        const deleted = without(value, digits[a % digits.length]);
        expect(collapseTrailingSeparator(deleted, value, sep)).toBe(deleted);
      })
    );
  });

  it("S6 Backspace right after a separator deletes the digit before it, Delete right before one the digit after it", () => {
    holds(
      fc.property(
        layout.filter(l => l.separators.length > 0),
        fc.nat(),
        fc.boolean(),
        ({ value, separator: sep, separators }, pick, forward) => {
          const start = separators[pick % separators.length];
          const removed = forward ? start : start + sep.length - 1;
          const raw = without(value, removed);
          const digit = forward ? firstDigitFrom(value, start) : lastDigitBefore(value, start);
          const expected = digit === -1 ? { raw, caret: removed } : { raw: without(value, digit), caret: forward ? start : digit };
          expect(deleteAcrossSeparator(raw, value, removed, forward)).toEqual(expected);
        }
      )
    );
  });

  it("S7 deleteAcrossSeparator leaves a deletion that removes a digit alone", () => {
    holds(
      fc.property(layout, fc.nat(), fc.nat(), fc.boolean(), ({ value }, a, b, forward) => {
        const from = a % value.length;
        const to = from + 1 + (b % (value.length - from));
        fc.pre(/\d/.test(value.slice(from, to)));
        const raw = value.slice(0, from) + value.slice(to);
        expect(deleteAcrossSeparator(raw, value, from, forward)).toEqual({ raw, caret: from });
      })
    );
  });
});

interface KindCase {
  kind: DigitFormatKind<object, DigitValues>;
  options: object;
}

function kindCase<O extends object, V extends DigitValues>(name: string, kind: DigitFormatKind<O, V>, options: O): KindCase {
  return named({ kind: kind as unknown as DigitFormatKind<object, DigitValues>, options }, `${name} ${JSON.stringify(options)}`);
}

const kinds: fc.Arbitrary<KindCase> = fc.oneof(
  fc.constantFrom(":", ".", " : ").map(s => kindCase("time", timeKind, { separator: s })),
  fc
    .tuple(fc.constantFrom("dmy" as const, "mdy" as const, "ymd" as const), fc.constantFrom(".", "/", " / "))
    .map(([order, s]) => kindCase("date", dateKind, { order, separator: s })),
  fc.constantFrom(" ", "-").map(s => kindCase("card number", cardNumberKind, { separator: s })),
  fc.constantFrom("/", " / ").map(s => kindCase("card expiry", cardExpiryKind, { separator: s }))
);

function edit({ kind, options }: KindCase, previous: string, raw: string, caret: number, forward: boolean): DigitValues {
  const sep = kind.separator(options);
  const next = deleteAcrossSeparator(collapseTrailingSeparator(raw, previous, sep), previous, caret, forward);
  return kind.parse(next.raw, options, previous, digitsBeforeCaret(next.raw, next.caret));
}

function separatorsIn(value: string, sep: string): number[] {
  const found: number[] = [];
  for (let i = 0; i < value.length; i++) {
    if (value.startsWith(sep, i)) {
      found.push(i);
      i += sep.length - 1;
    }
  }
  return found;
}

describe("digit field editing", () => {
  it("S8 in time, date, card number and expiry fields a key next to a separator acts on the digit beyond it", () => {
    holds(
      fc.property(kinds, fc.string({ unit: digitUnit, minLength: 1, maxLength: 19 }), fc.nat(), (c, digits, pick) => {
        const sep = c.kind.separator(c.options);
        const shown = c.kind.format(digits, c.options);
        const found = separatorsIn(shown, sep);
        fc.pre(found.length > 0);
        const start = found[pick % found.length];
        const end = start + sep.length;
        const lastChar = end - 1;
        expect(edit(c, shown, without(shown, lastChar), lastChar, false)).toEqual(
          edit(c, shown, without(shown, start - 1), start - 1, false)
        );
        if (end < shown.length) {
          expect(edit(c, shown, without(shown, start), start, true)).toEqual(edit(c, shown, without(shown, end), end, true));
        }
      })
    );
  });
});
