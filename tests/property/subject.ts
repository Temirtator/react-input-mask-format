import { resolveMaskConfig } from "../../src/core/config";
import { decideChange, decideFocus } from "../../src/core/decide";
import { validateMaskPlaceholder } from "../../src/validate-props";
import * as presetModule from "../../src/presets";
import { extendedFormatChars } from "../../src/constants";
import type { FormatChars, InputMaskProps, InputState, Mask, Transform } from "../../src/types";

export { extendedFormatChars };
export type { InputState };

export interface MaskSetup {
  mask: Mask;
  maskPlaceholder?: string | null;
  formatChars?: FormatChars;
  transform?: Transform;
}

export interface Subject {
  format(value: string): string;
  formatControlled(value: string, shown: string): string;
  focus(state: InputState): InputState | null;
  change(current: InputState, previous: InputState): InputState;
  isEmpty(value: string): boolean;
  isFilled(value: string): boolean;
}

export function createSubject(setup: MaskSetup): Subject {
  const cfg = resolveMaskConfig(setup);
  const utils = cfg.maskUtils;
  return {
    format: value => utils.formatValue(value),
    formatControlled: (value, shown) => utils.formatControlledValue(value, shown),
    focus: state => decideFocus(cfg, state),
    change: (current, previous) => decideChange(cfg, current, previous),
    isEmpty: value => utils.isValueEmpty(value),
    isFilled: value => utils.isValueFilled(value)
  };
}

export function isValidSetup(setup: MaskSetup): boolean {
  try {
    validateMaskPlaceholder(setup as InputMaskProps);
    return true;
  } catch {
    return false;
  }
}

export const presets: Array<{ name: string; setup: MaskSetup }> = Object.entries(presetModule)
  .filter(([, value]) => typeof value === "object" && value !== null && "mask" in value)
  .map(([name, value]) => ({ name, setup: value as MaskSetup }));
