import type { MaskPreset } from "./types";

const DIGIT = /[0-9]/;

export const azPhone: MaskPreset = {
  mask: ["+", "9", "9", "4", " ", "(", /[1-9]/, DIGIT, ")", " ", DIGIT, DIGIT, DIGIT, "-", DIGIT, DIGIT, "-", DIGIT, DIGIT],
  maskPlaceholder: "_"
};

export const azFin: MaskPreset = {
  mask: "*******",
  maskPlaceholder: "_",
  transform: (char: string) => (char.toUpperCase() === "O" ? "0" : char.toUpperCase())
};

export const azVoen: MaskPreset = {
  mask: "9999999999",
  maskPlaceholder: "_"
};

export const azIban: MaskPreset = {
  mask: "AZ99 aaaa **** **** **** **** ****",
  maskPlaceholder: "_",
  transform: "uppercase"
};

export const azPlate: MaskPreset = {
  mask: "99-aa-999",
  maskPlaceholder: "_",
  transform: "uppercase"
};

export const azPostal: MaskPreset = {
  mask: "AZ9999",
  maskPlaceholder: "_"
};

export const azPassport: MaskPreset = {
  mask: "a99999999",
  maskPlaceholder: "_",
  transform: "uppercase"
};
