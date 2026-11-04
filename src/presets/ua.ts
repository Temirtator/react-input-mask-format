import type { MaskPreset } from "./types";

const DIGIT = /[0-9]/;

export const uaPhone: MaskPreset = {
  mask: ["+", "3", "8", "0", " ", "(", /[1-9]/, DIGIT, ")", " ", DIGIT, DIGIT, DIGIT, "-", DIGIT, DIGIT, "-", DIGIT, DIGIT],
  maskPlaceholder: "_"
};

export const uaPostal: MaskPreset = {
  mask: "99999",
  maskPlaceholder: "_"
};
