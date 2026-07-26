import { describe, it, expect } from "vitest";
import MaskUtils from "../../src/utils/mask";
import { resolveTransform } from "../../src/utils/transform";
import {
  card, kzPhone, kzIin, kzBin, kzIban, kzPlate, kzPostal
} from "../../src/presets";
import type { MaskPreset } from "../../src/presets";

function format(preset: MaskPreset, raw: string): string {
  const utils = new MaskUtils({
    mask: preset.mask,
    maskPlaceholder: preset.maskPlaceholder ?? "_",
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
