import type React from "react";
import type { CardExpiryOptions, CardExpiryValues } from "./card-expiry";
import { cardExpiryKind } from "./use-card-expiry-format";
import { cardInput } from "./card-input";

export interface CardExpiryFormatProps
  extends CardExpiryOptions,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string;
  onValueChange?: (values: CardExpiryValues) => void;
}

export const CardExpiryFormat = cardInput<CardExpiryOptions, CardExpiryValues, CardExpiryFormatProps>(
  cardExpiryKind,
  "separator",
  "cc-exp"
);

CardExpiryFormat.displayName = "CardExpiryFormat";
