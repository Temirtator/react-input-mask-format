import type { Selection } from "../types";

export function setInputSelection(
  input: HTMLInputElement,
  start: number,
  end?: number
): void {
  if (end === undefined) {
    end = start;
  }
  input.setSelectionRange(start, end);
}

export function getInputSelection(input: HTMLInputElement): Required<Selection> {
  const start = input.selectionStart;
  const end = input.selectionEnd;

  return {
    start,
    end,
    length: (end ?? 0) - (start ?? 0)
  };
}

export function isInputFocused(input: HTMLInputElement): boolean {
  const inputDocument = input.ownerDocument;
  return inputDocument.hasFocus() && inputDocument.activeElement === input;
}
