import type { MaskPreset } from "./types";

export const uzPhone: MaskPreset = {
  // "9" is a digit token, so the country code's 9s are escaped
  mask: "+\\9\\98 (99) 999-99-99",
  maskPlaceholder: "_"
};

export const uzPinfl: MaskPreset = {
  mask: "99999999999999",
  maskPlaceholder: "_"
};

export const uzInn: MaskPreset = {
  mask: "999999999",
  maskPlaceholder: "_"
};

export const uzAccount: MaskPreset = {
  // balance account · currency · key · client code · serial
  mask: "99999 999 9 99999999 999",
  maskPlaceholder: "_"
};

export const uzMfo: MaskPreset = {
  mask: "99999",
  maskPlaceholder: "_"
};

export const uzPlate: MaskPreset = {
  // individuals: region · letter · 3 digits · 2 letters
  mask: "99 a 999 aa",
  maskPlaceholder: "_",
  transform: "uppercase"
};

export const uzPlateCompany: MaskPreset = {
  // legal entities: region · 3 digits · 3 letters
  mask: "99 999 aaa",
  maskPlaceholder: "_",
  transform: "uppercase"
};

export const uzPostal: MaskPreset = {
  mask: "999999",
  maskPlaceholder: "_"
};

export const uzPassport: MaskPreset = {
  // passport / ID card: 2-letter series + 7 digits
  mask: "aa9999999",
  maskPlaceholder: "_",
  transform: "uppercase"
};
