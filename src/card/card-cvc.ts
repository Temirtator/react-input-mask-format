import type { CardBrand } from "./types";
import { CARD_BRANDS } from "./brands";

export interface CardCvcOptions {
  brand?: CardBrand;
}

export interface CardCvcValues {
  value: string;
  formattedValue: string;
  complete: boolean;
}

function layout(input: string | number, options?: CardCvcOptions): CardCvcValues {
  const length = CARD_BRANDS.find((info) => info.brand === options?.brand)?.cvc || 3;
  const value = String(input ?? "").replace(/\D/g, "").slice(0, length);
  return { value, formattedValue: value, complete: value.length === length };
}

export function parseCardCvc(formatted: string, options?: CardCvcOptions): CardCvcValues {
  return layout(formatted, options);
}

export function formatCardCvc(input: string | number, options?: CardCvcOptions): string {
  return layout(input, options).value;
}
