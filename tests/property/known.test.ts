import { describe, it, expect } from "vitest";
import { createSubject, extendedFormatChars, isValidSetup, presets } from "./subject";
import { describeMask } from "./description";
import { known } from "./known";
import { caretAt, focus, insert, pasteOverAll, typeString } from "./driver";

const preset = (name: string) => createSubject(presets.find(p => p.name === name)!.setup);

describe("known divergences (pinned until fixed)", () => {
  it("K1 typing over a literal a slot would accept differs from formatValue (expected: typing gives 7746-)", () => {
    const setup = { mask: "*7*9-", maskPlaceholder: null };
    expect(known.slotLikeLiteral(describeMask(setup))).toBe(true);
    const subject = createSubject(setup);
    expect(typeString(subject, focus(subject), "77462941").value).toBe("7774-");
    expect(subject.format("77462941")).toBe("7746-");
  });

  it("K3 a full maskPlaceholder for an escaped mask is validated against the raw string (expected: 9_ is valid)", () => {
    expect(isValidSetup({ mask: "\\99", maskPlaceholder: "9_" })).toBe(false);
    expect(isValidSetup({ mask: "\\99", maskPlaceholder: "9__" })).toBe(true);
    expect(createSubject({ mask: "\\99", maskPlaceholder: "9__" }).format("5")).toBe("95_");
  });

  it("K4 text that fills no slot leaves the caret inside the prefix (expected: caret after the prefix)", () => {
    const kz = preset("kzPhone");
    expect(known.fillsNoSlotFromPrefix(describeMask(presets.find(p => p.name === "kzPhone")!.setup), "7", Math.min(0, 1))).toBe(true);
    const typed = insert(kz, caretAt(focus(kz), 0), "7");
    expect([typed.value, typed.start]).toEqual(["+7 (7__) ___-__-__", 2]);
    const uz = preset("uzPhone");
    expect(known.fillsNoSlotFromPrefix(describeMask(presets.find(p => p.name === "uzPhone")!.setup), "+998", Math.min(0, "+998".length))).toBe(true);
    const pasted = pasteOverAll(uz, focus(uz), "+998");
    expect([pasted.value, pasted.start]).toEqual(["+998 (__) ___-__-__", 4]);
  });

  it("K5 text with the placeholder character: typing and formatValue disagree (expected: formatValue keeps the 0)", () => {
    const setup = { mask: " .+aA)Я9#", formatChars: extendedFormatChars, transform: "uppercase" as const };
    expect(known.containsPlaceholder(describeMask(setup), "zy_0")).toBe(true);
    const subject = createSubject(setup);
    expect(typeString(subject, focus(subject), "zy_0").value).toBe(" .+ZY)_0_");
    expect(subject.format(" .+zy_0")).toBe(" .+ZY)___");
  });

  it("K6 junk pasted over a selection from the prefix clears the value (expected: value unchanged, as without a prefix)", () => {
    const prefixedSetup = { mask: "+7 99" };
    const prefixed = createSubject(prefixedSetup);
    const typed = typeString(prefixed, focus(prefixed), "1");
    expect(typed.value).toBe("+7 1_");
    expect(known.selectionFromPrefix(describeMask(prefixedSetup), { ...typed, start: 0, end: typed.value.length })).toBe(true);
    expect(insert(prefixed, { ...typed, start: 0, end: typed.value.length }, "!").value).toBe("+7 __");
    const plain = createSubject({ mask: "99-99" });
    const filled = typeString(plain, focus(plain), "12");
    expect(insert(plain, { ...filled, start: 0, end: filled.value.length }, "!").value).toBe("12-__");
  });

  it("K7 pasting a formatted value back re-reads a +-less letter/digit prefix as input (expected: 97_)", () => {
    const setup = { mask: "\\979" };
    expect(known.prefixOverflows(describeMask(setup), "97_")).toBe(true);
    const subject = createSubject(setup);
    expect(subject.format("")).toBe("97_");
    expect(pasteOverAll(subject, focus(subject), "97_").value).toBe("977");
  });

  it("K8 a change explained as an insertion with the caret before its end drops the rest (expected: +7 (777) 987-65-43)", () => {
    const kz = preset("kzPhone");
    const typed = typeString(kz, focus(kz), "01");
    expect(typed.value).toBe("+7 (701) ___-__-__");
    const next = kz.change(
      { value: "+7 777 987 65 43", selection: { start: 10, end: 10 } },
      { value: typed.value, selection: { start: 0, end: typed.value.length, length: typed.value.length } }
    );
    expect(known.caretInsideInsertion({ value: typed.value, start: 0, end: typed.value.length }, "+7 777 987 65 43", 10)).toBe(true);
    expect(next.value).toBe("+7 (777) 987-__-__");
    expect(next.selection).toMatchObject({ start: 13, end: 13 });
  });
});
