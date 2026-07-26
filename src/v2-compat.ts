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

export function normalizeFormatChars(
  formatChars: Record<string, RegExp | string> | undefined
): { formatChars: FormatChars | undefined; hasLegacyString: boolean } {
  if (!formatChars) {
    return { formatChars: undefined, hasLegacyString: false };
  }
  const result: FormatChars = {};
  let hasLegacyString = false;
  for (const key of Object.keys(formatChars)) {
    const value = formatChars[key];
    if (typeof value === "string") {
      hasLegacyString = true;
      result[key] = new RegExp(value);
    } else {
      result[key] = value;
    }
  }
  return { formatChars: result, hasLegacyString };
}

export function toRegExpFormatChars(
  formatChars: Record<string, RegExp | string> | undefined
): FormatChars | undefined {
  return normalizeFormatChars(formatChars).formatChars;
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
