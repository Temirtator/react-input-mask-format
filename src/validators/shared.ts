export function digitsOnly(value: string): string {
  return (value ?? "").replace(/\D/g, "");
}

// Remainder of an arbitrary-length digit string (es2019 target: no BigInt literals)
export function remainder(numeric: string, modulus: number): number {
  let r = 0;
  for (let i = 0; i < numeric.length; i++) {
    r = (r * 10 + (numeric.charCodeAt(i) - 48)) % modulus;
  }
  return r;
}

// ISO 7064 MOD-97-10; expects a compact uppercase [0-9A-Z]+ string
export function isIbanChecksumValid(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let numeric = "";
  for (let i = 0; i < rearranged.length; i++) {
    const ch = rearranged[i];
    // A→10 … Z→35, digits stay as-is
    numeric += ch >= "A" && ch <= "Z" ? String(ch.charCodeAt(0) - 55) : ch;
  }
  return remainder(numeric, 97) === 1;
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

// Calendar check without the clock (validators must be deterministic)
export function isRealDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}
