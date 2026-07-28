export interface NumberFormatOptions {
  /** Group integer digits. `true` → ",". A string sets a custom separator. */
  thousandSeparator?: string | boolean;
  /** Decimal separator. Default ".". */
  decimalSeparator?: string;
  /** Max digits after the decimal separator (truncated, not rounded). */
  decimalScale?: number;
  /** Pad fraction to `decimalScale` with zeros. */
  fixedDecimalScale?: boolean;
  /** Text before the number, e.g. "$ ". */
  prefix?: string;
  /** Text after the number, e.g. " %". */
  suffix?: string;
  /** Allow a leading "-". Default true. */
  allowNegative?: boolean;
  /** Keep leading zeros in the integer part. Default false. */
  allowLeadingZeros?: boolean;
}

export interface NumberFormatValues {
  /** Unformatted numeric string with a "." decimal, e.g. "1234.56". */
  value: string;
  /** What the input shows, e.g. "$ 1,234.56". */
  formattedValue: string;
  /** parseFloat(value); undefined when empty / not a number. */
  floatValue: number | undefined;
}
