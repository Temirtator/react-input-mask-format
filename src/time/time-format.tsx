import * as React from "react";
import type { TimeFormatOptions, TimeFormatValues } from "./types";
import { timeKind } from "./use-time-format";
import { useDigitInput } from "../utils/digit-format";
import { component } from "../utils/component";

export interface TimeFormatProps
  extends TimeFormatOptions,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (values: TimeFormatValues) => void;
}

export const TimeFormat = /* @__PURE__ */ component<HTMLInputElement, TimeFormatProps>("TimeFormat", function TimeFormat(
  props,
  forwardedRef
) {
  const { value, defaultValue, onValueChange, onChange, separator, ...domProps } = props;
  const input = useDigitInput(timeKind, value, { separator }, onValueChange, forwardedRef, defaultValue, onChange);
  return <input inputMode="numeric" {...domProps} {...input} />;
});

