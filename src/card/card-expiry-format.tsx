import React, { forwardRef } from "react";
import type { CardExpiryOptions, CardExpiryValues } from "./card-expiry";
import { cardExpiryKind } from "./use-card-expiry-format";
import { useDigitInput } from "../utils/digit-format";

export interface CardExpiryFormatProps
  extends CardExpiryOptions,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string;
  onValueChange?: (values: CardExpiryValues) => void;
}

export const CardExpiryFormat = forwardRef<HTMLInputElement, CardExpiryFormatProps>(
  function CardExpiryFormat(props, forwardedRef) {
    const { value = "", onValueChange, separator, ...domProps } = props;
    const input = useDigitInput(cardExpiryKind, value, { separator }, onValueChange, forwardedRef);
    return <input inputMode="numeric" autoComplete="cc-exp" {...domProps} {...input} />;
  }
);

CardExpiryFormat.displayName = "CardExpiryFormat";
