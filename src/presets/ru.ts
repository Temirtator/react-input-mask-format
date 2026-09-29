import type { MaskPreset } from "./types";
import { RU_PLATE_LETTERS, toRuPlateChar } from "../utils/ru-plate";

const DIGIT = /[0-9]/;

export const ruPhone: MaskPreset = {
  // national number starts with 3/4/8/9; 6/7 belong to Kazakhstan
  mask: [
    "+", "7", " ", "(", /[3489]/, DIGIT, DIGIT, ")", " ",
    DIGIT, DIGIT, DIGIT, "-", DIGIT, DIGIT, "-", DIGIT, DIGIT
  ],
  maskPlaceholder: "_"
};

export const ruInnPerson: MaskPreset = {
  mask: "999999999999",
  maskPlaceholder: "_"
};

export const ruInnCompany: MaskPreset = {
  mask: "9999999999",
  maskPlaceholder: "_"
};

export const ruSnils: MaskPreset = {
  mask: "999-999-999 99",
  maskPlaceholder: "_"
};

export const ruOgrn: MaskPreset = {
  mask: "9999999999999",
  maskPlaceholder: "_"
};

export const ruOgrnip: MaskPreset = {
  mask: "999999999999999",
  maskPlaceholder: "_"
};

export const ruKpp: MaskPreset = {
  // positions 5-6 may be Latin A-Z
  mask: "9999**999",
  maskPlaceholder: "_",
  transform: "uppercase"
};

export const ruBik: MaskPreset = {
  mask: "999999999",
  maskPlaceholder: "_"
};

export const ruAccount: MaskPreset = {
  // balance account · currency · check key · branch · account
  mask: "99999 999 9 9999 9999999",
  maskPlaceholder: "_"
};

export const ruIban: MaskPreset = {
  // RU + 2 check + BIK (9) + 5 digits + 15 alnum, grouped by 4
  mask: "RU99 9999 9999 9999 99** **** **** **** *",
  maskPlaceholder: "_",
  transform: "uppercase"
};

const RU_PLATE_LETTER = new RegExp(`[${RU_PLATE_LETTERS}]`);
export const ruPlate: MaskPreset = {
  // letter · 3 digits · 2 letters · region (2 or 3 digits — the 3rd is optional,
  // hence no placeholder; check completeness with isValidRuPlate)
  mask: [
    RU_PLATE_LETTER, " ", DIGIT, DIGIT, DIGIT, " ",
    RU_PLATE_LETTER, RU_PLATE_LETTER, " ", DIGIT, DIGIT, DIGIT
  ],
  maskPlaceholder: null,
  transform: toRuPlateChar
};

export const ruPostal: MaskPreset = {
  mask: "999999",
  maskPlaceholder: "_"
};

export const ruPassport: MaskPreset = {
  // series (4) + number (6), as entered on Gosuslugi
  mask: "9999 999999",
  maskPlaceholder: "_"
};
