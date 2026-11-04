import { digitsOnly, isIbanChecksumValid } from "./shared";

const VOEN_WEIGHTS = [4, 1, 8, 6, 2, 7, 5, 3];

export function isValidAzVoen(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 10) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += Number(digits[i]) * VOEN_WEIGHTS[i];
  }
  const control = sum % 11;
  return control !== 10 && control === Number(digits[8]);
}

export function isValidAzIban(value: string): boolean {
  const s = (value ?? "").replace(/\s+/g, "").toUpperCase();
  if (!/^AZ\d{2}[A-Z]{4}[A-Z0-9]{20}$/.test(s)) {
    return false;
  }
  return isIbanChecksumValid(s);
}

export function isValidAzFin(value: string): boolean {
  const s = (value ?? "").replace(/\s+/g, "").toUpperCase();
  return /^[0-9A-NP-Z]{7}$/.test(s);
}
