import type { MaskConfig } from "./core/config";
import { decideChange, decideFocus, decideBlur, decideClickSelection, decideUpdate, formatDefaultValue } from "./core/decide";
import { createSelectionTracker } from "./core/selection-tracker";
import { watchClick } from "./core/click-tracker";
import type { InputState } from "./types";
import { getInputSelection, setInputSelection, isInputFocused } from "./utils/input";
import { setNativeValue } from "./set-native-value";
import { defer } from "./utils/defer";

const IS_JSDOM =
  typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom");

export interface MaskController {
  bind(input: HTMLInputElement): void;
  unbind(): void;
  update(config: MaskConfig): void;
}

export function createMaskController(config: MaskConfig): MaskController {
  let input: HTMLInputElement | null = null;
  let lastValue = "";
  let form: HTMLFormElement | null = null;
  const tracker = createSelectionTracker(() => input);

  function getInputState(): InputState {
    return { value: input!.value, selection: getInputSelection(input!) };
  }
  function getLastInputState(): InputState {
    return { value: lastValue, selection: tracker.getLast() };
  }
  function setInputState({ value, selection }: InputState): void {
    setNativeValue(input!, value);
    lastValue = value;
    if (selection.start !== null && selection.end !== null) {
      tracker.set(selection);
    }
    // JSDOM-ONLY: resync @testing-library/user-event v14's shadow-value cache.
    // setNativeValue() above bypasses React's value tracker so the consumer's
    // onChange fires with the masked value on the same bubbling event. That same
    // bypass leaves user-event's per-input shadow value stale, corrupting masking
    // from the 3rd keystroke — so under jsdom we resync it with a plain reassignment.
    // This MUST NOT run in a real browser: there, microtasks drain BETWEEN event
    // listeners, so this plain write would re-sync React's tracker before React's
    // delegated onChange listener runs, permanently suppressing onChange (verified
    // by the real-Chrome e2e). Real browsers read the live DOM value and need no
    // resync, so the gate is correct, not a workaround-hiding hack.
    if (IS_JSDOM) {
      const resyncValue = value;
      queueMicrotask(() => {
        if (!input || input.value !== resyncValue) return;
        const { start, end } = getInputSelection(input);
        input.value = resyncValue;
        if (isInputFocused(input) && start !== null && end !== null) {
          setInputSelection(input, start, end);
        }
      });
    }
  }

  function isMasked(): boolean {
    return !!config.maskUtils.maskOptions.mask;
  }

  function handleInput(): void {
    if (isMasked()) {
      setInputState(decideChange(config, getInputState(), getLastInputState()));
    } else {
      lastValue = input!.value;
    }
  }

  function handleFocus(): void {
    tracker.start();
    const nextState = isMasked() && decideFocus(config, getInputState());
    if (nextState) {
      setInputState(nextState);
      defer(() => {
        if (input && isInputFocused(input)) {
          tracker.set(tracker.getLast());
        }
      });
    } else {
      lastValue = input!.value;
    }
  }

  function watchForm(): void {
    const next = input && input.form;
    if (next !== form) {
      form?.removeEventListener("reset", handleReset);
      form = next;
      form?.addEventListener("reset", handleReset);
    }
  }

  function handleBlur(): void {
    tracker.stop();
    const nextState = isMasked() && decideBlur(config, getInputState(), lastValue);
    if (nextState) {
      setInputState(nextState);
    }
  }

  function handleMouseDown(event: MouseEvent): void {
    if (!input || !isMasked()) return;
    const { value } = getInputState();
    if (!isInputFocused(input) && !config.maskUtils.isValueFilled(value)) {
      watchClick(input, event, () => {
        tracker.set(decideClickSelection(config, lastValue, getInputSelection(input!)));
      });
    }
  }

  function format(): void {
    if (!isMasked()) return;
    const formatted = formatDefaultValue(config, input!.value);
    if (formatted || config.alwaysShowMask) {
      setNativeValue(input!, formatted);
      lastValue = formatted;
    }
  }

  function handleReset(): void {
    defer(() => {
      if (input) {
        lastValue = input.value;
        format();
      }
    });
  }

  function bind(el: HTMLInputElement): void {
    input = el;
    lastValue = el.value;
    watchForm();
    format();
    el.addEventListener("input", handleInput);
    el.addEventListener("focusin", handleFocus);
    el.addEventListener("blur", handleBlur);
    el.addEventListener("mousedown", handleMouseDown);
    if (isInputFocused(el)) {
      tracker.start();
    }
  }

  function unbind(): void {
    tracker.stop();
    if (input) {
      input.removeEventListener("input", handleInput);
      input.removeEventListener("focusin", handleFocus);
      input.removeEventListener("blur", handleBlur);
      input.removeEventListener("mousedown", handleMouseDown);
    }
    input = null;
    watchForm();
  }

  function update(nextConfig: MaskConfig): void {
    const wasMasked = isMasked();
    config = nextConfig;
    watchForm();
    if (input && isMasked()) {
      const nextState = decideUpdate(config, getInputState(), isInputFocused(input), wasMasked);
      if (nextState.value !== input.value || !wasMasked) {
        setInputState(nextState);
      }
    }
  }

  return { bind, unbind, update };
}
