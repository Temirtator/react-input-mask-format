import type { MaskPreset } from "./types";

const DIGIT = /[0-9]/;

export const gePhone: MaskPreset = {
  mask: ["+", "9", "9", "5", " ", "(", /[1-9]/, DIGIT, DIGIT, ")", " ", DIGIT, DIGIT, "-", DIGIT, DIGIT, "-", DIGIT, DIGIT],
  maskPlaceholder: "_"
};

export const gePostal: MaskPreset = {
  mask: "9999",
  maskPlaceholder: "_"
};
