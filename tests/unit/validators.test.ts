import { describe, it, expect } from "vitest";
import { luhn, isValidIin, isValidBin, isValidKzIban, isValidRuInn, isValidRuSnils, isValidRuOgrn, isValidRuOgrnip } from "../../src/validators";
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

describe("isValidRuInn", () => {
  it("accepts valid 10-digit (company) and 12-digit (person) INNs", () => {
    expect(isValidRuInn("7707083893")).toBe(true);
    expect(isValidRuInn("7736207543")).toBe(true);
    expect(isValidRuInn("500100732259")).toBe(true);
    expect(isValidRuInn("123456789047")).toBe(true);
    expect(isValidRuInn("7707 083 893")).toBe(true);
  });
  it("rejects wrong check digits, wrong length, empty, nullish", () => {
    expect(isValidRuInn("7707083894")).toBe(false);
    expect(isValidRuInn("123456789037")).toBe(false); // 11th digit wrong
    expect(isValidRuInn("123456789048")).toBe(false); // 12th digit wrong
    expect(isValidRuInn("77070838931")).toBe(false);  // 11 digits
    expect(isValidRuInn("")).toBe(false);
    expect(isValidRuInn(undefined as unknown as string)).toBe(false);
  });
});

describe("isValidRuSnils", () => {
  it("accepts valid SNILS raw and formatted", () => {
    expect(isValidRuSnils("112-233-445 95")).toBe(true); // example from PFR order 323р
    expect(isValidRuSnils("11223344595")).toBe(true);
    expect(isValidRuSnils("087-654-303 00")).toBe(true); // sum 202 → 202 % 101 = 0 → 00
  });
  it("skips the checksum for numbers up to 001-001-998", () => {
    expect(isValidRuSnils("001-001-998 00")).toBe(true);
    expect(isValidRuSnils("001-001-998 77")).toBe(true);
  });
  it("checks from 001-001-999 on", () => {
    // 001-001-999: sum = 0*9+0*8+1*7+0*6+0*5+1*4+9*3+9*2+9*1 = 65 → "65"
    expect(isValidRuSnils("001-001-999 65")).toBe(true);
    expect(isValidRuSnils("001-001-999 00")).toBe(false);
  });
  it("rejects wrong check digits, wrong length, empty, nullish", () => {
    expect(isValidRuSnils("112-233-445 96")).toBe(false);
    expect(isValidRuSnils("112-233-445 9")).toBe(false);
    expect(isValidRuSnils("")).toBe(false);
    expect(isValidRuSnils(null as unknown as string)).toBe(false);
  });
});

describe("isValidRuOgrn / isValidRuOgrnip", () => {
  it("accepts valid OGRN", () => {
    expect(isValidRuOgrn("1027700132195")).toBe(true);
    expect(isValidRuOgrn("1022200525819")).toBe(true);
  });
  it("rejects bad OGRN: check digit, first digit, length", () => {
    expect(isValidRuOgrn("1027700132196")).toBe(false);
    expect(isValidRuOgrn("2027700132195")).toBe(false); // 2 = ГРН record, not OGRN
    expect(isValidRuOgrn("102770013219")).toBe(false);
    expect(isValidRuOgrn("")).toBe(false);
  });
  it("accepts valid OGRNIP including remainder >= 10", () => {
    expect(isValidRuOgrnip("304500116000157")).toBe(true);
    expect(isValidRuOgrnip("385768585948949")).toBe(true);
    expect(isValidRuOgrnip("304500116000050")).toBe(true); // remainder 10 → 0
  });
  it("rejects bad OGRNIP: check digit, first digit, length", () => {
    expect(isValidRuOgrnip("304500116000158")).toBe(false);
    expect(isValidRuOgrnip("404500116000157")).toBe(false);
    expect(isValidRuOgrnip("30450011600015")).toBe(false);
    expect(isValidRuOgrnip(undefined as unknown as string)).toBe(false);
  });
});
