import type { MaskPreset } from "./types";
import { toLatinLookalike } from "../utils/latin-lookalike";

export const card: MaskPreset = {
  inputMode: "numeric",
  autoComplete: "cc-number",
  mask: "9999 9999 9999 9999",
  maskPlaceholder: "_"
};

const VIN_SLOT = /[A-HJ-NPR-Z0-9]/;
const VIN_AMBIGUOUS: Record<string, string> = { I: "1", O: "0", Q: "0" };

function vinChar(char: string): string {
  const latin = toLatinLookalike(char);
  return VIN_AMBIGUOUS[latin] ?? latin;
}

export const vin: MaskPreset = {
  mask: [
    VIN_SLOT, VIN_SLOT, VIN_SLOT, VIN_SLOT, VIN_SLOT, VIN_SLOT, VIN_SLOT, VIN_SLOT, VIN_SLOT,
    VIN_SLOT, VIN_SLOT, VIN_SLOT, VIN_SLOT, VIN_SLOT, VIN_SLOT, VIN_SLOT, VIN_SLOT
  ],
  maskPlaceholder: "_",
  transform: vinChar
};

export const iban: MaskPreset = {
  mask: "aa99 **** **** **** **** **** **** **** **",
  maskPlaceholder: null,
  transform: toLatinLookalike
};
