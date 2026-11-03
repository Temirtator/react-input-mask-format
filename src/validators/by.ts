import { isIbanChecksumValid } from "./shared";
import { toLatinLookalike } from "../utils/latin-lookalike";

const PERSONAL_ID_WEIGHTS = [7, 3, 1];
const UNP_WEIGHTS = [29, 23, 19, 17, 13, 7, 5, 3];
const UNP_SECOND_LETTERS = "ABCEHKMOPT";

function normalise(value: string): string {
  return (value ?? "")
    .replace(/\s+/g, "")
    .split("")
    .map(toLatinLookalike)
    .join("");
}

export function isValidByPersonalId(value: string): boolean {
  const s = normalise(value);
  if (!/^\d{7}[A-Z]\d{3}[A-Z]{2}\d$/.test(s)) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(s[i], 36) * PERSONAL_ID_WEIGHTS[i % 3];
  }
  return sum % 10 === Number(s[13]);
}

export function isValidByUnp(value: string): boolean {
  const s = normalise(value);
  if (!/^[1-9]\d{8}$|^[ABCEHKM][0-9ABCEHKMOPT]\d{7}$/.test(s)) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    let v: number;
    if (i === 1 && /[A-Z]/.test(s[i])) {
      v = UNP_SECOND_LETTERS.indexOf(s[i]);
    } else {
      v = parseInt(s[i], 36);
    }
    sum += v * UNP_WEIGHTS[i];
  }
  const control = sum % 11;
  return control !== 10 && control === Number(s[8]);
}

export function isValidByIban(value: string): boolean {
  const s = (value ?? "").replace(/\s+/g, "").toUpperCase();
  if (!/^BY\d{2}[A-Z0-9]{4}\d{4}[A-Z0-9]{16}$/.test(s)) {
    return false;
  }
  return isIbanChecksumValid(s);
}
