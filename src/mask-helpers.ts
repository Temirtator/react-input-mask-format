import MaskUtils from "./core/mask";
import type { FormatChars, Mask } from "./types";

export interface MaskHelperOptions {
  mask: Mask;
  maskPlaceholder?: string | null;
  formatChars?: FormatChars;
}

function maskOf(options: MaskHelperOptions): MaskUtils {
  return new MaskUtils({
    mask: options.mask,
    maskPlaceholder: options.maskPlaceholder === undefined ? "_" : options.maskPlaceholder,
    formatChars: options.formatChars
  });
}

export function formatMask(value: string, options: MaskHelperOptions): string {
  const mask = maskOf(options);
  const formatted = mask.formatValue(String(value ?? ""));
  return mask.isValueEmpty(formatted) ? "" : formatted;
}

export function isMaskComplete(value: string, options: MaskHelperOptions): boolean {
  const mask = maskOf(options);
  return mask.isValueFilled(mask.formatValue(String(value ?? "")));
}
