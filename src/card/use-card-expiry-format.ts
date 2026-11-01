import type React from "react";
import type { CardExpiryOptions, CardExpiryValues } from "./card-expiry";
import { formatCardExpiry, parseCardExpiryEdit } from "./card-expiry";
import { useDigitFormat } from "../utils/digit-format";
import type { DigitFormatKind } from "../utils/digit-format";

export interface UseCardExpiryFormatOptions extends CardExpiryOptions {
  onValueChange?: (values: CardExpiryValues) => void;
}

export const cardExpiryKind: DigitFormatKind<CardExpiryOptions, CardExpiryValues> = {
  separator: (options) => options.separator ?? "/",
  format: formatCardExpiry,
  parse: parseCardExpiryEdit,
};

export function useCardExpiryFormat(
  options: UseCardExpiryFormatOptions
): React.RefCallback<HTMLInputElement> {
  return useDigitFormat(cardExpiryKind, options);
}
