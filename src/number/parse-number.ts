import type { NumberFormatOptions, NumberFormatValues } from "./types";
import { tokenize, buildFormatted, type NumberParts } from "./format-number";

function buildValue(parts: NumberParts): string {
  const sign = parts.negative ? "-" : "";
  let int = parts.int;
  if (int === "" && (parts.frac !== "" || parts.hasSeparator)) int = "0";
  let v = sign + int;
  if (parts.frac !== "") v += "." + parts.frac;
  else if (parts.hasSeparator) v += ".";
  return v;
}

export function parseNumber(formatted: string, options: NumberFormatOptions): NumberFormatValues {
  const parts = tokenize(formatted, options);
  const value = buildValue(parts);
  const formattedValue = buildFormatted(parts, options);
  const floatValue =
    value === "" || value === "-" || value === "." || value === "-." || value === "-0."
      ? undefined
      : parseFloat(value);
  return {
    value,
    formattedValue,
    floatValue: floatValue !== undefined && Number.isNaN(floatValue) ? undefined : floatValue
  };
}

export function digitsBeforeCaret(value: string, caret: number): number {
  let count = 0;
  for (let i = 0; i < caret && i < value.length; i++) {
    if (value[i] >= "0" && value[i] <= "9") count++;
  }
  return count;
}

export function caretAfterReformat(nextFormatted: string, digitsBefore: number): number {
  if (digitsBefore <= 0) {
    // place caret before the first digit (after any prefix/sign)
    const firstDigit = nextFormatted.search(/\d/);
    return firstDigit === -1 ? nextFormatted.length : firstDigit;
  }
  let seen = 0;
  let i = 0;
  for (; i < nextFormatted.length; i++) {
    if (nextFormatted[i] >= "0" && nextFormatted[i] <= "9") {
      seen++;
      if (seen === digitsBefore) return i + 1;
    }
  }
  return nextFormatted.length;
}
