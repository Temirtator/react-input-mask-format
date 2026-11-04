import type { MaskPreset } from "./types";

const DIGIT = /[0-9]/;

export const mdPhone: MaskPreset = {
  inputMode: "tel",
  autoComplete: "tel",
  mask: ["+", "3", "7", "3", " ", "(", /[1-9]/, DIGIT, ")", " ", DIGIT, DIGIT, DIGIT, "-", DIGIT, DIGIT, DIGIT],
  maskPlaceholder: "_"
};

export const mdPostal: MaskPreset = {
  inputMode: "numeric",
  autoComplete: "postal-code",
  mask: "MD-9999",
  maskPlaceholder: "_"
};
