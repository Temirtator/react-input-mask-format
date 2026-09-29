import { digitsOnly, remainder, isIbanChecksumValid } from "./shared";
import { RU_PLATE_LETTERS, toRuPlateChar } from "../utils/ru-plate";

const INN10_W = [2, 4, 10, 3, 5, 9, 4, 6, 8];
const INN12_W1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
const INN12_W2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
const SNILS_W = [9, 8, 7, 6, 5, 4, 3, 2, 1];
// SNILS numbers up to 001-001-998 were issued before the checksum existed
const SNILS_UNCHECKED_MAX = 1001998;

function toDigits(digits: string): number[] {
  return digits.split("").map(c => c.charCodeAt(0) - 48);
}

function weightedSum(d: number[], weights: number[]): number {
  return weights.reduce((sum, w, i) => sum + w * d[i], 0);
}

export function isValidRuInn(value: string): boolean {
  const d = toDigits(digitsOnly(value));
  if (d.length === 10) {
    return weightedSum(d, INN10_W) % 11 % 10 === d[9];
  }
  if (d.length === 12) {
    return (
      weightedSum(d, INN12_W1) % 11 % 10 === d[10] &&
      weightedSum(d, INN12_W2) % 11 % 10 === d[11]
    );
  }
  return false;
}

export function isValidRuSnils(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 11) {
    return false;
  }
  if (Number(digits.slice(0, 9)) <= SNILS_UNCHECKED_MAX) {
    return true;
  }
  const d = toDigits(digits);
  let control = weightedSum(d, SNILS_W) % 101;
  if (control === 100) {
    control = 0;
  }
  return control === d[9] * 10 + d[10];
}

export function isValidRuOgrn(value: string): boolean {
  const digits = digitsOnly(value);
  // 1/5 = OGRN; 2, 6-9 are ГРН record numbers
  if (digits.length !== 13 || (digits[0] !== "1" && digits[0] !== "5")) {
    return false;
  }
  return remainder(digits.slice(0, 12), 11) % 10 === Number(digits[12]);
}

export function isValidRuOgrnip(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 15 || digits[0] !== "3") {
    return false;
  }
  // the check digit is the last digit of the remainder (10-12 → 0-2)
  return remainder(digits.slice(0, 14), 13) % 10 === Number(digits[14]);
}

function compactUpper(value: string): string {
  return (value ?? "").replace(/\s+/g, "").toUpperCase();
}

export function isValidRuKpp(value: string): boolean {
  return /^\d{4}[\dA-Z]{2}\d{3}$/.test(compactUpper(value));
}

export function isValidRuBik(value: string): boolean {
  // 732-P: first digit 0 (direct), 1 (indirect), 2 (CBR client); legacy BIKs start with 04
  return /^[012]\d{8}$/.test(digitsOnly(value));
}

const ACCOUNT_W = [7, 1, 3];

export function isValidRuAccount(account: string, bik: string): boolean {
  const a = digitsOnly(account);
  const b = digitsOnly(bik);
  if (a.length !== 20 || !isValidRuBik(b)) {
    return false;
  }
  // Treasury accounts (03…) carry no control key under CBR order 515: structure only.
  if (a.startsWith("03")) {
    return true;
  }
  // Correspondent accounts (30101…) and single treasury accounts (40102…, ЕКС) are keyed
  // with the RKC prefix "0" + BIK[4..5]; everything else with the last 3 BIK digits.
  const rkcKeyed = a.startsWith("30101") || a.startsWith("40102");
  const prefix = rkcKeyed ? "0" + b.slice(4, 6) : b.slice(6, 9);
  const s = prefix + a;
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    sum += (s.charCodeAt(i) - 48) * ACCOUNT_W[i % 3];
  }
  return sum % 10 === 0;
}

export function isValidRuIban(value: string): boolean {
  const s = compactUpper(value);
  if (s.length !== 33 || !s.startsWith("RU") || !/^[0-9A-Z]+$/.test(s)) {
    return false;
  }
  return isIbanChecksumValid(s);
}

const PLATE_RE = new RegExp(
  `^[${RU_PLATE_LETTERS}](\\d{3})[${RU_PLATE_LETTERS}]{2}(\\d{2}|[1-9]\\d{2})$`
);

export function isValidRuPlate(value: string): boolean {
  const s = (value ?? "").replace(/\s+/g, "").split("").map(toRuPlateChar).join("");
  const m = PLATE_RE.exec(s);
  if (!m) {
    return false;
  }
  // 000 is never issued; region 00 does not exist
  return m[1] !== "000" && Number(m[2]) !== 0;
}
