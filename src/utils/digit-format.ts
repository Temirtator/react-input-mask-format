import { useCallback, useLayoutEffect, useReducer, useRef } from "react";
import type React from "react";
import { setNativeValue } from "../set-native-value";
import { isInputFocused, setInputSelection } from "./input";

export interface DigitValues {
  value: string;
  formattedValue: string;
}

export interface DigitFormatKind<O, V extends DigitValues> {
  separator(options: O): string;
  format(raw: string, options: O): string;
  parse(raw: string, options: O): V;
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

const IS_JSDOM =
  typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom");

export function useDigitFormat<O, V extends DigitValues>(
  kind: DigitFormatKind<O, V>,
  options: O & { onValueChange?: (values: V) => void }
): React.RefCallback<HTMLInputElement> {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const handlerRef = useRef<((event: Event) => void) | null>(null);

  return useCallback((el: HTMLInputElement | null) => {
    if (el) {
      let previous = el.value;
      const handler = (): void => {
        const opts = optionsRef.current;
        const separator = kind.separator(opts);
        const caret = el.selectionStart ?? el.value.length;
        const raw = collapseTrailingSeparator(el.value, previous, separator);
        const digits = digitsBeforeCaret(raw, caret);
        const values = kind.parse(raw, opts);
        setNativeValue(el, values.formattedValue);
        previous = values.formattedValue;
        if (isInputFocused(el)) {
          const next = resolveDigitCaret(values.formattedValue, digits, separator);
          setInputSelection(el, next, next);
        }
        // JSDOM-ONLY: resync @testing-library/user-event v14's shadow-value cache.
        // setNativeValue above bypasses React's value tracker; under jsdom that
        // leaves user-event's per-input shadow value stale, corrupting masking from
        // ~the 4th keystroke. A plain (idempotent) reassignment resyncs it.
        // MUST NOT run in a real browser: there, microtasks drain BETWEEN event
        // listeners, so this write would fight React; real browsers read the live
        // DOM and need no resync. onValueChange (below) is called directly, not via
        // React's tracker, so it is unaffected in either environment.
        if (IS_JSDOM) {
          queueMicrotask(() => {
            if (el.value !== values.formattedValue) return;
            el.value = values.formattedValue;
            if (isInputFocused(el)) {
              const c = resolveDigitCaret(values.formattedValue, digits, separator);
              setInputSelection(el, c, c);
            }
          });
        }
        opts.onValueChange?.(values);
      };
      el.addEventListener("input", handler);
      handlerRef.current = handler;
      inputRef.current = el;
      if (el.value) {
        setNativeValue(el, kind.format(el.value, optionsRef.current));
        previous = kind.format(el.value, optionsRef.current);
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
  value: string,
  options: O,
  onValueChange: ((values: V) => void) | undefined,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): {
  ref: (el: HTMLInputElement | null) => void;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
} {
  const innerRef = useRef<HTMLInputElement | null>(null);
  const caretRef = useRef<number | null>(null);
  const lastValuesRef = useRef<V | null>(null);

  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);

  const last = lastValuesRef.current;
  const formatted =
    last !== null && (value === last.value || value === last.formattedValue)
      ? last.formattedValue
      : kind.format(value ?? "", options);

  function onChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const el = event.target;
    const separator = kind.separator(options);
    const caret = el.selectionStart ?? el.value.length;
    const raw = collapseTrailingSeparator(el.value, formatted, separator);
    const digits = digitsBeforeCaret(raw, caret);
    const values = kind.parse(raw, options);
    caretRef.current = resolveDigitCaret(values.formattedValue, digits, separator);
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

  function ref(el: HTMLInputElement | null): void {
    innerRef.current = el;
    if (typeof forwardedRef === "function") forwardedRef(el);
    else if (forwardedRef)
      (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
  }

  return { ref, value: formatted, onChange };
}
