import type { TimeFormatOptions, TimeFormatValues } from "./types";
import { tokenizeTime, buildFormatted } from "./format-time";
import { resolveDigitCaret } from "../utils/digit-format";

export { collapseTrailingSeparator, digitsBeforeCaret } from "../utils/digit-format";

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

export function resolveCaret(
  values: TimeFormatValues,
  digitsBefore: number,
  options?: TimeFormatOptions
): number {
  return resolveDigitCaret(values.formattedValue, digitsBefore, options?.separator ?? ":");
}
