import { describe, it, expect } from "vitest";
import MaskUtils from "../../src/core/mask";
import { resolveTransform } from "../../src/utils/transform";
import {
  card, kzPhone, kzIin, kzBin, kzIban, kzPlate, kzPostal,
  ruPhone, ruInnPerson, ruInnCompany, ruSnils, ruOgrn, ruOgrnip, ruKpp,
  ruBik, ruAccount, ruIban, ruPlate, ruPostal, ruPassport,
  uzPhone, uzPinfl, uzInn, uzAccount, uzMfo, uzPlate, uzPlateCompany, uzPostal, uzPassport,
  kgPhone, kgInnPerson, kgInnCompany, kgAccount, kgBik, kgPlate, kgPlateCompany, kgPostal, kgPassport,
  byPhone, byPersonalId, byUnp, byIban, byPlate, byPostal, byPassport,
  tjPhone, tjInn, tjEin, tjAccount, tjBik, tjPlate, tjPlateCompany, tjPostal,
  amPhone, amPsn, amTin, amAccount, amPlate, amPostal, amPassport,
  azPhone, azFin, azVoen, azIban, azPlate, azPostal, azPassport
} from "../../src/presets";
import { toRuPlateChar } from "../../src/utils/ru-plate";
import { toLatinLookalike } from "../../src/utils/latin-lookalike";
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
  it("ruPhone drops a leading trunk 8 when the value has 11 digits", () => {
    expect(format(ruPhone, "89123456789")).toBe("+7 (912) 345-67-89");
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
    expect(format(ruPlate, "a123bc77")).toBe("А 123 ВС 77_");
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
      maskPlaceholder: ruPlate.maskPlaceholder,
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
  it("uzPhone places bare national digits after the +998 prefix", () => {
    expect(format(uzPhone, "901234567")).toBe("+998 (90) 123-45-67");
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

describe("kzPhone values starting with 77", () => {
  it("kzPhone reads a 10-digit value starting with 77 as a complete national number", () => {
    // A digits-only controlled parent ("77" + 8 typed digits) keeps its shown value instead (component test)
    expect(format(kzPhone, "7771234567")).toBe("+7 (777) 123-45-67");
    expect(format(kzPhone, "+77771234567")).toBe("+7 (777) 123-45-67");
  });
});

describe("Kyrgyzstan presets format their sample values", () => {
  it("kgPhone formats national, international and domestic-0 numbers", () => {
    expect(format(kgPhone, "555123456")).toBe("+996 (555) 12-34-56");
    expect(format(kgPhone, "+996555123456")).toBe("+996 (555) 12-34-56");
    expect(format(kgPhone, "0555123456")).toBe("+996 (555) 12-34-56");
  });
  it("kgPhone places bare national digits after the +996 prefix", () => {
    expect(format(kgPhone, "995123456")).toBe("+996 (995) 12-34-56");
  });
  it("kgInnPerson / kgInnCompany / kgBik / kgPostal", () => {
    expect(format(kgInnPerson, "21503199001237")).toBe("21503199001237");
    expect(format(kgInnCompany, "01605200710113")).toBe("01605200710113");
    expect(format(kgBik, "103001")).toBe("103001");
    expect(format(kgPostal, "720001")).toBe("720001");
  });
  it("kgAccount groups 16 digits", () => {
    expect(format(kgAccount, "1251234567890164")).toBe("125 12345678901 64");
  });
  it("kgPlate / kgPlateCompany uppercase Latin letters", () => {
    expect(format(kgPlate, "01123abc")).toBe("01 123 ABC");
    expect(format(kgPlateCompany, "08456ab")).toBe("08 456 AB");
  });
  it("kgPassport uppercases ID card and passport series", () => {
    expect(format(kgPassport, "id1234567")).toBe("ID1234567");
    expect(format(kgPassport, "pe1234567")).toBe("PE1234567");
  });
});

describe("Belarus presets format their sample values", () => {
  it("toLatinLookalike maps Cyrillic look-alikes and uppercases", () => {
    expect(toLatinLookalike("р")).toBe("P");
    expect(toLatinLookalike("І")).toBe("I");
    expect(toLatinLookalike("у")).toBe("Y");
    expect(toLatinLookalike("d")).toBe("D");
  });
  it("byPhone reads domestic and international forms", () => {
    for (const raw of ["+375291234567", "80291234567", "8 029 123-45-67", "375291234567", "291234567"]) {
      expect(format(byPhone, raw)).toBe("+375 (29) 123-45-67");
    }
  });
  it("byPersonalId, byUnp and byPassport convert Cyrillic look-alikes", () => {
    expect(format(byPersonalId, "7000000а000рв1")).toBe("7000000A000PB1");
    expect(format(byUnp, "ма1953684")).toBe("MA1953684");
    expect(format(byUnp, "200988541")).toBe("200988541");
    expect(format(byPassport, "мр1234567")).toBe("MP1234567");
  });
  it("byIban accepts compact input with and without the country code", () => {
    expect(format(byIban, "by13nbrb3600900000002z00ab00")).toBe("BY13 NBRB 3600 9000 0000 2Z00 AB00");
    expect(format(byIban, "13NBRB3600900000002Z00AB00")).toBe("BY13 NBRB 3600 9000 0000 2Z00 AB00");
  });
  it("byPlate converts look-alikes and rejects unlisted letters and region 9", () => {
    expect(format(byPlate, "1234ав7")).toBe("1234 AB-7");
    expect(format(byPlate, "1234DF7")).toBe("1234 __-_");
    expect(format(byPlate, "1234AB9")).toBe("1234 AB-_");
  });
  it("byPostal", () => {
    expect(format(byPostal, "220050")).toBe("220050");
  });
});

describe("Tajikistan presets format their sample values", () => {
  it("tjPhone reads international and national forms", () => {
    for (const raw of ["+992931234567", "992931234567", "931234567"]) {
      expect(format(tjPhone, raw)).toBe("+992 (93) 123-45-67");
    }
    expect(format(tjPhone, "372123456")).toBe("+992 (37) 212-34-56");
    expect(format(tjPhone, "001234567")).toBe("+992 (00) 123-45-67");
  });
  it("tjInn, tjEin, tjBik and tjPostal", () => {
    expect(format(tjInn, "030026536")).toBe("030026536");
    expect(format(tjEin, "0310015466")).toBe("0310015466");
    expect(format(tjBik, "350101900")).toBe("350101900");
    expect(format(tjPostal, "734025")).toBe("734025");
  });
  it("tjAccount groups 20 digits", () => {
    expect(format(tjAccount, "22202972700007683505")).toBe("22202 972 7 00007683505");
  });
  it("tjPlate and tjPlateCompany convert look-alikes to Latin", () => {
    expect(format(tjPlate, "1234ав01")).toBe("1234 AB 01");
    expect(format(tjPlateCompany, "123ab01")).toBe("123 AB 01");
  });
});

describe("Armenia presets format their sample values", () => {
  it("amPhone reads international and national forms", () => {
    for (const raw of ["+37477123456", "077123456", "77123456", "37477123456"]) {
      expect(format(amPhone, raw)).toBe("+374 (77) 12-34-56");
    }
  });
  it("amPsn, amTin, amPostal and amPassport", () => {
    expect(format(amPsn, "3014750025")).toBe("3014750025");
    expect(format(amTin, "02502212")).toBe("02502212");
    expect(format(amPostal, "0010")).toBe("0010");
    expect(format(amPassport, "am0565436")).toBe("AM0565436");
  });
  it("amAccount keeps trailing placeholders for short accounts", () => {
    expect(format(amAccount, "1150013314754778")).toBe("1150013314754778");
    expect(format(amAccount, "11500814802")).toBe("11500814802_____");
  });
  it("amPlate uppercases", () => {
    expect(format(amPlate, "35ol123")).toBe("35 OL 123");
  });
});

describe("Azerbaijan presets format their sample values", () => {
  it("azPhone reads international and national forms", () => {
    for (const raw of ["+994501234567", "0501234567", "501234567", "994501234567", "00994501234567"]) {
      expect(format(azPhone, raw)).toBe("+994 (50) 123-45-67");
    }
  });
  it("azFin uppercases and turns O into 0", () => {
    expect(format(azFin, "5vbkovr")).toBe("5VBK0VR");
  });
  it("azVoen", () => {
    expect(format(azVoen, "9900003871")).toBe("9900003871");
  });
  it("azIban adds the AZ prefix and groups", () => {
    expect(format(azIban, "az21nabz00000000137010001944")).toBe("AZ21 NABZ 0000 0000 1370 1000 1944");
    expect(format(azIban, "21NABZ00000000137010001944")).toBe("AZ21 NABZ 0000 0000 1370 1000 1944");
  });
  it("azPlate uppercases", () => {
    expect(format(azPlate, "90aa001")).toBe("90-AA-001");
  });
  it("azPostal adds the AZ prefix", () => {
    for (const raw of ["1000", "AZ1000", "AZ 1000", "az1000"]) {
      expect(format(azPostal, raw)).toBe("AZ1000");
    }
  });
  it("azPassport uppercases", () => {
    expect(format(azPassport, "c01234567")).toBe("C01234567");
  });
});
