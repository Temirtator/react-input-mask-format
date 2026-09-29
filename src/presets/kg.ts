import type { MaskPreset } from "./types";

const DIGIT = /[0-9]/;

export const kgPhone: MaskPreset = {
  // operator/area codes start with 2-9, so a domestic leading 0 is skipped
  mask: [
    "+", "9", "9", "6", " ", "(", /[2-9]/, DIGIT, DIGIT, ")", " ",
    DIGIT, DIGIT, "-", DIGIT, DIGIT, "-", DIGIT, DIGIT
  ],
  maskPlaceholder: "_"
};

export const kgInnPerson: MaskPreset = {
  mask: "99999999999999",
  maskPlaceholder: "_"
};

export const kgInnCompany: MaskPreset = {
  mask: "99999999999999",
  maskPlaceholder: "_"
};

export const kgAccount: MaskPreset = {
  // bank code (BIK prefix) · account · 2 control digits
  mask: "999 99999999999 99",
  maskPlaceholder: "_"
};

export const kgBik: MaskPreset = {
  mask: "999999",
  maskPlaceholder: "_"
};

export const kgPlate: MaskPreset = {
  // individuals (2016+): region · 3 digits · 3 letters
  mask: "99 999 aaa",
  maskPlaceholder: "_",
  transform: "uppercase"
};

export const kgPlateCompany: MaskPreset = {
  // legal entities: region · 3 digits · 2 letters
  mask: "99 999 aa",
  maskPlaceholder: "_",
  transform: "uppercase"
};

export const kgPostal: MaskPreset = {
  mask: "999999",
  maskPlaceholder: "_"
};

export const kgPassport: MaskPreset = {
  // ID card (ID…) and passports (AN…, PE…): 2-letter series + 7 digits
  mask: "aa9999999",
  maskPlaceholder: "_",
  transform: "uppercase"
};
