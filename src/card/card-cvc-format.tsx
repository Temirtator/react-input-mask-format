import type * as React from "react";
import type { CardCvcOptions, CardCvcValues } from "./card-cvc";
import { cardCvcKind } from "./use-card-cvc-format";
import { cardInput } from "./card-input";

export interface CardCvcFormatProps
  extends CardCvcOptions,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (values: CardCvcValues) => void;
}

export const CardCvcFormat = /* @__PURE__ */ cardInput<CardCvcOptions, CardCvcValues, CardCvcFormatProps>(
  "CardCvcFormat",
  cardCvcKind,
  "brand",
  "cc-csc"
);

