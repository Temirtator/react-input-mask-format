function digitsOnly(value: string): string {
  return (value ?? "").replace(/\D/g, "");
}

export function luhn(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length === 0) {
    return false;
  }
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) {
        d -= 9;
      }
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

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
  const rearranged = s.slice(4) + s.slice(0, 4);
  let remainder = 0;
  for (let i = 0; i < rearranged.length; i++) {
    const ch = rearranged[i];
    // A→10 … Z→35, digits stay as-is
    const chunk = ch >= "A" && ch <= "Z" ? String(ch.charCodeAt(0) - 55) : ch;
    for (let j = 0; j < chunk.length; j++) {
      remainder = (remainder * 10 + (chunk.charCodeAt(j) - 48)) % 97;
    }
  }
  return remainder === 1;
}
