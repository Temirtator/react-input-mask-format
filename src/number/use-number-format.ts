import { useRef, useCallback } from "react";
import type * as React from "react";
import type { NumberFormatOptions, NumberFormatValues } from "./types";
import { formatCanonical, formatNumber } from "./format-number";
import { parseNumber, digitsBeforeCaret, resolveCaret, readTyped } from "./parse-number";
import { setNativeValue } from "../set-native-value";
import { isInputFocused, setInputSelection } from "../utils/input";
import { warnOnSeparatorCollision } from "./validate";
import { useIsomorphicLayoutEffect } from "../utils/layout-effect";
import { isTestDom } from "../utils/test-dom";
import { toAsciiNumber } from "../utils/ascii-digits";

export interface UseNumberFormatOptions extends NumberFormatOptions {
  onValueChange?: (values: NumberFormatValues) => void;
}

export function useNumberFormat(
  options: UseNumberFormatOptions
): React.RefCallback<HTMLInputElement> {
  warnOnSeparatorCollision(options);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const handlerRef = useRef<((event: Event) => void) | null>(null);
  const shownRef = useRef("");
  const shownOptionsRef = useRef(options);
  const composingRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    const previous = shownOptionsRef.current;
    shownOptionsRef.current = options;
    const el = inputRef.current;
    if (!el || !el.value || composingRef.current || JSON.stringify(previous) === JSON.stringify(options)) return;
    const text = formatCanonical(parseNumber(el.value, previous).value, options);
    if (text !== el.value) {
      const focused = isInputFocused(el);
      const digits = digitsBeforeCaret(el.value, el.selectionStart ?? el.value.length);
      el.value = text;
      shownRef.current = text;
      if (focused) {
        const caret = resolveCaret(parseNumber(text, options), digits, options);
        setInputSelection(el, caret, caret);
      }
    }
  });

  return useCallback((el: HTMLInputElement | null) => {
    if (el) {
      shownRef.current = el.value;
      let dispatching = false;
      let composed = false;
      const handler = (event: Event): void => {
        if (event.type === "compositionstart") {
          composingRef.current = true;
          return;
        }
        if (event.type === "compositionend" || event.type === "blur") {
          if (event.type === "blur" && !composingRef.current) return;
          composingRef.current = false;
          if (el.value === shownRef.current) return;
          run(true);
          composed = true;
          dispatching = true;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          dispatching = false;
          return;
        }
        if (dispatching) return;
        if ((event as InputEvent).isComposing) {
          composingRef.current = true;
          return;
        }
        composingRef.current = false;
        if (composed) {
          composed = false;
          if (el.value === shownRef.current) return;
        }
        const inputType = (event as InputEvent).inputType;
        run(inputType ? inputType.startsWith("insert") : el.value.length > shownRef.current.length);
      };
      const run = (inserted: boolean): void => {
        const opts = optionsRef.current;
        const typed = readTyped(toAsciiNumber(el.value), el.selectionStart ?? el.value.length, opts, inserted);
        const digits = digitsBeforeCaret(typed.raw, typed.caret);
        const values = parseNumber(typed.raw, opts);
        setNativeValue(el, values.formattedValue);
        shownRef.current = values.formattedValue;
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
        if (process.env.NODE_ENV !== "production" && isTestDom()) {
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
      el.addEventListener("compositionstart", handler);
      el.addEventListener("compositionend", handler);
      el.addEventListener("blur", handler);
      handlerRef.current = handler;
      inputRef.current = el;
      // format any initial (defaultValue) content
      if (el.value) {
        setNativeValue(el, formatNumber(el.value, optionsRef.current));
        shownRef.current = el.value;
      }
    } else {
      if (inputRef.current && handlerRef.current) {
        inputRef.current.removeEventListener("input", handlerRef.current);
        inputRef.current.removeEventListener("compositionstart", handlerRef.current);
        inputRef.current.removeEventListener("compositionend", handlerRef.current);
        inputRef.current.removeEventListener("blur", handlerRef.current);
      }
      inputRef.current = null;
      handlerRef.current = null;
    }
  }, []);
}
