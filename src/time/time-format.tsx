import React, { forwardRef } from "react";
import type { TimeFormatOptions, TimeFormatValues } from "./types";
import { timeKind } from "./use-time-format";
import { useDigitInput } from "../utils/digit-format";

export interface TimeFormatProps
  extends TimeFormatOptions,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string;
  onValueChange?: (values: TimeFormatValues) => void;
}

export const TimeFormat = forwardRef<HTMLInputElement, TimeFormatProps>(function TimeFormat(
  props,
  forwardedRef
) {
  const { value = "", onValueChange, separator, ...domProps } = props;
  const input = useDigitInput(timeKind, value, { separator }, onValueChange, forwardedRef);
  return <input {...domProps} {...input} />;
});

TimeFormat.displayName = "TimeFormat";
