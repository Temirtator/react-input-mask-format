import type { Selection } from "../types";

let warnedTypes: string[] | undefined;

export function setInputSelection(
  input: HTMLInputElement,
  start: number,
  end?: number
): void {
  if (input.selectionStart === null) {
    if (process.env.NODE_ENV !== "production") {
      warnedTypes = warnedTypes || [];
      if (warnedTypes.indexOf(input.type) === -1) {
        warnedTypes.push(input.type);
        console.error(
          `react-input-mask-format: <input type="${input.type}"> has no text selection, so the value cannot be masked. ` +
            'Use type="text", or type="tel" with inputMode="numeric" for a digit keypad.'
        );
      }
    }
    return;
  }
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
  const root = input.getRootNode() as Document | ShadowRoot;
  return input.ownerDocument.hasFocus() && root.activeElement === input;
}
