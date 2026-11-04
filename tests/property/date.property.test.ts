import { describe, it, expect } from "vitest";
import { fc, holds } from "./arbitraries";
import { formatDate } from "../../src/date/format-date";
import { parseDate, parseDateEdit } from "../../src/date/parse-date";
import type { DateFormatOptions, DateFormatValues, DateOrder } from "../../src/date/types";

type Field = "day" | "month" | "year";

const FIELDS: Record<DateOrder, Field[]> = {
  dmy: ["day", "month", "year"],
  mdy: ["month", "day", "year"],
  ymd: ["year", "month", "day"]
};
const LENGTH: Record<Field, number> = { day: 2, month: 2, year: 4 };
const FULL: Record<Field, string> = { day: "(?:0[1-9]|[12]\\d|3[01])", month: "(?:0[1-9]|1[0-2])", year: "\\d{4}" };
const PARTIAL: Record<Field, string> = { day: "\\d", month: "\\d", year: "\\d{1,3}" };
const SEPARATORS = [".", "/", "-", " ", " / ", ". "];
const WRITTEN_SEPARATORS = [".", "/", "-", " ", " / ", ", "];

function named<T extends object>(value: T): T {
  return Object.assign(value, { [fc.toStringMethod]: () => JSON.stringify(value) });
}

const order = fc.constantFrom<DateOrder>("dmy", "mdy", "ymd");
const separator = fc.constantFrom(...SEPARATORS);
const options: fc.Arbitrary<DateFormatOptions> = fc.record({ order, separator }, { requiredKeys: [] }).map(named);
const digitUnit = fc.constantFrom(..."0123456789".split(""));
const digitString = fc.string({ unit: digitUnit, maxLength: 10 });
const group = fc.string({ unit: digitUnit, minLength: 1, maxLength: 4 });
const writtenSeparator = fc.constantFrom(...WRITTEN_SEPARATORS);
const text: fc.Arbitrary<string | number> = fc.oneof(
  fc.string({
    unit: fc.oneof(
      { weight: 5, arbitrary: digitUnit },
      { weight: 1, arbitrary: fc.constantFrom(".", "/", "-", " ", "T", ":", "Z") }
    ),
    maxLength: 14
  }),
  fc.tuple(group, writtenSeparator, group, writtenSeparator, group).map(parts => parts.join("")),
  fc.nat({ max: 99999999 })
);
const withText = fc.tuple(options, text);

function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fieldsOf(o: DateFormatOptions): Field[] {
  return FIELDS[o.order ?? "dmy"];
}

function separatorOf(o: DateFormatOptions): string {
  return o.separator ?? ".";
}

function shapeOf(o: DateFormatOptions): RegExp {
  const [a, b, c] = fieldsOf(o);
  const s = escape(separatorOf(o));
  return new RegExp(`^(?:${PARTIAL[a]}|${FULL[a]}${s}(?:${PARTIAL[b]}|${FULL[b]}${s}(?:${PARTIAL[c]}|${FULL[c]})?)?)?$`);
}

function exists(year: number, month: number, day: number): boolean {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

const calendarDate: fc.Arbitrary<CalendarDate> = fc
  .record({
    year: fc.integer({ min: 0, max: 9999 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 31 })
  })
  .filter(({ year, month, day }) => exists(year, month, day));

function isoOf({ year, month, day }: CalendarDate): string {
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

function render(d: CalendarDate, o: DateFormatOptions): string {
  return fieldsOf(o)
    .map(field => pad(d[field], LENGTH[field]))
    .join(separatorOf(o));
}

function digitIndex(value: string, count: number): number {
  let seen = 0;
  for (let i = 0; i < value.length; i++) {
    if (/\d/.test(value[i])) {
      if (seen === count) {
        return i;
      }
      seen++;
    }
  }
  return value.length;
}

function digitCount(value: string): number {
  return value.replace(/\D/g, "").length;
}

function typeDigits(o: DateFormatOptions, digits: string): DateFormatValues[] {
  const steps: DateFormatValues[] = [];
  let previous = "";
  for (const digit of digits) {
    const raw = previous + digit;
    const values = parseDateEdit(raw, o, previous, digitCount(raw));
    steps.push(values);
    previous = values.formattedValue;
  }
  return steps;
}

describe("formatDate", () => {
  it("D1 is idempotent", () => {
    holds(
      fc.property(withText, ([o, input]) => {
        const once = formatDate(input, o);
        expect(formatDate(once, o)).toBe(once);
      })
    );
  });

  it("D2 lays the fields out in order, a separator after each complete field, days 01-31 and months 01-12", () => {
    holds(
      fc.property(withText, ([o, input]) => {
        expect(formatDate(input, o)).toMatch(shapeOf(o));
      })
    );
  });

  it("D3 the separator only changes the separators", () => {
    holds(
      fc.property(order, separator, separator, text, (fieldOrder, a, b, input) => {
        const first = formatDate(input, { order: fieldOrder, separator: a });
        expect(formatDate(input, { order: fieldOrder, separator: b })).toBe(first.split(a).join(b));
      })
    );
  });
});

describe("parseDate", () => {
  it("D4 reads its own output back unchanged", () => {
    holds(
      fc.property(withText, ([o, input]) => {
        const values = parseDate(String(input), o);
        expect(values.formattedValue).toBe(formatDate(input, o));
        expect(parseDate(values.formattedValue, o)).toEqual(values);
      })
    );
  });

  it("D5 defines the complete parts and an ISO value only for a date that exists", () => {
    holds(
      fc.property(withText, ([o, input]) => {
        const { value, formattedValue, ...parts } = parseDate(String(input), o);
        const shown = formattedValue.split(separatorOf(o));
        fieldsOf(o).forEach((field, i) => {
          const digits = shown[i] ?? "";
          expect(parts[field]).toBe(digits.length === LENGTH[field] ? Number(digits) : undefined);
        });
        const { day, month, year } = parts;
        const complete = day !== undefined && month !== undefined && year !== undefined;
        expect(value).toBe(complete && exists(year, month, day) ? isoOf({ year, month, day }) : "");
      })
    );
  });

  it("D6 a date written with the 4-digit year first (ISO) or last lands in the right fields", () => {
    const written = fc
      .record({
        date: calendarDate,
        o: options,
        yearFirst: fc.boolean(),
        padMonth: fc.boolean(),
        padDay: fc.boolean(),
        first: writtenSeparator,
        second: writtenSeparator,
        time: fc.constantFrom("", " 10:00", "T10:00:00Z")
      })
      .map(({ date, o, yearFirst, padMonth, padDay, first, second, time }) => {
        const month = padMonth ? pad(date.month, 2) : String(date.month);
        const day = padDay || (yearFirst && month.length === 2 && o.order === "ymd") ? pad(date.day, 2) : String(date.day);
        const year = pad(date.year, 4);
        const [a, b] = o.order === "mdy" ? [month, day] : [day, month];
        const input = (yearFirst ? `${year}${first}${month}${second}${day}` : `${a}${first}${b}${second}${year}`) + time;
        return { date, o, input };
      });
    holds(
      fc.property(written, ({ date, o, input }) => {
        expect(formatDate(input, o)).toBe(render(date, o));
        expect(parseDate(input, o)).toEqual({ value: isoOf(date), formattedValue: render(date, o), ...date });
      })
    );
  });

  it("D7 the separator does not change the value or the parts", () => {
    holds(
      fc.property(order, separator, separator, text, (fieldOrder, a, b, input) => {
        const first = parseDate(String(input), { order: fieldOrder, separator: a });
        const second = parseDate(String(input), { order: fieldOrder, separator: b });
        expect([second.value, second.day, second.month, second.year]).toEqual([first.value, first.day, first.month, first.year]);
      })
    );
  });
});

describe("date editing", () => {
  it("D8 typing digits one by one equals formatting them and never changes a complete field", () => {
    holds(
      fc.property(options, digitString, (o, digits) => {
        const steps = typeDigits(o, digits);
        steps.forEach((values, i) => {
          const before = steps[i - 1];
          (["day", "month", "year"] as const).forEach(field => {
            if (before && before[field] !== undefined) {
              expect(values[field]).toBe(before[field]);
            }
          });
        });
        expect(steps.length ? steps[steps.length - 1].formattedValue : "").toBe(formatDate(digits, o));
      })
    );
  });

  it("D9 deleting a digit and typing it back at the same place restores the date", () => {
    holds(
      fc.property(
        options,
        fc.string({ unit: digitUnit, minLength: 1, maxLength: 10 }),
        fc.nat(),
        (o, digits, at) => {
          const shown = formatDate(digits, o);
          const k = at % digitCount(shown);
          const position = digitIndex(shown, k);
          const deleted = parseDateEdit(shown.slice(0, position) + shown.slice(position + 1), o, shown, k);
          expect(deleted.value).toBe("");
          const insertAt = k === 0 ? 0 : digitIndex(deleted.formattedValue, k - 1) + 1;
          const raw = deleted.formattedValue.slice(0, insertAt) + shown[position] + deleted.formattedValue.slice(insertAt);
          expect(parseDateEdit(raw, o, deleted.formattedValue, k + 1)).toEqual(parseDate(shown, o));
        }
      )
    );
  });
});
