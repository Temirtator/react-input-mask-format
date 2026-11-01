import type React from "react";
import type { CardNumberOptions, CardNumberValues } from "./card-number";
import { formatCardNumber, parseCardNumber } from "./card-number";
import { useDigitFormat } from "../utils/digit-format";
import type { DigitFormatKind } from "../utils/digit-format";

export interface UseCardNumberFormatOptions extends CardNumberOptions {
  onValueChange?: (values: CardNumberValues) => void;
}

export const cardNumberKind: DigitFormatKind<CardNumberOptions, CardNumberValues> = {
  separator: (options) => options.separator ?? " ",
  format: formatCardNumber,
  parse: (raw, options) => parseCardNumber(raw, options),
};

export function useCardNumberFormat(
  options: UseCardNumberFormatOptions
): React.RefCallback<HTMLInputElement> {
  return useDigitFormat(cardNumberKind, options);
}
