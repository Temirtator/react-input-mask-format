import type { Mask, Transform, FormatChars } from "../types";

export interface MaskPreset {
  mask: Mask;
  maskPlaceholder?: string | null;
  transform?: Transform;
  formatChars?: FormatChars;
}
