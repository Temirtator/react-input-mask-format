import type { CardBrand } from "./types";
import { cardBrandInfo, DEFAULT_GAPS } from "./brands";
import { luhn } from "../validators/shared";

export interface CardNumberOptions {
  separator?: string;
}

export interface CardNumberValues {
  value: string;
  formattedValue: string;
  brand: CardBrand | undefined;
  complete: boolean;
  valid: boolean;
}

function group(digits: string, gaps: number[], separator: string): string {
  const parts: string[] = [];
  let start = 0;
  for (const size of gaps) {
    if (start >= digits.length) break;
    parts.push(digits.slice(start, start + size));
    start += size;
  }
  return parts.join(separator);
}

export function parseCardNumber(
  formatted: string,
  options?: CardNumberOptions
): CardNumberValues {
  const all = String(formatted ?? "").replace(/\D/g, "");
  const info = cardBrandInfo(all);
  const value = all.slice(0, info ? Math.max(...info.lengths) : 19);
  const gaps =
    info && info.gaps.reduce((sum, size) => sum + size, 0) >= value.length
      ? info.gaps
      : DEFAULT_GAPS;
  const complete = !!info && info.lengths.includes(value.length);
  return {
    value,
    formattedValue: group(value, gaps, options?.separator ?? " "),
    brand: info?.brand,
    complete,
    valid: complete && (!info.luhn || luhn(value)),
  };
}

export function formatCardNumber(input: string | number, options?: CardNumberOptions): string {
  return parseCardNumber(String(input ?? ""), options).formattedValue;
}
