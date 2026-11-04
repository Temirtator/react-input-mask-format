import { describe, it, expect } from "vitest";
import { fc, holds } from "./arbitraries";
import { formatTime } from "../../src/time/format-time";
import { parseTime } from "../../src/time/parse-time";
import type { TimeFormatOptions } from "../../src/time/types";

const SEPARATORS = [":", ".", " : ", "h", " "];

const separator = fc.constantFrom(...SEPARATORS);
const options: fc.Arbitrary<TimeFormatOptions | undefined> = fc.option(fc.record({ separator }, { requiredKeys: [] }), {
  nil: undefined
});
const text: fc.Arbitrary<string | number> = fc.oneof(
  fc.string({
    unit: fc.oneof(
      { weight: 5, arbitrary: fc.constantFrom(..."0123456789".split("")) },
      { weight: 1, arbitrary: fc.constantFrom(":", ".", " ", "h", "-", "a") }
    ),
    maxLength: 8
  }),
  fc.nat({ max: 99999 })
);

function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clampPair(pair: string, max: number): string {
  return pair.length === 2 ? String(Math.min(Number(pair), max)).padStart(2, "0") : pair;
}

describe("formatTime", () => {
  it("T1 is idempotent", () => {
    holds(
      fc.property(options, text, (o, input) => {
        const once = formatTime(input, o);
        expect(formatTime(once, o)).toBe(once);
      })
    );
  });

  it("T2 returns hours, then the separator and minutes once the hours are complete, within 23:59", () => {
    holds(
      fc.property(options, text, (o, input) => {
        const sep = escape(o?.separator ?? ":");
        expect(formatTime(input, o)).toMatch(new RegExp(`^(?:\\d|(?:[01]\\d|2[0-3])${sep}(?:\\d|[0-5]\\d)?)?$`));
      })
    );
  });

  it("T3 keeps the first four digits, clamping only a complete hours or minutes pair", () => {
    holds(
      fc.property(options, text, (o, input) => {
        const digits = String(input).replace(/\D/g, "").slice(0, 4);
        const expected = clampPair(digits.slice(0, 2), 23) + clampPair(digits.slice(2), 59);
        expect(formatTime(input, o).replace(/\D/g, "")).toBe(expected);
      })
    );
  });

  it("T4 the separator only changes the separator", () => {
    holds(
      fc.property(text, separator, separator, (input, a, b) => {
        expect(formatTime(input, { separator: b })).toBe(formatTime(input, { separator: a }).replace(a, b));
      })
    );
  });
});

describe("parseTime", () => {
  it("T5 reads its own output back unchanged", () => {
    holds(
      fc.property(options, text, (o, input) => {
        const values = parseTime(String(input), o);
        expect(values.formattedValue).toBe(formatTime(input, o));
        expect(parseTime(values.formattedValue, o)).toEqual(values);
      })
    );
  });

  it("T6 value is HH:MM with ':' once complete, else empty, and the parts are in range", () => {
    holds(
      fc.property(options, text, (o, input) => {
        const { value, formattedValue, hours, minutes } = parseTime(String(input), o);
        const digits = formattedValue.replace(/\D/g, "");
        expect(hours).toBe(digits.length >= 2 ? Number(digits.slice(0, 2)) : undefined);
        expect(minutes).toBe(digits.length === 4 ? Number(digits.slice(2)) : undefined);
        expect(value).toBe(digits.length === 4 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : "");
        if (hours !== undefined) {
          expect(hours).toBeLessThanOrEqual(23);
        }
        if (minutes !== undefined) {
          expect(minutes).toBeLessThanOrEqual(59);
        }
      })
    );
  });

  it("T7 the separator does not change value, hours or minutes", () => {
    holds(
      fc.property(text, separator, separator, (input, a, b) => {
        const first = parseTime(formatTime(input, { separator: a }), { separator: a });
        const second = parseTime(formatTime(input, { separator: b }), { separator: b });
        expect([second.value, second.hours, second.minutes]).toEqual([first.value, first.hours, first.minutes]);
      })
    );
  });
});
