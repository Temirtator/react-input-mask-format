import { digitsOnly, remainder } from "./shared";

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
