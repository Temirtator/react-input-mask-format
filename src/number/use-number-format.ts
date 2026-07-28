import { useRef, useCallback } from "react";
import type React from "react";
import type { NumberFormatOptions, NumberFormatValues } from "./types";
import { formatNumber, resolveSeparators } from "./format-number";
import { parseNumber, digitsBeforeCaret, caretAfterReformat } from "./parse-number";
import { setNativeValue } from "../set-native-value";
import { isInputFocused, setInputSelection } from "../utils/input";
import { warnOnSeparatorCollision } from "./validate";

export interface UseNumberFormatOptions extends NumberFormatOptions {
  onValueChange?: (values: NumberFormatValues) => void;
}

const IS_JSDOM =
  typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom");

// caretAfterReformat() is digit-anchored: it places the caret right after the
// Nth digit and has no way to see a trailing decimal separator that has no
// fraction digit after it yet (e.g. "1,234." the instant the user types "."
// before entering any fraction digit) — it lands the caret *before* that
// separator instead of after it. Left uncorrected, the next keystroke is
// inserted ahead of the separator instead of into the fraction (reproducible
// with real DOM caret semantics, not a jsdom artifact). Nudge past the
// separator when it's present verbatim right where the digit-anchored caret
// landed.
function resolveCaret(
  values: NumberFormatValues,
  digitsBefore: number,
  options: NumberFormatOptions
): number {
  const caret = caretAfterReformat(values.formattedValue, digitsBefore);
  if (values.value.endsWith(".")) {
    const { decimal } = resolveSeparators(options);
    if (decimal && values.formattedValue.slice(caret, caret + decimal.length) === decimal) {
      return caret + decimal.length;
    }
  }
  return caret;
}

export function useNumberFormat(
  options: UseNumberFormatOptions
): React.RefCallback<HTMLInputElement> {
  warnOnSeparatorCollision(options);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const handlerRef = useRef<((event: Event) => void) | null>(null);

  return useCallback((el: HTMLInputElement | null) => {
    if (el) {
      const handler = (): void => {
        const opts = optionsRef.current;
        const caret = el.selectionStart ?? el.value.length;
        const digits = digitsBeforeCaret(el.value, caret);
        const values = parseNumber(el.value, opts);
        setNativeValue(el, values.formattedValue);
        if (isInputFocused(el)) {
          const next = resolveCaret(values, digits, opts);
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
              const c = resolveCaret(values, digits, opts);
              setInputSelection(el, c, c);
            }
          });
        }
        opts.onValueChange?.(values);
      };
      el.addEventListener("input", handler);
      handlerRef.current = handler;
      inputRef.current = el;
      // format any initial (defaultValue) content
      if (el.value) {
        setNativeValue(el, formatNumber(el.value, optionsRef.current));
      }
    } else {
      if (inputRef.current && handlerRef.current) {
        inputRef.current.removeEventListener("input", handlerRef.current);
      }
      inputRef.current = null;
      handlerRef.current = null;
    }
  }, []);
}
