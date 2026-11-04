import type { MaskPreset } from "./types";
import { toLatinLookalike } from "../utils/latin-lookalike";

const DIGIT = /[0-9]/;
const PLATE_LETTER = /[ABEIKMHOPCTX]/;

export const byPhone: MaskPreset = {
  inputMode: "tel",
  autoComplete: "tel",
  mask: [
    "+", "3", "7", "5", " ", "(", /[1-57]/, DIGIT, ")", " ",
    DIGIT, DIGIT, DIGIT, "-", DIGIT, DIGIT, "-", DIGIT, DIGIT
  ],
  maskPlaceholder: "_"
};

export const byPersonalId: MaskPreset = {
  mask: "9999999a999aa9",
  maskPlaceholder: "_",
  transform: toLatinLookalike
};

export const byUnp: MaskPreset = {
  mask: [
    /[0-9ABCEHKM]/, /[0-9ABCEHKMOPT]/,
    DIGIT, DIGIT, DIGIT, DIGIT, DIGIT, DIGIT, DIGIT
  ],
  maskPlaceholder: "_",
  transform: toLatinLookalike
};

export const byIban: MaskPreset = {
  mask: "BY99 **** 9999 **** **** **** ****",
  maskPlaceholder: "_",
  transform: "uppercase"
};

export const byPlate: MaskPreset = {
  mask: [
    DIGIT, DIGIT, DIGIT, DIGIT, " ",
    PLATE_LETTER, PLATE_LETTER, "-", /[0-8]/
  ],
  maskPlaceholder: "_",
  transform: toLatinLookalike
};

export const byPostal: MaskPreset = {
  inputMode: "numeric",
  autoComplete: "postal-code",
  mask: "999999",
  maskPlaceholder: "_"
};

export const byPassport: MaskPreset = {
  mask: "aa9999999",
  maskPlaceholder: "_",
  transform: toLatinLookalike
};
