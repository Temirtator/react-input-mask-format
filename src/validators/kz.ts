import { digitsOnly, isIbanChecksumValid } from "./shared";

const IIN_W1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const IIN_W2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];

function iinBinChecksum(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length !== 12) {
    return false;
  }
  const d = digits.split("").map(c => c.charCodeAt(0) - 48);
  const weighted = (w: number[]): number =>
    w.reduce((sum, wi, i) => sum + wi * d[i], 0) % 11;
  let control = weighted(IIN_W1);
  if (control === 10) {
    control = weighted(IIN_W2);
    if (control === 10) {
      return false;
    }
  }
  return control === d[11];
}

export function isValidIin(value: string): boolean {
  return iinBinChecksum(value);
}

export function isValidBin(value: string): boolean {
  return iinBinChecksum(value);
}

export function isValidKzIban(value: string): boolean {
  const s = (value ?? "").replace(/\s+/g, "").toUpperCase();
  if (s.length !== 20 || !s.startsWith("KZ") || !/^[0-9A-Z]+$/.test(s)) {
    return false;
  }
  return isIbanChecksumValid(s);
}
