import type { DateFormatOptions, DateFormatValues } from "./types";
import { tokenizeDate, buildFormattedDate, isSingleKeystroke } from "./format-date";
import type { DateParts } from "./format-date";

export function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  }
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

export function parseDate(formatted: string, options?: DateFormatOptions): DateFormatValues {
  return valuesOf(tokenizeDate(formatted, options), options);
}

export function parseDateEdit(
  raw: string,
  options: DateFormatOptions,
  previous: string,
  digitsBefore: number
): DateFormatValues {
  return isSingleKeystroke(previous, raw)
    ? valuesOf(tokenizeDate(raw, options, digitsBefore), options)
    : parseDate(raw, options);
}

function valuesOf(parts: DateParts, options?: DateFormatOptions): DateFormatValues {
  const formattedValue = buildFormattedDate(parts, options);
  const day = parts.day.length === 2 ? parseInt(parts.day, 10) : undefined;
  const month = parts.month.length === 2 ? parseInt(parts.month, 10) : undefined;
  const year = parts.year.length === 4 ? parseInt(parts.year, 10) : undefined;
  const value =
    day !== undefined &&
    month !== undefined &&
    year !== undefined &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
      ? `${parts.year}-${parts.month}-${parts.day}`
      : "";
  return { value, formattedValue, day, month, year };
}
