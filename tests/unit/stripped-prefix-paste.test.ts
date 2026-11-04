import { describe, it, expect } from "vitest";
import MaskUtils from "../../src/core/mask";
import { tmPhone, kzPhone } from "../../src/presets";
import type { MaskPreset } from "../../src/presets";

function pasteOverAll(preset: MaskPreset, text: string) {
  const mask = new MaskUtils({ mask: preset.mask, maskPlaceholder: "_" });
  const empty = mask.formatValue("");
  return mask.processChange(
    { value: text, selection: { start: text.length, end: text.length } },
    { value: empty, selection: { start: 0, end: empty.length, length: empty.length } }
  );
}

describe("pasting +country code with digits no slot accepts", () => {
  it.each<[string, MaskPreset, string, string, number]>([
    ["tmPhone + 9", tmPhone, "+9939", "+993 (__) __-__-__", 6],
    ["tmPhone + spaced 9", tmPhone, "+993 9", "+993 (__) __-__-__", 6],
    ["tmPhone + 8", tmPhone, "+9938", "+993 (__) __-__-__", 6],
    ["tmPhone + valid digits", tmPhone, "+99365", "+993 (65) __-__-__", 10],
    ["kzPhone full number", kzPhone, "+77012345678", "+7 (701) 234-56-78", 18]
  ])("%s leaves the caret after the prefix", (_name, preset, text, value, caret) => {
    const result = pasteOverAll(preset, text);
    expect(result.value).toBe(value);
    expect(result.selection.start).toBe(caret);
  });
});
