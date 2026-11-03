import { isIbanChecksumValid } from "./shared";
import { toLatinLookalike } from "../utils/latin-lookalike";

export function isValidIban(value: string, country?: string): boolean {
  const s = (value ?? "")
    .replace(/\s+/g, "")
    .split("")
    .map(toLatinLookalike)
    .join("");
  return (
    /^[A-Z]{2}\d{2}[0-9A-Z]{11,30}$/.test(s) &&
    !/^..(0[01]|99)/.test(s) &&
    (!country || s.startsWith(country.toUpperCase())) &&
    isIbanChecksumValid(s)
  );
}
