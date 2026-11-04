import { useRef, useCallback } from "react";
import type * as React from "react";
import type { NumberFormatOptions, NumberFormatValues } from "./types";
import { formatNumber } from "./format-number";
import { parseNumber, digitsBeforeCaret, resolveCaret, readTyped } from "./parse-number";
import { setNativeValue } from "../set-native-value";
import { isInputFocused, setInputSelection } from "../utils/input";
import { warnOnSeparatorCollision } from "./validate";

export interface UseNumberFormatOptions extends NumberFormatOptions {
  onValueChange?: (values: NumberFormatValues) => void;
}

const IS_JSDOM =
  typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom");

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
      let shown = el.value;
      const handler = (event: Event): void => {
        const opts = optionsRef.current;
        const inputType = (event as InputEvent).inputType;
        const typed = readTyped(
          el.value,
          el.selectionStart ?? el.value.length,
          opts,
          inputType ? inputType.startsWith("insert") : el.value.length > shown.length
        );
        const digits = digitsBeforeCaret(typed.raw, typed.caret);
        const values = parseNumber(typed.raw, opts);
        setNativeValue(el, values.formattedValue);
        shown = values.formattedValue;
        if (isInputFocused(el)) {
          const next = resolveCaret(values, digits, opts, typed.separator);
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
              const c = resolveCaret(values, digits, opts, typed.separator);
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
        shown = el.value;
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
