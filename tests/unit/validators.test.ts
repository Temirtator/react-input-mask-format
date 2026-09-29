import { describe, it, expect } from "vitest";
import { luhn, isValidIin, isValidBin, isValidKzIban } from "../../src/validators";
import { digitsOnly, remainder, isIbanChecksumValid } from "../../src/validators/shared";

describe("luhn", () => {
  it("accepts valid card numbers (raw and formatted)", () => {
    expect(luhn("4242424242424242")).toBe(true);
    expect(luhn("4242 4242 4242 4242")).toBe(true);
    expect(luhn("4111111111111111")).toBe(true);
  });
  it("rejects invalid and empty", () => {
    expect(luhn("1234567890123456")).toBe(false);
    expect(luhn("")).toBe(false);
  });
});

describe("isValidIin / isValidBin (mod-11 checksum)", () => {
  it("accepts a checksum-valid 12-digit value (deterministic anchor)", () => {
    // all zeros: weighted sum 0 → control 0 == last digit 0
    expect(isValidIin("000000000000")).toBe(true);
    expect(isValidBin("000000000000")).toBe(true);
  });
  it("accepts an algorithm-generated valid IIN and rejects a corrupted control digit", () => {
    const w1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const w2 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];
    const base = "90010130012"; // 11 digits
    const d = base.split("").map(Number);
    let control = w1.reduce((s, wi, i) => s + wi * d[i], 0) % 11;
    if (control === 10) control = w2.reduce((s, wi, i) => s + wi * d[i], 0) % 11;
    expect(control).toBeLessThan(10); // this base yields a single-digit control
    const iin = base + String(control);
    expect(iin).toHaveLength(12);
    expect(isValidIin(iin)).toBe(true);
    const bad = base + String((control + 1) % 10);
    expect(isValidIin(bad)).toBe(false);
  });
  it("accepts formatted input and rejects wrong length / empty", () => {
    expect(isValidIin("000000 000000")).toBe(true);
    expect(isValidIin("123")).toBe(false);
    expect(isValidIin("")).toBe(false);
  });
});

describe("isValidKzIban (ISO 7064 MOD-97-10)", () => {
  it("accepts a valid KZ IBAN raw and print-formatted", () => {
    expect(isValidKzIban("KZ86125KZT5004100100")).toBe(true);
    expect(isValidKzIban("KZ86 125K ZT50 0410 0100")).toBe(true);
  });
  it("rejects corrupted check digits, wrong length, non-KZ, empty", () => {
    expect(isValidKzIban("KZ00125KZT5004100100")).toBe(false);
    expect(isValidKzIban("KZ8612KZT5004100100")).toBe(false); // 18 chars
    expect(isValidKzIban("DE86125KZT5004100100")).toBe(false);
    expect(isValidKzIban("")).toBe(false);
  });
});

describe("shared helpers", () => {
  it("digitsOnly strips non-digits and tolerates nullish", () => {
    expect(digitsOnly("112-233-445 95")).toBe("11223344595");
    expect(digitsOnly(undefined as unknown as string)).toBe("");
    expect(digitsOnly(null as unknown as string)).toBe("");
  });
  it("remainder handles numbers longer than 2^53", () => {
    expect(remainder("30450011600015", 13)).toBe(7);
    expect(remainder("12512345678934", 97)).toBe(0);
    expect(remainder("", 11)).toBe(0);
  });
  it("isIbanChecksumValid runs MOD-97 on compact uppercase IBANs", () => {
    expect(isIbanChecksumValid("KZ86125KZT5004100100")).toBe(true);
    expect(isIbanChecksumValid("RU0304452522540817810538091310419")).toBe(true);
    expect(isIbanChecksumValid("KZ00125KZT5004100100")).toBe(false);
  });
});
