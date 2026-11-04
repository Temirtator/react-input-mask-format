import type { MaskPreset } from "./types";

const DIGIT = /[0-9]/;

export const amPhone: MaskPreset = {
  inputMode: "tel",
  autoComplete: "tel",
  mask: ["+", "3", "7", "4", " ", "(", /[1-9]/, DIGIT, ")", " ", DIGIT, DIGIT, "-", DIGIT, DIGIT, "-", DIGIT, DIGIT],
  maskPlaceholder: "_"
};

export const amPsn: MaskPreset = {
  inputMode: "numeric",
  mask: "9999999999",
  maskPlaceholder: "_"
};

export const amTin: MaskPreset = {
  inputMode: "numeric",
  mask: "99999999",
  maskPlaceholder: "_"
};

export const amAccount: MaskPreset = {
  inputMode: "numeric",
  mask: "9999999999999999",
  maskPlaceholder: "_"
};

export const amPlate: MaskPreset = {
  mask: "99 aa 999",
  maskPlaceholder: "_",
  transform: "uppercase"
};

export const amPostal: MaskPreset = {
  inputMode: "numeric",
  autoComplete: "postal-code",
  mask: "9999",
  maskPlaceholder: "_"
};

export const amPassport: MaskPreset = {
  mask: "aa9999999",
  maskPlaceholder: "_",
  transform: "uppercase"
};
