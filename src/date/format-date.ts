import type { DateFormatOptions, DateOrder } from "./types";

export interface DateParts {
  day: string;
  month: string;
  year: string;
}

type Field = keyof DateParts;

const FIELDS: Record<DateOrder, Field[]> = {
  dmy: ["day", "month", "year"],
  mdy: ["month", "day", "year"],
  ymd: ["year", "month", "day"],
};

const LENGTH: Record<Field, number> = { day: 2, month: 2, year: 4 };

function clamp(field: string, max: number): string {
  return field.length === 2
    ? String(Math.min(Math.max(parseInt(field, 10), 1), max)).padStart(2, "0")
    : field;
}

function readFields(raw: string, fields: Field[]): string | undefined {
  const groups = raw.match(/\d+/g);
  if (!groups || groups.length < 3) return undefined;
  const [a, b, c] = groups;
  if (a.length === LENGTH[fields[0]] && b.length === LENGTH[fields[1]]) return undefined;
  const short = (group: string): boolean => group.length === 1 || group.length === 2;
  const pad = (group: string): string => group.padStart(2, "0");
  let parts: DateParts;
  if (a.length === 4 && short(b) && short(c)) {
    parts = { year: a, month: pad(b), day: pad(c) };
  } else if (c.length === 4 && short(a) && short(b)) {
    parts =
      fields[0] === "month"
        ? { month: pad(a), day: pad(b), year: c }
        : { day: pad(a), month: pad(b), year: c };
  } else {
    return undefined;
  }
  return fields.map((field) => parts[field]).join("");
}

export function tokenizeDate(
  raw: string | number,
  options?: DateFormatOptions,
  keystrokeDigits?: number
): DateParts {
  const fields = FIELDS[options?.order ?? "dmy"];
  const text = String(raw ?? "");
  const digits = (
    (keystrokeDigits === undefined ? readFields(text, fields) : undefined) ??
    text.replace(/\D/g, "")
  ).slice(0, 8);
  const parts: DateParts = { day: "", month: "", year: "" };
  let start = 0;
  for (const field of fields) {
    parts[field] = digits.slice(start, start + LENGTH[field]);
    start += LENGTH[field];
    if (keystrokeDigits === undefined || keystrokeDigits === start) {
      if (field === "day") parts.day = clamp(parts.day, 31);
      if (field === "month") parts.month = clamp(parts.month, 12);
    }
  }
  return parts;
}

export function isSingleKeystroke(previous: string, raw: string): boolean {
  const shortest = Math.min(previous.length, raw.length);
  let prefix = 0;
  while (prefix < shortest && previous[prefix] === raw[prefix]) prefix++;
  let suffix = 0;
  while (
    suffix < shortest - prefix &&
    previous[previous.length - 1 - suffix] === raw[raw.length - 1 - suffix]
  ) {
    suffix++;
  }
  const inserted = raw.slice(prefix, raw.length - suffix);
  return inserted === "" || /^\d$/.test(inserted);
}

export function buildFormattedDate(parts: DateParts, options?: DateFormatOptions): string {
  const fields = FIELDS[options?.order ?? "dmy"];
  const separator = options?.separator ?? ".";
  let formatted = "";
  for (let i = 0; i < fields.length; i++) {
    const field = parts[fields[i]];
    formatted += field;
    if (field.length < LENGTH[fields[i]]) break;
    if (i < fields.length - 1) formatted += separator;
  }
  return formatted;
}

export function formatDate(input: string | number, options?: DateFormatOptions): string {
  return buildFormattedDate(tokenizeDate(input, options), options);
}
