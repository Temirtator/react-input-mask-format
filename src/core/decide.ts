import type { InputState, Selection } from "../types";
import type { MaskConfig } from "./config";

export function decideChange(
  cfg: MaskConfig,
  currentState: InputState,
  previousState: InputState
): InputState {
  const nextState: InputState = cfg.maskUtils.processChange(currentState, previousState);
  if (cfg.beforeMaskedStateChange) {
    return cfg.beforeMaskedStateChange({ currentState, previousState, nextState });
  }
  return nextState;
}

export function decideFocus(cfg: MaskConfig, currentState: InputState): InputState | null {
  if (cfg.maskUtils.isValueFilled(currentState.value)) {
    return null;
  }
  const value = cfg.maskUtils.formatValue(currentState.value);
  const nextState: InputState = {
    value,
    selection: cfg.maskUtils.getDefaultSelectionForValue(value)
  };
  if (cfg.beforeMaskedStateChange) {
    return cfg.beforeMaskedStateChange({ currentState, nextState });
  }
  return nextState;
}

export function decideBlur(
  cfg: MaskConfig,
  currentState: InputState,
  lastValue: string
): InputState | null {
  if (cfg.alwaysShowMask || !cfg.maskUtils.isValueEmpty(lastValue)) {
    return null;
  }
  const nextState: InputState = { value: "", selection: { start: null, end: null } };
  if (cfg.beforeMaskedStateChange) {
    return cfg.beforeMaskedStateChange({ currentState, nextState });
  }
  return nextState;
}

export function decideClickSelection(cfg: MaskConfig, lastValue: string): Selection {
  return cfg.maskUtils.getDefaultSelectionForValue(lastValue);
}
