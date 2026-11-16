import type { MaskPreset } from "./types";
import { kzPhone } from "./kz";
import { ruPhone } from "./ru";
import { uzPhone } from "./uz";
import { kgPhone } from "./kg";
import { byPhone } from "./by";
import { tjPhone } from "./tj";
import { amPhone } from "./am";
import { azPhone } from "./az";
import { gePhone } from "./ge";
import { mdPhone } from "./md";
import { uaPhone } from "./ua";
import { tmPhone } from "./tm";

export type PhoneCountry = "KZ" | "RU" | "UZ" | "KG" | "BY" | "TJ" | "AM" | "AZ" | "GE" | "MD" | "UA" | "TM";

export const phonePresets: Record<PhoneCountry, MaskPreset> = {
  KZ: kzPhone,
  RU: ruPhone,
  UZ: uzPhone,
  KG: kgPhone,
  BY: byPhone,
  TJ: tjPhone,
  AM: amPhone,
  AZ: azPhone,
  GE: gePhone,
  MD: mdPhone,
  UA: uaPhone,
  TM: tmPhone
};

const CODES: Array<[string, PhoneCountry]> = [
  ["373", "MD"], ["374", "AM"], ["375", "BY"], ["380", "UA"], ["992", "TJ"], ["993", "TM"],
  ["994", "AZ"], ["995", "GE"], ["996", "KG"], ["998", "UZ"], ["7", "RU"]
];

export function detectPhoneCountry(value: string): PhoneCountry | undefined {
  const match = /^\s*(?:\+|00)([\d\s().-]*)/.exec(value ?? "");
  const digits = match ? match[1].replace(/\D/g, "") : "";
  const found = CODES.find(([code]) => digits.startsWith(code) && digits.length > code.length);
  return !found ? undefined : found[1] === "RU" && /^7[67]/.test(digits) ? "KZ" : found[1];
}
