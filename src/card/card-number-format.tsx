import type * as React from "react";
import type { CardNumberOptions, CardNumberValues } from "./card-number";
import { cardNumberKind } from "./use-card-number-format";
import { cardInput } from "./card-input";

export interface CardNumberFormatProps
  extends CardNumberOptions,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "defaultValue"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (values: CardNumberValues) => void;
}

export const CardNumberFormat = cardInput<CardNumberOptions, CardNumberValues, CardNumberFormatProps>(
  cardNumberKind,
  "separator",
  "cc-number"
);

CardNumberFormat.displayName = "CardNumberFormat";
