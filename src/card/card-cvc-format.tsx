import type React from "react";
import type { CardCvcOptions, CardCvcValues } from "./card-cvc";
import { cardCvcKind } from "./use-card-cvc-format";
import { cardInput } from "./card-input";

export interface CardCvcFormatProps
  extends CardCvcOptions,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string;
  onValueChange?: (values: CardCvcValues) => void;
}

export const CardCvcFormat = cardInput<CardCvcOptions, CardCvcValues, CardCvcFormatProps>(
  cardCvcKind,
  "brand",
  "cc-csc"
);

CardCvcFormat.displayName = "CardCvcFormat";
