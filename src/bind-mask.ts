import type MaskUtils from "./utils/mask";
import type { BeforeMaskedStateChangeFn, InputState, Selection } from "./types";
import { getInputSelection, setInputSelection, isInputFocused } from "./utils/input";
import { setNativeValue } from "./set-native-value";
import { getElementDocument } from "./utils/helpers";
import { defer } from "./utils/defer";

export interface MaskControllerOptions {
  alwaysShowMask: boolean;
  beforeMaskedStateChange?: BeforeMaskedStateChangeFn;
}

const IS_JSDOM =
  typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom");

export interface MaskController {
  bind(input: HTMLInputElement): void;
  unbind(): void;
  update(maskUtils: MaskUtils, options: MaskControllerOptions): void;
}

export function createMaskController(
  maskUtils: MaskUtils,
  options: MaskControllerOptions
): MaskController {
  let input: HTMLInputElement | null = null;
  let lastValue = "";
  let lastSelection: Selection = { start: null, end: null };

  function getInputState(): InputState {
    return { value: input!.value, selection: getInputSelection(input!) };
  }
  function getLastInputState(): InputState {
    return { value: lastValue, selection: lastSelection };
  }
  function setInputState({ value, selection }: InputState): void {
    setNativeValue(input!, value);
    lastValue = value;
    if (input && isInputFocused(input) && selection.start !== null && selection.end !== null) {
      setInputSelection(input, selection.start, selection.end);
      lastSelection = getInputSelection(input);
    } else {
      lastSelection = selection;
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
    const currentState = getInputState();
    const previousState = getLastInputState();
    let nextState: InputState = maskUtils.processChange(currentState, previousState);
    if (options.beforeMaskedStateChange) {
      nextState = options.beforeMaskedStateChange({ currentState, previousState, nextState });
    }
    setInputState(nextState);
  }

  function handleFocus(): void {
    const currentValue = getInputState().value;
    if (!maskUtils.isValueFilled(currentValue)) {
      let newValue = maskUtils.formatValue(currentValue);
      let newSelection = maskUtils.getDefaultSelectionForValue(newValue);
      let nextState: InputState = { value: newValue, selection: newSelection };
      if (options.beforeMaskedStateChange) {
        nextState = options.beforeMaskedStateChange({ currentState: getInputState(), nextState });
      }
      setInputState(nextState);
      // Chrome resets selection after focus; restore on next frame.
      defer(() => {
        if (input && isInputFocused(input)) {
          setInputSelection(input, lastSelection.start!, lastSelection.end!);
        }
      });
    }
  }

  function handleBlur(): void {
    const lastValueOnBlur = getLastInputState().value;
    if (!options.alwaysShowMask && maskUtils.isValueEmpty(lastValueOnBlur)) {
      let nextState: InputState = { value: "", selection: { start: null, end: null } };
      if (options.beforeMaskedStateChange) {
        nextState = options.beforeMaskedStateChange({ currentState: getInputState(), nextState });
      }
      setInputState(nextState);
    }
  }

  function handleMouseDown(event: MouseEvent): void {
    if (!input) return;
    const { value } = getInputState();
    const inputDocument = getElementDocument(input);
    if (!isInputFocused(input) && !maskUtils.isValueFilled(value)) {
      const mouseDownX = event.clientX;
      const mouseDownY = event.clientY;
      const mouseDownTime = new Date().getTime();
      const mouseUpHandler = (mouseUpEvent: MouseEvent): void => {
        inputDocument!.removeEventListener("mouseup", mouseUpHandler);
        if (!input || !isInputFocused(input)) return;
        const deltaX = Math.abs(mouseUpEvent.clientX - mouseDownX);
        const deltaY = Math.abs(mouseUpEvent.clientY - mouseDownY);
        const axisDelta = Math.max(deltaX, deltaY);
        const timeDelta = new Date().getTime() - mouseDownTime;
        if ((axisDelta <= 10 && timeDelta <= 200) || (axisDelta <= 5 && timeDelta <= 300)) {
          const newSelection = maskUtils.getDefaultSelectionForValue(lastValue);
          if (newSelection.start !== null && newSelection.end !== null) {
            setInputSelection(input, newSelection.start, newSelection.end);
            lastSelection = getInputSelection(input);
          }
        }
      };
      inputDocument!.addEventListener("mouseup", mouseUpHandler);
    }
  }

  function bind(el: HTMLInputElement): void {
    input = el;
    // Format any pre-existing (defaultValue) content.
    lastValue = el.value;
    lastSelection = getInputSelection(el);
    const formatted = maskUtils.formatValue(el.value);
    if (!maskUtils.isValueEmpty(formatted) || options.alwaysShowMask) {
      setNativeValue(el, formatted);
      lastValue = formatted;
    }
    el.addEventListener("input", handleInput);
    el.addEventListener("focus", handleFocus);
    el.addEventListener("blur", handleBlur);
    el.addEventListener("mousedown", handleMouseDown);
  }

  function unbind(): void {
    if (input) {
      input.removeEventListener("input", handleInput);
      input.removeEventListener("focus", handleFocus);
      input.removeEventListener("blur", handleBlur);
      input.removeEventListener("mousedown", handleMouseDown);
    }
    input = null;
  }

  function update(nextMaskUtils: MaskUtils, nextOptions: MaskControllerOptions): void {
    maskUtils = nextMaskUtils;
    options = nextOptions;
  }

  return { bind, unbind, update };
}
