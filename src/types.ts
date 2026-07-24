import type * as React from "react";

export type Mask = string | Array<string | RegExp>;

export type Transform =
  | "uppercase"
  | "lowercase"
  | ((char: string, position: number) => string);

export type FormatChars = Record<string, RegExp>;

export interface Selection {
  start: number | null;
  end: number | null;
  length?: number;
}

export interface InputState {
  value: string;
  selection: Selection;
}

export type BeforeMaskedStateChangeFn = (states: {
  previousState?: InputState;
  currentState?: InputState;
  nextState: InputState;
}) => InputState;

/**
 * Legacy (react-input-mask v2) signature for the before-change hook.
 * @deprecated Use BeforeMaskedStateChangeFn with beforeMaskedStateChange.
 */
export type BeforeMaskedValueChangeFn = (
  newState: InputState,
  oldState: InputState | null,
  userInput: string | null,
  maskOptions: V2MaskOptions
) => InputState;

/** Mask options shape passed to the legacy beforeMaskedValueChange callback. */
export interface V2MaskOptions {
  mask?: Mask;
  maskChar: string | null;
  alwaysShowMask: boolean;
  formatChars: Record<string, string>;
  permanents: number[];
}

export interface InputMaskProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "children"> {
  /**
   * Mask format. Either a string (9 = 0-9, a = A-Za-z, * = A-Za-z0-9,
   * backslash escapes) or an array of constant characters and RegExps.
   */
  mask?: Mask;
  /** Character(s) to cover unfilled parts. Default "_", null — empty. */
  maskPlaceholder?: string | null;
  /** Show mask even when input is empty and unfocused. */
  alwaysShowMask?: boolean;
  /** Modify masked value and cursor position before they are applied. */
  beforeMaskedStateChange?: BeforeMaskedStateChangeFn;
  /** Normalize each entered character. "uppercase" | "lowercase" | (char, position) => char. Must be pure. */
  transform?: Transform;
  /** Custom input component. */
  children?: React.ReactElement;
  /** @deprecated Use maskPlaceholder. */
  maskChar?: string | null;
  /** @deprecated Use an array mask or keep for legacy. */
  formatChars?: Record<string, string>;
  /** @deprecated Use beforeMaskedStateChange. */
  beforeMaskedValueChange?: BeforeMaskedValueChangeFn;
}
