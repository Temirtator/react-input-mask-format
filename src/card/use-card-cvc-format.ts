import type * as React from "react";
import type { CardCvcOptions, CardCvcValues } from "./card-cvc";
import { formatCardCvc, parseCardCvc } from "./card-cvc";
import { useDigitFormat } from "../utils/digit-format";
import type { DigitFormatKind } from "../utils/digit-format";

export interface UseCardCvcFormatOptions extends CardCvcOptions {
  onValueChange?: (values: CardCvcValues) => void;
}

export const cardCvcKind: DigitFormatKind<CardCvcOptions, CardCvcValues> = {
  separator: () => "",
  format: formatCardCvc,
  parse: parseCardCvc,
};

export function useCardCvcFormat(
  options: UseCardCvcFormatOptions
): React.RefCallback<HTMLInputElement> {
  return useDigitFormat(cardCvcKind, options);
}
