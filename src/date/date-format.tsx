import React, { forwardRef } from "react";
import type { DateFormatOptions, DateFormatValues } from "./types";
import { dateKind } from "./use-date-format";
import { useDigitInput } from "../utils/digit-format";

export interface DateFormatProps
  extends DateFormatOptions,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string;
  onValueChange?: (values: DateFormatValues) => void;
}

export const DateFormat = forwardRef<HTMLInputElement, DateFormatProps>(function DateFormat(
  props,
  forwardedRef
) {
  const { value = "", onValueChange, order, separator, ...domProps } = props;
  const input = useDigitInput(dateKind, value, { order, separator }, onValueChange, forwardedRef);
  return <input {...domProps} {...input} />;
});

DateFormat.displayName = "DateFormat";
