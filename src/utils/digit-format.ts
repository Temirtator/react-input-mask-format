import { useCallback, useEffect, useReducer, useRef } from "react";
import type * as React from "react";
import { setNativeValue } from "../set-native-value";
import { isInputFocused, setInputSelection } from "./input";
import { useIsomorphicLayoutEffect } from "./layout-effect";
import { isTestDom } from "./test-dom";

export interface DigitValues {
  value: string;
  formattedValue: string;
}

export interface DigitFormatKind<O, V extends DigitValues> {
  separator(options: O): string;
  format(raw: string, options: O): string;
  parse(raw: string, options: O, previous: string, digitsBefore: number): V;
}

export function collapseTrailingSeparator(
  raw: string,
  previous: string,
  separator: string
): string {
  if (!separator || !previous.endsWith(separator)) return raw;
  const body = previous.slice(0, -separator.length);
  return raw.length >= body.length && raw.length < previous.length && previous.startsWith(raw)
    ? body.slice(0, -1)
    : raw;
}

export function isSingleKeystroke(previous: string, raw: string): boolean {
  const shortest = Math.min(previous.length, raw.length);
  let prefix = 0;
  while (prefix < shortest && previous[prefix] === raw[prefix]) prefix++;
  let suffix = 0;
  while (
    suffix < shortest - prefix &&
    previous[previous.length - 1 - suffix] === raw[raw.length - 1 - suffix]
  ) {
    suffix++;
  }
  const inserted = raw.slice(prefix, raw.length - suffix);
  return inserted === "" || /^\d$/.test(inserted);
}

export function deleteAcrossSeparator(
  raw: string,
  previous: string,
  caret: number,
  forward: boolean
): { raw: string; caret: number } {
  let start = 0;
  while (start < raw.length && previous[start] === raw[start]) start++;
  const end = start + previous.length - raw.length;
  const digit = forward
    ? end + previous.slice(end).search(/\d/)
    : previous.slice(0, start).search(/\d\D*$/);
  return end > start &&
    /\d/.test(previous[digit]) &&
    !/\d/.test(previous.slice(start, end)) &&
    previous.slice(0, start) + previous.slice(end) === raw
    ? { raw: previous.slice(0, digit) + previous.slice(digit + 1), caret: forward ? start : digit }
    : { raw, caret };
}

export function digitsBeforeCaret(value: string, caret: number): number {
  let count = 0;
  for (let i = 0; i < caret && i < value.length; i++) {
    if (value[i] >= "0" && value[i] <= "9") count++;
  }
  return count;
}

function caretAfterDigits(formatted: string, digitsBefore: number): number {
  if (digitsBefore <= 0) {
    const first = formatted.search(/\d/);
    return first === -1 ? formatted.length : first;
  }
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] >= "0" && formatted[i] <= "9") {
      seen++;
      if (seen === digitsBefore) return i + 1;
    }
  }
  return formatted.length;
}

export function resolveDigitCaret(
  formattedValue: string,
  digitsBefore: number,
  separator: string
): number {
  const caret = caretAfterDigits(formattedValue, digitsBefore);
  if (separator && formattedValue.slice(caret, caret + separator.length) === separator) {
    return caret + separator.length;
  }
  return caret;
}

function sameOptions<O>(a: O, b: O): boolean {
  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  return Object.keys(x)
    .concat(Object.keys(y))
    .every((key) => key === "onValueChange" || x[key] === y[key]);
}

function placeCaret(
  el: HTMLInputElement,
  formatted: string,
  atEnd: boolean,
  digits: number,
  separator: string
): void {
  if (isInputFocused(el)) {
    const caret = atEnd ? formatted.length : resolveDigitCaret(formatted, digits, separator);
    setInputSelection(el, caret);
  }
}

export function useDigitFormat<O, V extends DigitValues>(
  kind: DigitFormatKind<O, V>,
  options: O & { onValueChange?: (values: V) => void }
): React.RefCallback<HTMLInputElement> {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const handlerRef = useRef<((event: Event) => void) | null>(null);
  const previousRef = useRef("");
  const appliedRef = useRef(options);

  useIsomorphicLayoutEffect(() => {
    const applied = appliedRef.current;
    appliedRef.current = options;
    const el = inputRef.current;
    if (!el || sameOptions(options, applied)) return;
    const source = kind.parse(el.value, applied, "", 0).value || el.value;
    const values = kind.parse(source, options, "", 0);
    if (values.formattedValue === el.value) return;
    const caret = el.selectionStart ?? el.value.length;
    const atEnd = caret >= el.value.length;
    const digits = digitsBeforeCaret(el.value, caret);
    setNativeValue(el, values.formattedValue);
    previousRef.current = values.formattedValue;
    placeCaret(el, values.formattedValue, atEnd, digits, kind.separator(options));
    options.onValueChange?.(values);
  });

  return useCallback((el: HTMLInputElement | null) => {
    if (el) {
      previousRef.current = el.value;
      const handler = (event: Event): void => {
        const opts = optionsRef.current;
        const separator = kind.separator(opts);
        const previous = previousRef.current;
        const { raw, caret } = deleteAcrossSeparator(
          collapseTrailingSeparator(el.value, previous, separator),
          previous,
          el.selectionStart ?? el.value.length,
          (event as InputEvent).inputType === "deleteContentForward"
        );
        const digits = digitsBeforeCaret(raw, caret);
        const values = kind.parse(raw, opts, previous, digits);
        const atEnd = caret >= el.value.length;
        setNativeValue(el, values.formattedValue);
        previousRef.current = values.formattedValue;
        placeCaret(el, values.formattedValue, atEnd, digits, separator);
        // JSDOM-ONLY: resync @testing-library/user-event v14's shadow-value cache.
        // setNativeValue above bypasses React's value tracker; under jsdom that
        // leaves user-event's per-input shadow value stale, corrupting masking from
        // ~the 4th keystroke. A plain (idempotent) reassignment resyncs it.
        // MUST NOT run in a real browser: there, microtasks drain BETWEEN event
        // listeners, so this write would fight React; real browsers read the live
        // DOM and need no resync. onValueChange (below) is called directly, not via
        // React's tracker, so it is unaffected in either environment.
        if (process.env.NODE_ENV !== "production" && isTestDom()) {
          queueMicrotask(() => {
            if (el.value !== values.formattedValue) return;
            el.value = values.formattedValue;
            placeCaret(el, values.formattedValue, atEnd, digits, separator);
          });
        }
        opts.onValueChange?.(values);
      };
      el.addEventListener("input", handler);
      handlerRef.current = handler;
      inputRef.current = el;
      if (el.value) {
        setNativeValue(el, kind.format(el.value, optionsRef.current));
        previousRef.current = el.value;
      }
    } else {
      if (inputRef.current && handlerRef.current) {
        inputRef.current.removeEventListener("input", handlerRef.current);
      }
      inputRef.current = null;
      handlerRef.current = null;
    }
  }, [kind]);
}

export function useDigitInput<O, V extends DigitValues>(
  kind: DigitFormatKind<O, V>,
  value: string | undefined,
  options: O,
  onValueChange: ((values: V) => void) | undefined,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
  defaultValue?: string,
  onInputChange?: React.ChangeEventHandler<HTMLInputElement>
): {
  ref: (el: HTMLInputElement | null) => void;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
} {
  const innerRef = useRef<HTMLInputElement | null>(null);
  const caretRef = useRef<number | null>(null);
  const lastValuesRef = useRef<V | null>(null);
  const lastOptionsRef = useRef<O>(options);
  const uncontrolledRef = useRef(value === undefined);
  uncontrolledRef.current = value === undefined;

  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const form = innerRef.current && innerRef.current.form;
    if (!form) return;
    const root = form.getRootNode();
    const reset = (event: Event): void => {
      if (event.target === form && !event.defaultPrevented && uncontrolledRef.current) {
        lastValuesRef.current = null;
        forceUpdate();
      }
    };
    root.addEventListener("reset", reset);
    return () => root.removeEventListener("reset", reset);
  });

  const last = lastValuesRef.current;
  const echo =
    last !== null && (value === undefined || value === last.value || value === last.formattedValue);
  const formatted =
    last === null || !echo
      ? kind.format(value ?? defaultValue ?? "", options)
      : sameOptions(options, lastOptionsRef.current)
        ? last.formattedValue
        : kind.format(value || last.value || last.formattedValue, options);
  const shownRef = useRef({ options, text: formatted });

  function onChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const el = event.target;
    const separator = kind.separator(options);
    const { raw, caret } = deleteAcrossSeparator(
      collapseTrailingSeparator(el.value, formatted, separator),
      formatted,
      el.selectionStart ?? el.value.length,
      (event.nativeEvent as InputEvent).inputType === "deleteContentForward"
    );
    const digits = digitsBeforeCaret(raw, caret);
    const values = kind.parse(raw, options, formatted, digits);
    caretRef.current =
      caret >= el.value.length
        ? values.formattedValue.length
        : resolveDigitCaret(values.formattedValue, digits, separator);
    lastValuesRef.current = values;
    lastOptionsRef.current = options;
    forceUpdate();
    onValueChange?.(values);
    if (onInputChange) {
      el.value = values.formattedValue;
      onInputChange(event);
    }
  }

  useIsomorphicLayoutEffect(() => {
    if (!echo) lastValuesRef.current = null;
    const shown = shownRef.current;
    shownRef.current = { options, text: formatted };
    if (!sameOptions(options, shown.options) && formatted !== shown.text) {
      const values = kind.parse(formatted, options, "", 0);
      lastValuesRef.current = values;
      lastOptionsRef.current = options;
      onValueChange?.(values);
    }
    const el = innerRef.current;
    if (el && caretRef.current !== null && isInputFocused(el)) {
      setInputSelection(el, caretRef.current);
      caretRef.current = null;
    }
    if (el && value === undefined && caretRef.current === null && el.value !== formatted && el.selectionStart !== null) {
      const adopted = kind.parse(el.value, options, "", 0);
      if (adopted.formattedValue !== formatted) {
        lastValuesRef.current = adopted;
        lastOptionsRef.current = options;
        forceUpdate();
      }
    }
  });

  function ref(el: HTMLInputElement | null): void {
    innerRef.current = el;
    if (typeof forwardedRef === "function") forwardedRef(el);
    else if (forwardedRef)
      (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
  }

  return { ref, value: formatted, onChange };
}
