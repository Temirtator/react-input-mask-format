import type { NumberFormatOptions } from "./types";

export interface NumberParts {
  negative: boolean;
  int: string;
  frac: string;
  hasSeparator: boolean;
}

export function resolveSeparators(options: NumberFormatOptions): { thousand: string; decimal: string } {
  const decimal = options.decimalSeparator ?? ".";
  let thousand = "";
  if (options.thousandSeparator === true) thousand = ",";
  else if (typeof options.thousandSeparator === "string") thousand = options.thousandSeparator;
  return { thousand, decimal };
}

function extract(raw: string, decimal: string, options: NumberFormatOptions): NumberParts {
  const allowNegative = options.allowNegative ?? true;
  const negative = allowNegative && raw.indexOf("-") !== -1;

  const sepIndex = decimal ? raw.indexOf(decimal) : -1;
  const hasSeparator = sepIndex !== -1;
  const intRaw = hasSeparator ? raw.slice(0, sepIndex) : raw;
  const fracRaw = hasSeparator ? raw.slice(sepIndex + decimal.length) : "";

  let int = intRaw.replace(/\D/g, "");
  let frac = fracRaw.replace(/\D/g, "");

  if (!(options.allowLeadingZeros ?? false)) {
    int = int.replace(/^0+(?=\d)/, "");
  }
  if (options.decimalScale !== undefined) {
    frac = frac.slice(0, options.decimalScale);
  }
  return { negative, int, frac, hasSeparator };
}

// Tokenize a user-facing formatted string (strips prefix/suffix, uses opts separators).
export function tokenize(rawInput: string, options: NumberFormatOptions): NumberParts {
  const { decimal } = resolveSeparators(options);
  let s = rawInput;
  if (options.prefix && s.startsWith(options.prefix)) s = s.slice(options.prefix.length);
  if (options.suffix && s.endsWith(options.suffix)) s = s.slice(0, s.length - options.suffix.length);
  return extract(s, decimal, options);
}

// Tokenize a canonical numeric string (from a JS number): always "." decimal, no affixes.
function tokenizeCanonical(canonical: string, options: NumberFormatOptions): NumberParts {
  return extract(canonical, ".", options);
}

function group(int: string, thousand: string): string {
  if (!thousand || int.length <= 3) return int;
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
}

export function buildFormatted(parts: NumberParts, options: NumberFormatOptions): string {
  const { thousand, decimal } = resolveSeparators(options);
  const prefix = options.prefix ?? "";
  const suffix = options.suffix ?? "";
  const fixed = options.fixedDecimalScale ?? false;
  const scale = options.decimalScale;

  const hasFrac = parts.frac.length > 0;
  const isEmpty = parts.int === "" && !hasFrac && !parts.hasSeparator;
  if (isEmpty) {
    return parts.negative ? `${prefix}-${suffix}` : "";
  }

  let intDisplay = parts.int;
  if (intDisplay === "" && (hasFrac || parts.hasSeparator)) intDisplay = "0";

  let body = group(intDisplay, thousand);

  if (fixed && scale !== undefined && scale > 0) {
    body += decimal + parts.frac.slice(0, scale).padEnd(scale, "0");
  } else if (hasFrac) {
    body += decimal + parts.frac;
  } else if (parts.hasSeparator) {
    body += decimal; // trailing separator while typing "1."
  }

  return `${prefix}${parts.negative ? "-" : ""}${body}${suffix}`;
}

function numberToString(n: number): string {
  if (!Number.isFinite(n)) return "";
  return String(n);
}

export function formatNumber(input: string | number, options: NumberFormatOptions): string {
  const parts =
    typeof input === "number"
      ? tokenizeCanonical(numberToString(input), options)
      : tokenize(input, options);
  return buildFormatted(parts, options);
}
