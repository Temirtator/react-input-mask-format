import type { Mask, Transform, FormatChars } from "../types";

export interface MaskPreset {
  mask: Mask;
  maskPlaceholder?: string | null;
  transform?: Transform;
  formatChars?: FormatChars;
}

// ── Generic (country-agnostic) ───────────────────────────────
export const card: MaskPreset = {
  mask: "9999 9999 9999 9999",
  maskPlaceholder: "_"
};

// ── Kazakhstan ───────────────────────────────────────────────
export const kzPhone: MaskPreset = {
  mask: "+7 (799) 999-99-99",
  maskPlaceholder: "_"
};

export const kzIin: MaskPreset = {
  mask: "999999999999",
  maskPlaceholder: "_"
};

export const kzBin: MaskPreset = {
  mask: "999999999999",
  maskPlaceholder: "_"
};

export const kzIban: MaskPreset = {
  // KZ + 2 check + 3 bank digits + 13 alnum account, grouped by 4
  mask: "KZ99 999* **** **** ****",
  maskPlaceholder: "_",
  transform: "uppercase"
};

const KZ_PLATE_LETTER = /[ABCEHKMNOPTXY]/i;
export const kzPlate: MaskPreset = {
  // 3 digits · 3 letters (Latin look-alikes of Cyrillic) · 2-digit region
  mask: [
    /[0-9]/, /[0-9]/, /[0-9]/, " ",
    KZ_PLATE_LETTER, KZ_PLATE_LETTER, KZ_PLATE_LETTER, " ",
    /[0-9]/, /[0-9]/
  ],
  maskPlaceholder: "_",
  transform: "uppercase"
};

export const kzPostal: MaskPreset = {
  mask: "999999",
  maskPlaceholder: "_"
};
