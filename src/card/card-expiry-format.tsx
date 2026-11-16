import type * as React from "react";
import type { CardExpiryOptions, CardExpiryValues } from "./card-expiry";
import { cardExpiryKind } from "./use-card-expiry-format";
import { cardInput } from "./card-input";

export interface CardExpiryFormatProps
  extends CardExpiryOptions,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (values: CardExpiryValues) => void;
}

export const CardExpiryFormat = /* @__PURE__ */ cardInput<CardExpiryOptions, CardExpiryValues, CardExpiryFormatProps>(
  "CardExpiryFormat",
  cardExpiryKind,
  "separator",
  "cc-exp"
);

