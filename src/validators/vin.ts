import { toLatinLookalike } from "../utils/latin-lookalike";

export function isValidVin(value: string): boolean {
  const s = (value ?? "")
    .replace(/\s+/g, "")
    .split("")
    .map(toLatinLookalike)
    .join("");
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(s);
}
