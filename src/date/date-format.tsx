import * as React from "react";
import { forwardRef } from "react";
import type { DateFormatOptions, DateFormatValues } from "./types";
import { dateKind } from "./use-date-format";
import { useDigitInput } from "../utils/digit-format";

export interface DateFormatProps
  extends DateFormatOptions,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (values: DateFormatValues) => void;
}

export const DateFormat = forwardRef<HTMLInputElement, DateFormatProps>(function DateFormat(
  props,
  forwardedRef
) {
  const { value, defaultValue, onValueChange, onChange, order, separator, ...domProps } = props;
  const input = useDigitInput(
    dateKind,
    value,
    { order, separator },
    onValueChange,
    forwardedRef,
    defaultValue,
    onChange
  );
  return <input inputMode="numeric" {...domProps} {...input} />;
});

DateFormat.displayName = "DateFormat";
