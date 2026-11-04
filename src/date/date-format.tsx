import * as React from "react";
import type { DateFormatOptions, DateFormatValues } from "./types";
import { dateKind } from "./use-date-format";
import { useDigitInput } from "../utils/digit-format";
import { component } from "../utils/component";

export interface DateFormatProps
  extends DateFormatOptions,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (values: DateFormatValues) => void;
}

export const DateFormat = /* @__PURE__ */ component<HTMLInputElement, DateFormatProps>("DateFormat", function DateFormat(
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
    onChange,
    domProps
  );
  return <input inputMode="numeric" {...domProps} {...input} />;
});

