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

  it("K4 (by design) text that types the beginning of the prefix leaves the caret before the rest of it", () => {
    const kzSetup = presets.find(p => p.name === "kzPhone")!.setup;
    expect(known.entersPrefixStart(describeMask(kzSetup), "7", 0)).toBe(true);
    const kz = preset("kzPhone");
    const typed = insert(kz, caretAt(focus(kz), 0), "7");
    expect([typed.value, typed.start]).toEqual(["+7 (7__) ___-__-__", 2]);
    const continued = typeString(kz, typed, "7011234567");
    expect(continued.value).toBe("+7 (701) 123-45-67");
  });

  it("K5 text with the placeholder character: typing and formatValue disagree (expected: formatValue keeps the 0)", () => {
    const setup = { mask: " .+aA)Я9#", formatChars: extendedFormatChars, transform: "uppercase" as const };
    expect(known.containsPlaceholder(describeMask(setup), "zy_0")).toBe(true);
    const subject = createSubject(setup);
    expect(typeString(subject, focus(subject), "zy_0").value).toBe(" .+ZY)_0_");
    expect(subject.format(" .+zy_0")).toBe(" .+ZY)___");
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
