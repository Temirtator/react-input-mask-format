import MaskUtils from "./core/mask";
import type { FormatChars, Mask } from "./types";

export function isMaskComplete(
  value: string,
  options: { mask: Mask; maskPlaceholder?: string | null; formatChars?: FormatChars }
): boolean {
  const mask = new MaskUtils({
    mask: options.mask,
    maskPlaceholder: options.maskPlaceholder === undefined ? "_" : options.maskPlaceholder,
    formatChars: options.formatChars
  });
  return mask.isValueFilled(mask.formatValue(String(value ?? "")));
}
