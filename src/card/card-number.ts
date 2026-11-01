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

function layout(input: string | number, options?: CardNumberOptions): CardNumberValues {
  const all = String(input ?? "").replace(/\D/g, "");
  const info = cardBrandInfo(all);
  const value = all.slice(0, info ? Math.max(...info.lengths) : 19);
  let start = 0;
  const groups = (info && value.length <= info.lengths[0] ? info.gaps : DEFAULT_GAPS)
    .map((size) => value.slice(start, (start += size)))
    .filter(Boolean);
  const complete = !!info && info.lengths.includes(value.length);
  return {
    value,
    formattedValue: groups.join(options?.separator ?? " "),
    brand: info?.brand,
    complete,
    valid: complete && (!info.luhn || luhn(value)),
  };
}

export function parseCardNumber(
  formatted: string,
  options?: CardNumberOptions
): CardNumberValues {
  return layout(formatted, options);
}

export function formatCardNumber(input: string | number, options?: CardNumberOptions): string {
  return layout(input, options).formattedValue;
}
