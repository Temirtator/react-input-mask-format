import { digitsOnly, remainder, isRealDate } from "./shared";

// Structure: type/sex digit (0-5) · DDMMYYYY date · marker · serial · check digit.
// The check digit algorithm is not published, so it is deliberately not verified.
export function isValidKgInn(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 14 || Number(digits[0]) > 5) {
    return false;
  }
  const day = Number(digits.slice(1, 3));
  const month = Number(digits.slice(3, 5));
  const year = Number(digits.slice(5, 9));
  return year >= 1900 && isRealDate(year, month, day);
}

// NBKR instruction No. 3/5: control digits = first 14 digits mod 97, remainder 0 written as 97
export function isValidKgAccount(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 16) {
    return false;
  }
  const r = remainder(digits.slice(0, 14), 97);
  const control = r === 0 ? "97" : (r < 10 ? "0" : "") + r;
  return control === digits.slice(14);
}

// participant 100-999 · branch 001-999
export function isValidKgBik(value: string): boolean {
  const digits = digitsOnly(value);
  return /^[1-9]\d{5}$/.test(digits) && digits.slice(3) !== "000";
}
