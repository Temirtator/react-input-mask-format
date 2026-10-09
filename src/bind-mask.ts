import type { MaskConfig } from "./core/config";
import { decideChange, decideFocus, decideBlur, decideClickSelection } from "./core/decide";
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
      const resyncSelection = selection;
      queueMicrotask(() => {
        if (!input || input.value !== resyncValue) return;
        input.value = resyncValue;
        if (isInputFocused(input) && resyncSelection.start !== null && resyncSelection.end !== null) {
          setInputSelection(input, resyncSelection.start, resyncSelection.end);
        }
      });
    }
  }

  function handleInput(): void {
    setInputState(decideChange(config, getInputState(), getLastInputState()));
  }

  function handleFocus(): void {
    tracker.start();
    const nextState = decideFocus(config, getInputState());
    if (nextState) {
      setInputState(nextState);
      defer(() => {
        if (input && isInputFocused(input)) {
          tracker.set(tracker.getLast());
        }
      });
    }
  }

  function handleBlur(): void {
    tracker.stop();
    const nextState = decideBlur(config, getInputState(), lastValue);
    if (nextState) {
      setInputState(nextState);
    }
  }

  function handleMouseDown(event: MouseEvent): void {
    if (!input) return;
    const { value } = getInputState();
    if (!isInputFocused(input) && !config.maskUtils.isValueFilled(value)) {
      watchClick(input, event, () => {
        tracker.set(decideClickSelection(config, lastValue));
      });
    }
  }

  function bind(el: HTMLInputElement): void {
    input = el;
    lastValue = el.value;
    const formatted = config.maskUtils.formatValue(el.value);
    if (!config.maskUtils.isValueEmpty(formatted) || config.alwaysShowMask) {
      setNativeValue(el, formatted);
      lastValue = formatted;
    }
    el.addEventListener("input", handleInput);
    el.addEventListener("focus", handleFocus);
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
      input.removeEventListener("focus", handleFocus);
      input.removeEventListener("blur", handleBlur);
      input.removeEventListener("mousedown", handleMouseDown);
    }
    input = null;
  }

  function update(nextConfig: MaskConfig): void {
    config = nextConfig;
  }

  return { bind, unbind, update };
}
