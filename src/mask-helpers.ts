import MaskUtils from "./core/mask";
import { resolveTransform } from "./utils/transform";
import type { FormatChars, Mask, Transform } from "./types";

export interface MaskHelperOptions {
  mask: Mask;
  maskPlaceholder?: string | null;
  formatChars?: FormatChars;
  transform?: Transform;
}

function maskOf(options: MaskHelperOptions): MaskUtils {
  return new MaskUtils({
    mask: options.mask,
    maskPlaceholder: options.maskPlaceholder === undefined ? "_" : options.maskPlaceholder,
    formatChars: options.formatChars,
    transform: resolveTransform(options.transform)
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
