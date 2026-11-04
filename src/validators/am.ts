import { digitsOnly } from "./shared";

export function isValidAmPsn(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 10) {
    return false;
  }
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const dayOk = (day >= 11 && day <= 41) || (day >= 51 && day <= 81);
  const monthOk = (month >= 1 && month <= 12) || month === 14 || (month >= 21 && month <= 32) || month === 34;
  return dayOk && monthOk && digits.slice(6, 9) !== "000";
}

export function isValidAmTin(value: string): boolean {
  return digitsOnly(value).length === 8;
}

export function isValidAmAccount(value: string): boolean {
  const length = digitsOnly(value).length;
  return length >= 11 && length <= 16;
}
