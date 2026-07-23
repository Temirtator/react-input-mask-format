import type {
  BeforeMaskedStateChangeFn,
  BeforeMaskedValueChangeFn,
  FormatChars,
  InputState,
  V2MaskOptions
} from "./types";

const warned = new Set<string>();

export function __resetDeprecationWarnings(): void {
  warned.clear();
}

export function warnDeprecatedOnce(prop: string, message: string): void {
  if (process.env.NODE_ENV !== "production" && !warned.has(prop)) {
    warned.add(prop);
    console.warn(`react-input-mask-format: ${message}`);
  }
}

export function resolveMaskPlaceholder(
  maskPlaceholder: string | null | undefined,
  maskChar: string | null | undefined
): string | null | undefined {
  if (maskPlaceholder !== undefined) {
    return maskPlaceholder;
  }
  return maskChar;
}

export function toRegExpFormatChars(
  formatChars: Record<string, string> | undefined
): FormatChars | undefined {
  if (!formatChars) {
    return undefined;
  }
  const result: FormatChars = {};
  for (const key of Object.keys(formatChars)) {
    result[key] = new RegExp(formatChars[key]);
  }
  return result;
}

export function createBeforeMaskedStateChangeAdapter(
  beforeMaskedValueChange: BeforeMaskedValueChangeFn,
  maskOptions: V2MaskOptions
): BeforeMaskedStateChangeFn {
  return ({ previousState, currentState, nextState }) =>
    beforeMaskedValueChange(
      nextState,
      previousState ?? currentState ?? null,
      (nextState as InputState & { enteredString?: string }).enteredString ?? null,
      maskOptions
    );
}
