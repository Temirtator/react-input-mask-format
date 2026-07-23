import type * as React from "react";

export type Mask = string | Array<string | RegExp>;

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
  /** Custom input component. */
  children?: React.ReactElement;
}
