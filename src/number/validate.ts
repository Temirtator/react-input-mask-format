import type { NumberFormatOptions } from "./types";
import { resolveSeparators } from "./format-number";

const warned = new Set<string>();

// Dev-only guard: thousandSeparator and decimalSeparator must differ, or the
// value cannot be parsed correctly. Mirrors src/validate-props.ts's style.
export function warnOnSeparatorCollision(options: NumberFormatOptions): void {
  if (process.env.NODE_ENV === "production") return;
  const { thousand, decimal } = resolveSeparators(options);
  if (thousand && thousand === decimal) {
    if (warned.has(thousand)) return;
    warned.add(thousand);
    console.error(
      `react-input-mask-format: thousandSeparator and decimalSeparator must differ (both are "${thousand}"). The value will not parse correctly.`
    );
  }
}
