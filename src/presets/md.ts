import type { MaskPreset } from "./types";

const DIGIT = /[0-9]/;

export const mdPhone: MaskPreset = {
  mask: ["+", "3", "7", "3", " ", "(", /[1-9]/, DIGIT, ")", " ", DIGIT, DIGIT, DIGIT, "-", DIGIT, DIGIT, DIGIT],
  maskPlaceholder: "_"
};

export const mdPostal: MaskPreset = {
  mask: "MD-9999",
  maskPlaceholder: "_"
};
