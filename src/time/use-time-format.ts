import { useRef, useCallback } from "react";
import type React from "react";
import type { TimeFormatValues } from "./types";
import type { TimeFormatOptions } from "./types";
import { formatTime } from "./format-time";
import { parseTime, digitsBeforeCaret, resolveCaret } from "./parse-time";
import { setNativeValue } from "../set-native-value";
import { isInputFocused, setInputSelection } from "../utils/input";

export interface UseTimeFormatOptions extends TimeFormatOptions {
  onValueChange?: (values: TimeFormatValues) => void;
}

const IS_JSDOM =
  typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom");

export function useTimeFormat(
  options: UseTimeFormatOptions
): React.RefCallback<HTMLInputElement> {
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
        const values = parseTime(el.value, opts);
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
      if (el.value) {
        setNativeValue(el, formatTime(el.value, optionsRef.current));
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
