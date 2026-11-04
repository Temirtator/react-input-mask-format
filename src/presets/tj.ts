import type { MaskPreset } from "./types";
import { toLatinLookalike } from "../utils/latin-lookalike";

export const tjPhone: MaskPreset = {
  inputMode: "tel",
  autoComplete: "tel",
  mask: "+\\9\\92 (99) 999-99-99",
  maskPlaceholder: "_"
};

export const tjInn: MaskPreset = {
  inputMode: "numeric",
  mask: "999999999",
  maskPlaceholder: "_"
};

export const tjEin: MaskPreset = {
  inputMode: "numeric",
  mask: "9999999999",
  maskPlaceholder: "_"
};

export const tjAccount: MaskPreset = {
  inputMode: "numeric",
  mask: "99999 999 9 99999999999",
  maskPlaceholder: "_"
};

export const tjBik: MaskPreset = {
  inputMode: "numeric",
  mask: "999999999",
  maskPlaceholder: "_"
};

export const tjPlate: MaskPreset = {
  mask: "9999 aa 99",
  maskPlaceholder: "_",
  transform: toLatinLookalike
};

export const tjPlateCompany: MaskPreset = {
  mask: "999 aa 99",
  maskPlaceholder: "_",
  transform: toLatinLookalike
};

export const tjPostal: MaskPreset = {
  inputMode: "numeric",
  autoComplete: "postal-code",
  mask: "999999",
  maskPlaceholder: "_"
};
