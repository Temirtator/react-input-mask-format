import { describe, it, expect } from "vitest";
import MaskUtils from "../../src/utils/mask";
import { resolveTransform } from "../../src/utils/transform";
import {
  card, kzPhone, kzIin, kzBin, kzIban, kzPlate, kzPostal,
  ruPhone, ruInnPerson, ruInnCompany, ruSnils, ruOgrn, ruOgrnip, ruKpp,
  ruBik, ruAccount, ruIban, ruPlate, ruPostal, ruPassport,
  uzPhone, uzPinfl, uzInn, uzAccount, uzMfo, uzPlate, uzPlateCompany, uzPostal, uzPassport
} from "../../src/presets";
import { toRuPlateChar } from "../../src/utils/ru-plate";
import type { MaskPreset } from "../../src/presets";

function format(preset: MaskPreset, raw: string): string {
  const utils = new MaskUtils({
    mask: preset.mask,
    maskPlaceholder: preset.maskPlaceholder === undefined ? "_" : preset.maskPlaceholder,
    formatChars: preset.formatChars,
    transform: resolveTransform(preset.transform)
  });
  return utils.formatValue(raw);
}

describe("presets format their sample values", () => {
  it("card", () => {
    expect(format(card, "4400430212003456")).toBe("4400 4302 1200 3456");
  });
  it("kzPhone (literal +7 and area 7)", () => {
    expect(format(kzPhone, "012345678")).toBe("+7 (701) 234-56-78");
  });
  it("kzIin", () => {
    expect(format(kzIin, "900101300123")).toBe("900101300123");
  });
  it("kzBin", () => {
    expect(format(kzBin, "150340004980")).toBe("150340004980");
  });
  it("kzIban groups and uppercases the account", () => {
    expect(format(kzIban, "86125kzt5004100100")).toBe("KZ86 125K ZT50 0410 0100");
  });
  it("kzPlate uppercases letters", () => {
    expect(format(kzPlate, "123abc02")).toBe("123 ABC 02");
  });
  it("kzPostal", () => {
    expect(format(kzPostal, "050000")).toBe("050000");
  });
});

describe("kzPlate letter restriction", () => {
  it("accepts letters from ABCEHKMNOPTXY, rejects others at a letter slot", () => {
    const utils = new MaskUtils({
      mask: kzPlate.mask,
      maskPlaceholder: "_",
      transform: resolveTransform(kzPlate.transform)
    });
    // index 4 is the first letter slot (indices 0-2 digits, 3 space)
    expect(utils.isCharacterFillingPosition("A", 4)).toBe(true);
    expect(utils.isCharacterFillingPosition("D", 4)).toBe(false);
  });
});

describe("Russia presets format their sample values", () => {
  it("ruPhone", () => {
    expect(format(ruPhone, "9123456789")).toBe("+7 (912) 345-67-89");
  });
  it("ruPhone accepts a pasted international number", () => {
    expect(format(ruPhone, "+79123456789")).toBe("+7 (912) 345-67-89");
    expect(format(ruPhone, "+7 (912) 345-67-89")).toBe("+7 (912) 345-67-89");
  });
  it("ruPhone KNOWN LIMITATION: leading trunk 8 is taken as the area code", () => {
    // 8xx is a real Russian area code (812 St Petersburg) so 8 cannot be rejected.
    // README documents: enter the 10-digit number without the leading 8.
    expect(format(ruPhone, "89123456789")).toBe("+7 (891) 234-56-78");
  });
  it("ruInnPerson / ruInnCompany", () => {
    expect(format(ruInnPerson, "500100732259")).toBe("500100732259");
    expect(format(ruInnCompany, "7707083893")).toBe("7707083893");
  });
  it("ruSnils", () => {
    expect(format(ruSnils, "11223344595")).toBe("112-233-445 95");
  });
  it("ruOgrn / ruOgrnip", () => {
    expect(format(ruOgrn, "1027700132195")).toBe("1027700132195");
    expect(format(ruOgrnip, "304500116000157")).toBe("304500116000157");
  });
  it("ruKpp uppercases letters in positions 5-6", () => {
    expect(format(ruKpp, "7707ab001")).toBe("7707AB001");
  });
  it("ruBik", () => {
    expect(format(ruBik, "044525225")).toBe("044525225");
  });
  it("ruAccount groups 20 digits", () => {
    expect(format(ruAccount, "40817810538091310419")).toBe("40817 810 5 3809 1310419");
  });
  it("ruIban groups 33 chars by 4", () => {
    expect(format(ruIban, "0304452522540817810538091310419"))
      .toBe("RU03 0445 2522 5408 1781 0538 0913 1041 9");
  });
  it("ruPlate converts Latin look-alikes to Cyrillic, 2- and 3-digit regions", () => {
    expect(format(ruPlate, "a123bc77")).toBe("А 123 ВС 77");
    expect(format(ruPlate, "а123bc777")).toBe("А 123 ВС 777");
  });
  it("ruPostal / ruPassport", () => {
    expect(format(ruPostal, "101000")).toBe("101000");
    expect(format(ruPassport, "4506123456")).toBe("4506 123456");
  });
});

describe("ruPlate letter restriction", () => {
  it("accepts the 12 plate letters in either script, rejects others", () => {
    const utils = new MaskUtils({
      mask: ruPlate.mask,
      maskPlaceholder: null,
      transform: resolveTransform(ruPlate.transform)
    });
    expect(utils.isCharacterFillingPosition(toRuPlateChar("a"), 0)).toBe(true);
    expect(utils.isCharacterFillingPosition(toRuPlateChar("х"), 0)).toBe(true);
    expect(utils.isCharacterFillingPosition(toRuPlateChar("D"), 0)).toBe(false);
    expect(utils.isCharacterFillingPosition(toRuPlateChar("Б"), 0)).toBe(false);
  });
  it("toRuPlateChar leaves digits and spaces alone", () => {
    expect(toRuPlateChar("7")).toBe("7");
    expect(toRuPlateChar(" ")).toBe(" ");
  });
});

describe("Uzbekistan presets format their sample values", () => {
  it("uzPhone formats a full international number", () => {
    expect(format(uzPhone, "+998901234567")).toBe("+998 (90) 123-45-67");
    expect(format(uzPhone, "998712002700")).toBe("+998 (71) 200-27-00");
  });
  it("uzPhone KNOWN LIMITATION: bare national digits starting with 9 as a value", () => {
    // formatValue matches the leading 9 against the literal 9 of +998.
    // Typing/pasting are unaffected (component tests); README tells users to pass +998….
    expect(format(uzPhone, "901234567")).toBe("+998 (01) 234-56-7_");
  });
  it("uzPinfl / uzInn / uzMfo / uzPostal", () => {
    expect(format(uzPinfl, "31210932040247")).toBe("31210932040247");
    expect(format(uzInn, "207086151")).toBe("207086151");
    expect(format(uzMfo, "00417")).toBe("00417");
    expect(format(uzPostal, "100123")).toBe("100123");
  });
  it("uzAccount groups 20 digits", () => {
    expect(format(uzAccount, "20208000900600293001")).toBe("20208 000 9 00600293 001");
  });
  it("uzPlate / uzPlateCompany uppercase Latin letters", () => {
    expect(format(uzPlate, "01a123bc")).toBe("01 A 123 BC");
    expect(format(uzPlateCompany, "01123abc")).toBe("01 123 ABC");
  });
  it("uzPassport uppercases the series", () => {
    expect(format(uzPassport, "aa1234567")).toBe("AA1234567");
  });
});
