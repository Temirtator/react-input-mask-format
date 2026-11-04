import { describe, it, expect } from "vitest";
import { createSubject, presets } from "./subject";
import { describeMask } from "./description";
import { known } from "./known";
import { caretAt, focus, insert, typeString } from "./driver";

const preset = (name: string) => createSubject(presets.find(p => p.name === name)!.setup);

describe("known divergences (by design)", () => {
  it("K1 (by design) typing puts each key in the next slot, paste reads a literal the text repeats in full", () => {
    const setup = { mask: "99.99.2099" };
    expect(known.slotLikeLiteral(describeMask(setup))).toBe(true);
    const subject = createSubject(setup);
    expect(typeString(subject, focus(subject), "010124").value).toBe("01.01.2024");
    expect(typeString(subject, focus(subject), "01012024").value).toBe("01.01.2020");
    expect(subject.format("010124")).toBe("01.01.2024");
    expect(subject.format("01012024")).toBe("01.01.2024");
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

  it("K5 (by design) a placeholder character typed into the last slot is replaced by the next typed character", () => {
    const setup = { mask: [/[A-Za-z0-9]/], maskPlaceholder: "_" };
    const d = describeMask(setup);
    expect(known.typesPlaceholderIntoLastSlot(d, "_0")).toBe(true);
    expect(known.typesPlaceholderIntoLastSlot(d, "_")).toBe(false);
    expect(known.typesPlaceholderIntoLastSlot(d, "_!")).toBe(false);
    expect(known.typesPlaceholderIntoLastSlot(d, "0_0")).toBe(false);
    const subject = createSubject(setup);
    expect(typeString(subject, focus(subject), "_0").value).toBe("0");
    expect(subject.format("_0")).toBe("_");
    const kzSetup = presets.find(p => p.name === "kzPhone")!.setup;
    expect(known.typesPlaceholderIntoLastSlot(describeMask(kzSetup), "01234567_8")).toBe(true);
    expect(known.typesPlaceholderIntoLastSlot(describeMask(kzSetup), "0123456_78")).toBe(false);
    const kz = preset("kzPhone");
    expect(typeString(kz, focus(kz), "01234567_8").value).toBe("+7 (701) 234-56-78");
    expect(kz.format("+7 (7" + "01234567_8")).toBe("+7 (701) 234-56-7_");
  });
});
