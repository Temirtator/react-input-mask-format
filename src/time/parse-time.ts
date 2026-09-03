import type { TimeFormatOptions, TimeFormatValues } from "./types";
import { tokenizeTime, buildFormatted } from "./format-time";

export function parseTime(formatted: string, options?: TimeFormatOptions): TimeFormatValues {
  const separator = options?.separator ?? ":";
  const parts = tokenizeTime(formatted);
  const formattedValue = buildFormatted(parts, separator);
  const hours = parts.hours.length === 2 ? parseInt(parts.hours, 10) : undefined;
  const minutes = parts.minutes.length === 2 ? parseInt(parts.minutes, 10) : undefined;
  const value =
    hours !== undefined && minutes !== undefined ? `${parts.hours}:${parts.minutes}` : "";
  return { value, formattedValue, hours, minutes };
}

export function digitsBeforeCaret(value: string, caret: number): number {
  let count = 0;
  for (let i = 0; i < caret && i < value.length; i++) {
    if (value[i] >= "0" && value[i] <= "9") count++;
  }
  return count;
}

function caretAfterDigits(formatted: string, digitsBefore: number): number {
  if (digitsBefore <= 0) {
    const first = formatted.search(/\d/);
    return first === -1 ? formatted.length : first;
  }
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] >= "0" && formatted[i] <= "9") {
      seen++;
      if (seen === digitsBefore) return i + 1;
    }
  }
  return formatted.length;
}

export function resolveCaret(
  values: TimeFormatValues,
  digitsBefore: number,
  options?: TimeFormatOptions
): number {
  const separator = options?.separator ?? ":";
  const caret = caretAfterDigits(values.formattedValue, digitsBefore);
  if (separator && values.formattedValue.slice(caret, caret + separator.length) === separator) {
    return caret + separator.length;
  }
  return caret;
}
