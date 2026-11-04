import type { MaskPreset } from "./types";
import { toLatinLookalike } from "../utils/latin-lookalike";

export const tjPhone: MaskPreset = {
  mask: "+\\9\\92 (99) 999-99-99",
  maskPlaceholder: "_"
};

export const tjInn: MaskPreset = {
  mask: "999999999",
  maskPlaceholder: "_"
};

export const tjEin: MaskPreset = {
  mask: "9999999999",
  maskPlaceholder: "_"
};

export const tjAccount: MaskPreset = {
  mask: "99999 999 9 99999999999",
  maskPlaceholder: "_"
};

export const tjBik: MaskPreset = {
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
  mask: "999999",
  maskPlaceholder: "_"
};
