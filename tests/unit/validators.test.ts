import { describe, it, expect } from "vitest";
import { luhn, isValidIin, isValidBin, isValidKzIban, isValidRuInn, isValidRuSnils, isValidRuOgrn, isValidRuOgrnip, isValidRuKpp, isValidRuBik, isValidRuAccount, isValidRuIban, isValidRuPlate } from "../../src/validators";
import { digitsOnly, remainder, isIbanChecksumValid, isRealDate } from "../../src/validators/shared";
import { isValidUzPinfl, isValidUzInn, isValidKgInn, isValidKgAccount, isValidKgBik } from "../../src/validators";

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

describe("isValidRuKpp / isValidRuBik (format only)", () => {
  it("KPP: 9 chars, positions 5-6 digit or Latin A-Z", () => {
    expect(isValidRuKpp("770701001")).toBe(true);
    expect(isValidRuKpp("7707AB001")).toBe(true);
    expect(isValidRuKpp("7707ab001")).toBe(true);
    expect(isValidRuKpp("77AB01001")).toBe(false);
    expect(isValidRuKpp("77070100")).toBe(false);
    expect(isValidRuKpp("")).toBe(false);
  });
  it("BIK: 9 digits, first digit 0/1/2", () => {
    expect(isValidRuBik("044525225")).toBe(true);
    expect(isValidRuBik("149805746")).toBe(true);
    expect(isValidRuBik("344525225")).toBe(false);
    expect(isValidRuBik("04452522")).toBe(false);
    expect(isValidRuBik(undefined as unknown as string)).toBe(false);
  });
});

describe("isValidRuAccount (control key with BIK)", () => {
  it("accepts settlement accounts", () => {
    expect(isValidRuAccount("40602810700000000025", "049805746")).toBe(true); // CBR example
    expect(isValidRuAccount("40817810538091310419", "044525225")).toBe(true);
    expect(isValidRuAccount("40817 810 5 3809 1310419", "044525225")).toBe(true);
  });
  it("accepts a correspondent account (30101…) using the RKC prefix", () => {
    expect(isValidRuAccount("30101810400000000225", "044525225")).toBe(true);
  });
  it("accepts treasury single accounts (40102…) keyed with the RKC prefix", () => {
    expect(isValidRuAccount("40102810445370000059", "017003983")).toBe(true);
    expect(isValidRuAccount("40102810545370000003", "004525988")).toBe(true);
  });
  it("accepts treasury accounts (03…) by structure — they carry no control key", () => {
    expect(isValidRuAccount("03100643000000018500", "017003983")).toBe(true);
    expect(isValidRuAccount("03100643000000017300", "004525988")).toBe(true);
    expect(isValidRuAccount("0310064300000001850", "017003983")).toBe(false); // 19 digits
    expect(isValidRuAccount("03100643000000018500", "31700398")).toBe(false); // bad BIK
  });
  it("still rejects a 40102… account with a wrong key", () => {
    expect(isValidRuAccount("40102810445370000058", "017003983")).toBe(false);
  });
  it("rejects wrong key, wrong BIK, bad lengths, empty", () => {
    expect(isValidRuAccount("40602810800000000025", "049805746")).toBe(false);
    expect(isValidRuAccount("40817810538091310419", "044525974")).toBe(false); // other bank's BIK (verified to fail)
    expect(isValidRuAccount("4081781053809131041", "044525225")).toBe(false);
    expect(isValidRuAccount("40817810538091310419", "04452522")).toBe(false);
    expect(isValidRuAccount("", "")).toBe(false);
  });
});

describe("isValidRuIban", () => {
  it("accepts the SWIFT registry example raw and grouped", () => {
    expect(isValidRuIban("RU0304452522540817810538091310419")).toBe(true);
    expect(isValidRuIban("RU03 0445 2522 5408 1781 0538 0913 1041 9")).toBe(true);
    expect(isValidRuIban("ru0304452522540817810538091310419")).toBe(true);
  });
  it("rejects wrong check digits, wrong country, wrong length, empty", () => {
    expect(isValidRuIban("RU1704452522540817810538091310419")).toBe(false);
    expect(isValidRuIban("KZ86125KZT5004100100")).toBe(false);
    expect(isValidRuIban("RU030445252254081781053809131041")).toBe(false);
    expect(isValidRuIban("")).toBe(false);
  });
});

describe("isValidRuPlate", () => {
  it("accepts 2- and 3-digit regions, Cyrillic or Latin look-alikes, any spacing", () => {
    expect(isValidRuPlate("А 123 ВС 77")).toBe(true);
    expect(isValidRuPlate("А 123 ВС 77_")).toBe(true);
    expect(isValidRuPlate("А123ВС777")).toBe(true);
    expect(isValidRuPlate("a123bc77")).toBe(true);
    expect(isValidRuPlate("а123bc777")).toBe(true);
    expect(isValidRuPlate("Х 001 ХХ 01")).toBe(true);
  });
  it("rejects 000 digits, zero or leading-zero 3-digit regions, short regions", () => {
    expect(isValidRuPlate("А 000 ВС 77")).toBe(false);
    expect(isValidRuPlate("А 123 ВС 00")).toBe(false);
    expect(isValidRuPlate("А 123 ВС 000")).toBe(false);
    expect(isValidRuPlate("А 123 ВС 077")).toBe(false);
    expect(isValidRuPlate("А 123 ВС 7")).toBe(false);
    expect(isValidRuPlate("А 123 ВС 7__")).toBe(false);
    expect(isValidRuPlate("А 123 ВС 7_7")).toBe(false);
    expect(isValidRuPlate("А 123 ВС _77")).toBe(false);
    expect(isValidRuPlate("А _23 ВС 77_")).toBe(false);
  });
  it("rejects letters outside the 12 allowed and empty input", () => {
    expect(isValidRuPlate("Б 123 ВС 77")).toBe(false);
    expect(isValidRuPlate("D 123 BC 77")).toBe(false);
    expect(isValidRuPlate("")).toBe(false);
    expect(isValidRuPlate(null as unknown as string)).toBe(false);
  });
});

describe("isRealDate", () => {
  it("handles month lengths and leap years without using the clock", () => {
    expect(isRealDate(2000, 2, 29)).toBe(true);  // divisible by 400
    expect(isRealDate(1900, 2, 29)).toBe(false); // divisible by 100
    expect(isRealDate(2024, 2, 29)).toBe(true);
    expect(isRealDate(2023, 2, 29)).toBe(false);
    expect(isRealDate(2023, 4, 31)).toBe(false);
    expect(isRealDate(2023, 12, 31)).toBe(true);
    expect(isRealDate(2023, 13, 1)).toBe(false);
    expect(isRealDate(2023, 0, 10)).toBe(false);
    expect(isRealDate(2023, 1, 0)).toBe(false);
  });
});

describe("isValidUzPinfl (official 7-3-1 checksum + structure)", () => {
  it("accepts valid PINFLs", () => {
    expect(isValidUzPinfl("31210932040247")).toBe(true); // worked example, CM resolution No. 177
    expect(isValidUzPinfl("42502870304564")).toBe(true);
    expect(isValidUzPinfl("60101050901236")).toBe(true);
    expect(isValidUzPinfl("3 121093 204 024 7")).toBe(true);
  });
  it("uses the century from the first digit (leap years, 1800s)", () => {
    expect(isValidUzPinfl("52902001234561")).toBe(true);  // 29.02.2000
    expect(isValidUzPinfl("52902011234568")).toBe(false); // 29.02.2001, checksum correct
    expect(isValidUzPinfl("10101991234568")).toBe(true);  // 01.01.1899
  });
  it("rejects a wrong check digit, first digit outside 1-6, impossible date", () => {
    expect(isValidUzPinfl("31210932040248")).toBe(false);
    expect(isValidUzPinfl("71210932040245")).toBe(false); // checksum correct, first digit 7
    expect(isValidUzPinfl("33002902040249")).toBe(false); // checksum correct, 30.02.1990
  });
  it("rejects wrong length, empty, nullish", () => {
    expect(isValidUzPinfl("3121093204024")).toBe(false);
    expect(isValidUzPinfl("")).toBe(false);
    expect(isValidUzPinfl(undefined as unknown as string)).toBe(false);
  });
});

describe("isValidUzInn (format only — no public checksum)", () => {
  it("accepts any 9-digit value, raw or grouped", () => {
    expect(isValidUzInn("207086151")).toBe(true);
    expect(isValidUzInn("200833707")).toBe(true);
    expect(isValidUzInn("313 296 186")).toBe(true);
  });
  it("rejects wrong length, empty, nullish", () => {
    expect(isValidUzInn("20708615")).toBe(false);
    expect(isValidUzInn("2070861510")).toBe(false);
    expect(isValidUzInn("")).toBe(false);
    expect(isValidUzInn(null as unknown as string)).toBe(false);
  });
});

describe("isValidKgInn (structure only — check digit algorithm unpublished)", () => {
  it("accepts person and company INNs with a real embedded date", () => {
    expect(isValidKgInn("21503199001237")).toBe(true); // person, 15.03.1990
    expect(isValidKgInn("01605200710113")).toBe(true); // company, 16.05.2007
    expect(isValidKgInn("00305200510030")).toBe(true); // State Tax Service
    expect(isValidKgInn("2 15031990 0 123 7")).toBe(true);
  });
  it("does not verify the check digit (policy: never reject a real INN)", () => {
    expect(isValidKgInn("21503199001238")).toBe(true);
  });
  it("handles leap years and the 1900 floor", () => {
    expect(isValidKgInn("12902200012345")).toBe(true);  // 29.02.2000
    expect(isValidKgInn("12902190012345")).toBe(false); // 29.02.1900
    expect(isValidKgInn("20101189901234")).toBe(false); // 01.01.1899
  });
  it("rejects impossible dates, first digit above 5, wrong length, empty, nullish", () => {
    expect(isValidKgInn("23213199001237")).toBe(false); // 32.13.1990
    expect(isValidKgInn("61503199001237")).toBe(false);
    expect(isValidKgInn("2150319900123")).toBe(false);
    expect(isValidKgInn("")).toBe(false);
    expect(isValidKgInn(undefined as unknown as string)).toBe(false);
  });
});

describe("isValidKgAccount (NBKR instruction 3/5, MOD-97)", () => {
  it("accepts NBKR examples, raw and grouped", () => {
    expect(isValidKgAccount("1251234567890164")).toBe(true);
    expect(isValidKgAccount("125 12345678901 64")).toBe(true);
  });
  it("maps remainder 0 to 97 and pads single-digit remainders", () => {
    expect(isValidKgAccount("1251234567893497")).toBe(true); // remainder 0 → "97"
    expect(isValidKgAccount("1251234567893501")).toBe(true); // remainder 1 → "01"
    expect(isValidKgAccount("1251234567893400")).toBe(false); // remainder 0 is written "97", never "00"
  });
  it("rejects wrong control digits, wrong length, empty, nullish", () => {
    expect(isValidKgAccount("1251234567890165")).toBe(false);
    expect(isValidKgAccount("125123456789016")).toBe(false);
    expect(isValidKgAccount("")).toBe(false);
    expect(isValidKgAccount(null as unknown as string)).toBe(false);
  });
});

describe("isValidKgBik (format)", () => {
  it("accepts 6 digits: participant 100-999, branch not 000", () => {
    expect(isValidKgBik("103001")).toBe(true);
    expect(isValidKgBik("121015")).toBe(true);
  });
  it("rejects a leading 0, branch 000, wrong length, empty, nullish", () => {
    expect(isValidKgBik("044705")).toBe(false);
    expect(isValidKgBik("103000")).toBe(false);
    expect(isValidKgBik("10300")).toBe(false);
    expect(isValidKgBik("")).toBe(false);
    expect(isValidKgBik(undefined as unknown as string)).toBe(false);
  });
});
