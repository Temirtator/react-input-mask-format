import { digitsOnly, isRealDate } from "./shared";

// Cabinet of Ministers resolution No. 177 (12.04.2022): mod 10 with repeating weights 7-3-1
const PINFL_W = [7, 3, 1, 7, 3, 1, 7, 3, 1, 7, 3, 1, 7];
// first digit = sex + century: 1-2 → 1800s, 3-4 → 1900s, 5-6 → 2000s
const CENTURY_BY_FIRST_DIGIT = [0, 1800, 1800, 1900, 1900, 2000, 2000];

export function isValidUzPinfl(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 14) {
    return false;
  }
  const first = Number(digits[0]);
  if (first < 1 || first > 6) {
    return false;
  }
  const day = Number(digits.slice(1, 3));
  const month = Number(digits.slice(3, 5));
  const year = CENTURY_BY_FIRST_DIGIT[first] + Number(digits.slice(5, 7));
  if (!isRealDate(year, month, day)) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < PINFL_W.length; i++) {
    sum += (digits.charCodeAt(i) - 48) * PINFL_W[i];
  }
  return sum % 10 === Number(digits[13]);
}

// The INN control digit algorithm is not published — length only
export function isValidUzInn(value: string): boolean {
  return digitsOnly(value).length === 9;
}
