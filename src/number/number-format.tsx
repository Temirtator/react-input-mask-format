import * as React from "react";
import { useEffect, useReducer, useRef } from "react";
import type { NumberFormatOptions, NumberFormatValues } from "./types";
import { formatNumber, formatCanonical } from "./format-number";
import { parseNumber, digitsBeforeCaret, resolveCaret, readTyped } from "./parse-number";
import { isInputFocused, setInputSelection } from "../utils/input";
import { warnOnSeparatorCollision } from "./validate";
import { useIsomorphicLayoutEffect } from "../utils/layout-effect";
import { component } from "../utils/component";
import { toAsciiDigits } from "../utils/ascii-digits";

export interface NumberFormatProps
  extends NumberFormatOptions,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "prefix"> {
  value?: string | number;
  defaultValue?: string | number;
  valueIsNumericString?: boolean;
  onValueChange?: (values: NumberFormatValues) => void;
  isAllowed?: (values: NumberFormatValues) => boolean;
}

export const NumberFormat = /* @__PURE__ */ component<HTMLInputElement, NumberFormatProps>("NumberFormat", function NumberFormat(
  props,
  forwardedRef
) {
  const {
    value: valueProp,
    defaultValue,
    valueIsNumericString,
    onValueChange,
    onChange,
    isAllowed,
    thousandSeparator,
    decimalSeparator,
    allowedDecimalSeparators,
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
    allowedDecimalSeparators,
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
  const lastValuesRef = useRef<NumberFormatValues | null>(null);
  const optionsKeyRef = useRef("");

  // A controlled parent may call onValueChange with a floatValue that is
  // Object.is-equal to its current state (e.g. typing "12." after "12" still
  // parses to 12). React then bails out of re-rendering that parent's
  // subtree entirely — our component never re-renders — and its own
  // controlled-input restoration afterwards resets the DOM's raw value back
  // to the last-committed prop, destroying the in-progress edit before our
  // `formatted` derivation above ever gets a chance to run. Forcing our OWN
  // render here (independent of whatever the parent decides) guarantees a
  // real commit happens with the preserved `formatted` string, so the DOM
  // node's committed value is updated and nothing gets restored away.
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);
  const composingRef = useRef(false);
  const composingTextRef = useRef<string | null>(null);
  const composedRef = useRef(false);

  const controlledRef = useRef(false);
  if (valueProp !== undefined) controlledRef.current = true;
  const uncontrolled = !controlledRef.current;
  const value = uncontrolled ? (defaultValue ?? "") : (valueProp ?? "");

  useEffect(() => {
    const form = innerRef.current && innerRef.current.form;
    if (!form) return;
    const root = form.getRootNode();
    const reset = (event: Event): void => {
      if (event.target === form && !event.defaultPrevented && !controlledRef.current) {
        lastValuesRef.current = null;
        forceUpdate();
      }
    };
    root.addEventListener("reset", reset);
    return () => root.removeEventListener("reset", reset);
  });

  // Controlled display: normally derive the shown string from the `value` prop.
  // BUT when the prop is numerically equal to the values we last emitted via
  // onValueChange (the consumer echoing back e.g. floatValue), keep the exact
  // in-progress formatted string — otherwise a trailing decimal separator or
  // trailing zeros the user is mid-typing get destroyed by the lossy number
  // round-trip (e.g. "12." -> 12 -> "12", eating the ".").
  const numeric = typeof value === "number" || !!valueIsNumericString;
  const propFloatValue =
    typeof value === "number"
      ? value
      : numeric
        ? value === "" ? undefined : parseFloat(value)
        : parseNumber(String(value ?? ""), options).floatValue;
  const optionsKey = JSON.stringify(options);
  if (optionsKeyRef.current !== optionsKey) {
    optionsKeyRef.current = optionsKey;
    const previous = lastValuesRef.current;
    if (previous) {
      lastValuesRef.current = { ...previous, formattedValue: formatCanonical(previous.value, options) };
    }
  }
  const last = lastValuesRef.current;
  const formatted =
    last !== null && (uncontrolled || propFloatValue === last.floatValue || value === last.value)
      ? last.formattedValue
      : typeof value === "string" && numeric
        ? formatCanonical(value, options)
        : formatNumber(value ?? "", options);
  lastFormattedRef.current = formatted;

  function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const el = event.target;
    if ((event.nativeEvent as InputEvent).isComposing) {
      composingRef.current = true;
      composingTextRef.current = el.value;
      forceUpdate();
      return;
    }
    composingRef.current = false;
    composingTextRef.current = null;
    if (composedRef.current) {
      composedRef.current = false;
      if (el.value === lastFormattedRef.current) return;
    }
    const inputType = (event.nativeEvent as InputEvent).inputType;
    apply(event, inputType ? inputType.startsWith("insert") : el.value.length > lastFormattedRef.current.length);
  }

  function handleCompositionStart(event: React.CompositionEvent<HTMLInputElement>): void {
    composingRef.current = true;
    domProps.onCompositionStart?.(event);
  }

  function endComposition(event: React.SyntheticEvent<HTMLInputElement>): void {
    composingRef.current = false;
    composingTextRef.current = null;
    if (event.currentTarget.value !== lastFormattedRef.current) {
      composedRef.current = true;
      apply(event, true);
    }
    forceUpdate();
  }

  function handleCompositionEnd(event: React.CompositionEvent<HTMLInputElement>): void {
    endComposition(event);
    domProps.onCompositionEnd?.(event);
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>): void {
    if (composingRef.current) endComposition(event);
    domProps.onBlur?.(event);
  }

  function apply(event: React.SyntheticEvent<HTMLInputElement>, inserted: boolean): void {
    const el = event.currentTarget;
    const typed = readTyped(toAsciiDigits(el.value), el.selectionStart ?? el.value.length, options, inserted);
    const digits = digitsBeforeCaret(typed.raw, typed.caret);
    const values = parseNumber(typed.raw, options);

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

    caretRef.current = resolveCaret(values, digits, options, typed.separator);
    lastValuesRef.current = values;
    forceUpdate();
    onValueChange?.(values);
    if (onChange) {
      el.value = values.formattedValue;
      onChange(event as React.ChangeEvent<HTMLInputElement>);
    }
  }

  // After a controlled re-render, restore the caret we computed in onChange
  // (React resets it to the end for controlled inputs).
  useIsomorphicLayoutEffect(() => {
    const el = innerRef.current;
    if (el && caretRef.current !== null && isInputFocused(el)) {
      setInputSelection(el, caretRef.current, caretRef.current);
      caretRef.current = null;
    }
    if (
      el &&
      uncontrolled &&
      !composingRef.current &&
      caretRef.current === null &&
      el.value !== lastFormattedRef.current &&
      el.selectionStart !== null
    ) {
      const adopted = parseNumber(el.value, options);
      if (adopted.formattedValue !== lastFormattedRef.current) {
        lastValuesRef.current = adopted;
        forceUpdate();
      }
    }
  });

  function setRef(el: HTMLInputElement | null): void {
    innerRef.current = el;
    if (typeof forwardedRef === "function") forwardedRef(el);
    else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
  }

  return (
    <input
      {...domProps}
      ref={setRef}
      value={composingTextRef.current ?? formatted}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onBlur={handleBlur}
    />
  );
});

