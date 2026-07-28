import React, { forwardRef, useLayoutEffect, useRef } from "react";
import type { NumberFormatOptions, NumberFormatValues } from "./types";
import { formatNumber } from "./format-number";
import { parseNumber, digitsBeforeCaret, resolveCaret } from "./parse-number";
import { isInputFocused, setInputSelection } from "../utils/input";
import { warnOnSeparatorCollision } from "./validate";

export interface NumberFormatProps
  extends NumberFormatOptions,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "prefix"> {
  value?: string | number;
  onValueChange?: (values: NumberFormatValues) => void;
  isAllowed?: (values: NumberFormatValues) => boolean;
}

export const NumberFormat = forwardRef<HTMLInputElement, NumberFormatProps>(function NumberFormat(
  props,
  forwardedRef
) {
  const {
    value = "",
    onValueChange,
    isAllowed,
    thousandSeparator,
    decimalSeparator,
    decimalScale,
    fixedDecimalScale,
    prefix,
    suffix,
    allowNegative,
    allowLeadingZeros,
    ...domProps
  } = props;

  const options: NumberFormatOptions = {
    thousandSeparator,
    decimalSeparator,
    decimalScale,
    fixedDecimalScale,
    prefix,
    suffix,
    allowNegative,
    allowLeadingZeros
  };

  warnOnSeparatorCollision(options);

  const innerRef = useRef<HTMLInputElement | null>(null);
  const caretRef = useRef<number | null>(null);
  const lastFormattedRef = useRef<string>("");

  const formatted = formatNumber(value, options);
  lastFormattedRef.current = formatted;

  function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const el = event.target;
    const caret = el.selectionStart ?? el.value.length;
    const digits = digitsBeforeCaret(el.value, caret);
    const values = parseNumber(el.value, options);

    if (isAllowed && !isAllowed(values)) {
      // Revert: restore the previous formatted value AND put the caret back where
      // it was BEFORE the rejected keystroke. Derive that from how many chars the
      // rejected edit added, not from caretRef (which the layout effect has already
      // nulled by the time the next keystroke fires — that made it always fall back
      // to end-of-string and jump the caret on mid-string edits).
      const typedCaret = el.selectionStart ?? el.value.length;
      const lengthDelta = el.value.length - lastFormattedRef.current.length;
      const revertCaret = Math.max(0, typedCaret - lengthDelta);
      el.value = lastFormattedRef.current;
      if (isInputFocused(el)) setInputSelection(el, revertCaret, revertCaret);
      return;
    }

    caretRef.current = resolveCaret(values, digits, options);
    onValueChange?.(values);
  }

  // After a controlled re-render, restore the caret we computed in onChange
  // (React resets it to the end for controlled inputs).
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
    else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
  }

  return <input {...domProps} ref={setRef} value={formatted} onChange={handleChange} />;
});

NumberFormat.displayName = "NumberFormat";
