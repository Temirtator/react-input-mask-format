import type MaskUtils from "./utils/mask";
import type { BeforeMaskedStateChangeFn, InputState, Selection } from "./types";
import { getInputSelection, setInputSelection, isInputFocused } from "./utils/input";
import { setNativeValue } from "./set-native-value";

export interface MaskControllerOptions {
  alwaysShowMask: boolean;
  beforeMaskedStateChange?: BeforeMaskedStateChangeFn;
}

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
  }

  function handleInput(): void {
    const currentState = getInputState();
    const previousState = getLastInputState();
    let nextState: InputState = maskUtils.processChange(currentState, previousState);
    if (options.beforeMaskedStateChange) {
      nextState = options.beforeMaskedStateChange({ currentState, previousState, nextState });
    }
    setInputState(nextState);
    queueMicrotask(() => {
      if (!input || input.value !== nextState.value) return;
      input.value = nextState.value;
      if (isInputFocused(input) && nextState.selection.start !== null && nextState.selection.end !== null) {
        setInputSelection(input, nextState.selection.start, nextState.selection.end);
      }
    });
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
  }

  function unbind(): void {
    if (input) {
      input.removeEventListener("input", handleInput);
    }
    input = null;
  }

  function update(nextMaskUtils: MaskUtils, nextOptions: MaskControllerOptions): void {
    maskUtils = nextMaskUtils;
    options = nextOptions;
  }

  return { bind, unbind, update };
}
