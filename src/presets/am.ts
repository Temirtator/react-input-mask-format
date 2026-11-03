import type { MaskPreset } from "./types";

const D = /\d/;

export const amPhone: MaskPreset = {
  mask: ["+", "3", "7", "4", " ", "(", /[1-9]/, D, ")", " ", D, D, "-", D, D, "-", D, D],
  maskPlaceholder: "_"
};

export const amPsn: MaskPreset = {
  mask: "9999999999",
  maskPlaceholder: "_"
};

export const amTin: MaskPreset = {
  mask: "99999999",
  maskPlaceholder: "_"
};

export const amAccount: MaskPreset = {
  mask: "9999999999999999",
  maskPlaceholder: "_"
};

export const amPlate: MaskPreset = {
  mask: "99 aa 999",
  maskPlaceholder: "_",
  transform: "uppercase"
};

export const amPostal: MaskPreset = {
  mask: "9999",
  maskPlaceholder: "_"
};

export const amPassport: MaskPreset = {
  mask: "aa9999999",
  maskPlaceholder: "_",
  transform: "uppercase"
};
