import type { MaskPreset } from "./types";

const DIGIT = /[0-9]/;

export const tmPhone: MaskPreset = {
  inputMode: "tel",
  autoComplete: "tel",
  mask: ["+", "9", "9", "3", " ", "(", /[1-7]/, DIGIT, ")", " ", DIGIT, DIGIT, "-", DIGIT, DIGIT, "-", DIGIT, DIGIT],
  maskPlaceholder: "_"
};

export const tmPostal: MaskPreset = {
  inputMode: "numeric",
  autoComplete: "postal-code",
  mask: "999999",
  maskPlaceholder: "_"
};
