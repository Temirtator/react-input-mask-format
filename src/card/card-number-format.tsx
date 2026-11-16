import type * as React from "react";
import type { CardNumberOptions, CardNumberValues } from "./card-number";
import { cardNumberKind } from "./use-card-number-format";
import { cardInput } from "./card-input";

export interface CardNumberFormatProps
  extends CardNumberOptions,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (values: CardNumberValues) => void;
}

export const CardNumberFormat = /* @__PURE__ */ cardInput<CardNumberOptions, CardNumberValues, CardNumberFormatProps>(
  "CardNumberFormat",
  cardNumberKind,
  "separator",
  "cc-number"
);

