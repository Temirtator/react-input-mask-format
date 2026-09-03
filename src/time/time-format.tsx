import React, { forwardRef, useLayoutEffect, useReducer, useRef } from "react";
import type { TimeFormatOptions, TimeFormatValues } from "./types";
import { formatTime } from "./format-time";
import { parseTime, digitsBeforeCaret, resolveCaret } from "./parse-time";
import { isInputFocused, setInputSelection } from "../utils/input";

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
  const options: TimeFormatOptions = { separator };

  const innerRef = useRef<HTMLInputElement | null>(null);
  const caretRef = useRef<number | null>(null);
  const lastValuesRef = useRef<TimeFormatValues | null>(null);

  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);

  const last = lastValuesRef.current;
  const formatted =
    last !== null && (value === last.value || value === last.formattedValue)
      ? last.formattedValue
      : formatTime(value ?? "", options);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const el = event.target;
    const caret = el.selectionStart ?? el.value.length;
    const digits = digitsBeforeCaret(el.value, caret);
    const values = parseTime(el.value, options);
    caretRef.current = resolveCaret(values, digits, options);
    lastValuesRef.current = values;
    forceUpdate();
    onValueChange?.(values);
  }

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (el && caretRef.current !== null && isInputFocused(el)) {
      setInputSelection(el, caretRef.current, caretRef.current);
      caretRef.current = null;
    }
  });

  function setRef(el: HTMLInputElement | null): void {
    innerRef.current = el;
    if (typeof forwardedRef === "function") forwardedRef(el);
    else if (forwardedRef)
      (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
  }

  return <input {...domProps} ref={setRef} value={formatted} onChange={handleChange} />;
});

TimeFormat.displayName = "TimeFormat";
