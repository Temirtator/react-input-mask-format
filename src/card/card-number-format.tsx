import React, { forwardRef } from "react";
import type { CardNumberOptions, CardNumberValues } from "./card-number";
import { cardNumberKind } from "./use-card-number-format";
import { useDigitInput } from "../utils/digit-format";

export interface CardNumberFormatProps
  extends CardNumberOptions,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string;
  onValueChange?: (values: CardNumberValues) => void;
}

export const CardNumberFormat = forwardRef<HTMLInputElement, CardNumberFormatProps>(
  function CardNumberFormat(props, forwardedRef) {
    const { value = "", onValueChange, separator, ...domProps } = props;
    const input = useDigitInput(cardNumberKind, value, { separator }, onValueChange, forwardedRef);
    return <input inputMode="numeric" autoComplete="cc-number" {...domProps} {...input} />;
  }
);

CardNumberFormat.displayName = "CardNumberFormat";
