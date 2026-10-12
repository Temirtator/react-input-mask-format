import { describe, it, expect } from "vitest";
import MaskUtils from "../../src/utils/mask";
import { resolveTransform } from "../../src/utils/transform";
import type { Mask, Transform } from "../../src/types";

type Subject = MaskUtils;

const subject = (mask: Mask | null, maskPlaceholder: string | null = "_", transform?: Transform): Subject =>
  new MaskUtils({ mask, maskPlaceholder, transform: transform ? resolveTransform(transform) : undefined });

const hasSignificant = (s: Subject) => s.hasSignificantPrefix();
const significant = (s: Subject) => s.getPrefixSignificantCharacters();
const trim = (s: Subject, string: string, position: number) => s.trimOverflowingPrefix(string, position);
const insertAfter = (s: Subject, string: string, position: number, wasTrimmed: boolean) =>
  s.shouldInsertAfterPrefix(string, position, wasTrimmed);
const normalize = (s: Subject, value: string) => s.normalizeUnprefixedValue(value);

const uz = () => subject("+\\9\\98 (99) 999-99-99");
const uzNoPlaceholder = () => subject("+\\9\\98 (99) 999-99-99", null);
const kz = () => subject("+7 (799) 999-99-99");
const kg = () => subject("+\\9\\96 (999) 99-99-99");
const ru = () => subject("+7 (999) 999-99-99");
const iban = () => subject("KZ99 999* **** **** ****", "_", "uppercase");
const date = () => subject("99/99/9999");
const card = () => subject("9999 9999 9999 9999");
const us = () => subject("(999) 999-9999");

describe("hasSignificantPrefix", () => {
  it.each<[string, () => Subject, boolean]>([
    ["uzPhone +998 (", uz, true],
    ["kzPhone +7 (7", kz, true],
    ["kzIban KZ", iban, true],
    ["US phone (", us, false],
    ["date, no prefix", date, false],
    ["card, no prefix", card, false],
    ["mask null", () => subject(null), false]
  ])("%s", (_name, make, expected) => {
    expect(hasSignificant(make())).toBe(expected);
  });
});

describe("prefixSignificantCharacters", () => {
  it.each<[string, () => Subject, string]>([
    ["uzPhone", uz, "998"],
    ["kzPhone", kz, "77"],
    ["kzIban", iban, "KZ"],
    ["US phone", us, ""],
    ["date", date, ""]
  ])("%s", (_name, make, expected) => {
    expect(significant(make())).toBe(expected);
  });
});

describe("trimOverflowingPrefix", () => {
  it.each<[string, () => Subject, string, number, string]>([
    ["uz: country code pasted at the prefix end", uz, "+998 90 123 45 67", 6, "90 123 45 67"],
    ["uz: trunk 8 pasted at the prefix end", uz, "8 90 123 45 67", 6, "90 123 45 67"],
    ["uz: national number fits, untouched", uz, "90 123 45 67", 6, "90 123 45 67"],
    ["uz: past the prefix, untouched", uz, "+998 90 123 45 67", 10, "+998 90 123 45 67"],
    ["uz: one past the prefix, untouched", uz, "+998 90 123 45 67", 7, "+998 90 123 45 67"],
    ["uz: at position 0", uz, "+998 90 123 45 67", 0, "90 123 45 67"],
    ["kz: country code at 0", kz, "+7 701 123 45 67", 0, "01 123 45 67"],
    ["kz: trunk 8 at the prefix end", kz, "8 701 123 45 67", 5, "01 123 45 67"],
    ["ru: trunk 8 at 0", ru, "8 912 345 67 89", 0, "912 345 67 89"],
    ["kg: trunk 0 at 0", kg, "0555 12 34 56", 0, "555 12 34 56"],
    ["kzIban: full IBAN with letters at 0", iban, "KZ86125KZT5004100100", 0, "86125KZT5004100100"],
    ["date: no prefix, untouched", date, "123456789", 0, "123456789"],
    ["US phone: insignificant prefix, untouched", us, "15551234567", 0, "15551234567"]
  ])("%s", (_name, make, string, position, expected) => {
    expect(trim(make(), string, position)).toBe(expected);
  });
});

describe("shouldInsertAfterPrefix", () => {
  it.each<[string, () => Subject, string, number, boolean, boolean]>([
    ["uz KNOWN LIMITATION: typing 9 at 0 continues the prefix", uz, "9", 0, false, false],
    ["uz: typing 99 at 0 continues the prefix", uz, "99", 0, false, false],
    ["uz: typing 998 at 0 continues the prefix", uz, "998", 0, false, false],
    ["uz: national number at 0", uz, "901234567", 0, false, true],
    ["uz: 90 at 0", uz, "90", 0, false, true],
    ["uz: 3 at 0", uz, "3", 0, false, true],
    ["uz: trimmed text with a prefix-like start", uz, "90 123 45 67", 0, true, true],
    ["uz: empty", uz, "", 0, false, false],
    ["uz: fills nothing", uz, "-", 0, false, false],
    ["uz: plus only", uz, "+", 0, false, false],
    ["uz: 9 at 5, inside the prefix after its digits", uz, "9", 5, false, true],
    ["uz: 0 at 5", uz, "0", 5, false, true],
    ["uz: at the prefix end", uz, "9", 6, false, false],
    ["kz KNOWN LIMITATION: typing 7 at 0", kz, "7", 0, false, false],
    ["kz KNOWN LIMITATION: typing 77 at 0", kz, "77", 0, false, false],
    ["kz: 777 at 0", kz, "777", 0, false, false],
    ["kz: 701 at 0", kz, "701", 0, false, true],
    ["kz: 7 at 4 continues the operator 7", kz, "7", 4, false, false],
    ["kz: 0 at 4", kz, "0", 4, false, true],
    ["kz: trimmed 77 at 0", kz, "77", 0, true, true],
    ["kzIban: kz86 at 0, case-insensitive", iban, "kz86", 0, false, false],
    ["kzIban: KZ86 at 0", iban, "KZ86", 0, false, false],
    ["kzIban: 86125 at 0", iban, "86125", 0, false, true],
    ["kzIban: z86 at 1", iban, "z86", 1, false, false],
    ["kzIban: 86 at 1", iban, "86", 1, false, true],
    ["date: no prefix", date, "12", 0, false, false],
    ["US phone: insignificant prefix", us, "555", 0, false, false]
  ])("%s", (_name, make, string, position, wasTrimmed, expected) => {
    expect(insertAfter(make(), string, position, wasTrimmed)).toBe(expected);
  });
});

describe("normalizeUnprefixedValue", () => {
  it.each<[string, () => Subject, string, string | null]>([
    ["uz: bare national digits", uz, "901234567", "901234567"],
    ["uz: with country code", uz, "+998901234567", "901234567"],
    ["uz: country code and spaces", uz, "998 90 123 45 67", "90 123 45 67"],
    ["uz: formatted value starts with the prefix", uz, "+998 (90) 123-45-67", null],
    ["uz: partial formatted value", uz, "+998 (90) 1__-__-__", null],
    ["uz: prefix digits + partial", uz, "9989", "9"],
    ["uz: prefix digits + partial 901", uz, "998901", "901"],
    ["uz: +998 + partial", uz, "+998901234", "901234"],
    ["uz: 998 + partial", uz, "998901234", "901234"],
    ["uz: exactly the prefix digits", uz, "998", ""],
    ["uz: +998 only", uz, "+998", ""],
    ["uz: overflow keeps the last nine", uz, "9989012345678", "012345678"],
    ["uz: empty", uz, "", null],
    ["uz: too short, no prefix match", uz, "90", null],
    ["uz: prefix digits without plus and formatted rest", uz, "998 (90) 123-45-67", "90) 123-45-67"],
    ["uz: plus, space, country code", uz, "+ 998 90 123 45 67", "90 123 45 67"],
    ["uz no placeholder: bare national digits", uzNoPlaceholder, "901234567", "901234567"],
    ["uz no placeholder: with country code", uzNoPlaceholder, "+998901234567", "901234567"],
    ["kz: national 777… reads as prefix 7 + rest", kz, "7771234567", "771234567"],
    ["kz: national 771…", kz, "7712345678", "712345678"],
    ["kz: country code 7 + national 777…", kz, "77771234567", "771234567"],
    ["kz: 777 partial", kz, "777", "7"],
    ["kz: national 701…", kz, "7011234567", "011234567"],
    ["kz: trunk 8 + national", kz, "87011234567", "011234567"],
    ["kz: +7 + national", kz, "+77011234567", "011234567"],
    ["kz: 701 too short", kz, "701", null],
    ["kg: bare national", kg, "555123456", "555123456"],
    ["kg: trunk 0", kg, "0555123456", "555123456"],
    ["kg: country code", kg, "996555123456", "555123456"],
    ["kg: formatted paste", kg, "+996 555 12 34 56", "555 12 34 56"],
    ["kg: national starting with 99", kg, "995123456", "995123456"],
    ["ru: bare national", ru, "9123456789", "9123456789"],
    ["ru: trunk 8", ru, "89123456789", "9123456789"],
    ["ru: country code 7", ru, "79123456789", "9123456789"],
    ["ru: +7", ru, "+79123456789", "9123456789"],
    ["ru: too short", ru, "912", null],
    ["kzIban: uppercase starts with the literal prefix", iban, "KZ86125KZT5004100100", null],
    ["kzIban: lowercase kz is dropped", iban, "kz86125kzt5004100100", "86125kzt5004100100"],
    ["kzIban: digits only", iban, "86125KZT5004100100", "86125KZT5004100100"],
    ["kzIban: KZ86 starts with the literal prefix", iban, "KZ86", null],
    ["kzIban: KZ alone", iban, "KZ", null],
    ["kzIban: kz alone", iban, "kz", ""],
    ["kzIban: 86 too short", iban, "86", null],
    ["date: no prefix", date, "12345678", null],
    ["card: overflow, no prefix", card, "42424242424242421", null],
    ["US phone: insignificant prefix", us, "5551234567", null]
  ])("%s", (_name, make, value, expected) => {
    expect(normalize(make(), value)).toBe(expected);
  });
});

describe("formatControlledValue keeps a shown value with the same filling characters", () => {
  it.each<[string, () => Subject, string, string, string]>([
    ["kz: digits-only parent", kz, "7771234567", "+7 (777) 123-45-67", "+7 (777) 123-45-67"],
    ["kz: identical", kz, "+7 (777) 123-45-67", "+7 (777) 123-45-67", "+7 (777) 123-45-67"],
    ["kz: different last digit is reformatted", kz, "7771234568", "+7 (777) 123-45-67", "+7 (777) 123-45-68"],
    ["uz: digits-only parent", uz, "901234567", "+998 (90) 123-45-67", "+998 (90) 123-45-67"],
    ["uz: nothing shown yet", uz, "901234567", "", "+998 (90) 123-45-67"],
    ["uz: shown is partial", uz, "901234567", "+998 (90) 123-45-6_", "+998 (90) 123-45-67"],
    ["kzIban: lowercase parent", iban, "kz86125kzt5004100100", "KZ86 125K ZT50 0410 0100", "KZ86 125K ZT50 0410 0100"]
  ])("%s", (_name, make, value, shown, expected) => {
    expect(make().formatControlledValue(value, shown)).toBe(expected);
  });
});
