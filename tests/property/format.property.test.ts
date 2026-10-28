import { describe, it, expect } from "vitest";
import { fc, holds, maskCase, textFor, generatedMask, renderMask } from "./arbitraries";
import { describeMask, hasShape, isFilledSlot, isGapFree, slotIndices } from "./description";
import { isValidSetup } from "./subject";

const caseWithText = maskCase.chain(c => fc.tuple(fc.constant(c), textFor(c)));

describe("generated masks", () => {
  it("are valid for the public API", () => {
    holds(fc.property(generatedMask, mask => isValidSetup(renderMask(mask))));
  });

  it("describe the same positions as a string and as an array", () => {
    holds(
      fc.property(generatedMask, mask => {
        const asString = describeMask(renderMask({ ...mask, asArray: false }));
        const asArray = describeMask(renderMask({ ...mask, asArray: true }));
        expect(asString.positions.map(p => (p.kind === "literal" ? p.char : `[${p.regex.source}]`))).toEqual(
          asArray.positions.map(p => (p.kind === "literal" ? p.char : `[${p.regex.source}]`))
        );
      })
    );
  });
});

describe("formatValue", () => {
  it("F1 is idempotent", () => {
    holds(
      fc.property(caseWithText, ([c, text]) => {
        const once = c.subject.format(text);
        expect(c.subject.format(once)).toBe(once);
      })
    );
  });

  it("F2 returns a value of the mask's shape", () => {
    holds(
      fc.property(caseWithText, ([c, text]) => {
        const formatted = c.subject.format(text);
        expect(hasShape(c.d, formatted)).toBe(true);
      })
    );
  });

  it("F3 keeps a formatted controlled value and formats against an empty shown value", () => {
    holds(
      fc.property(caseWithText, ([c, text]) => {
        const formatted = c.subject.format(text);
        expect(c.subject.formatControlled(formatted, formatted)).toBe(formatted);
        expect(c.subject.formatControlled(text, "")).toBe(formatted);
      })
    );
  });

  it("F4 reports empty and filled values", () => {
    holds(
      fc.property(caseWithText, ([c, text]) => {
        const formatted = c.subject.format(text);
        const slots = slotIndices(c.d);
        expect(c.subject.isEmpty(c.subject.format(""))).toBe(true);
        expect(c.subject.isEmpty(formatted)).toBe(!slots.some(i => isFilledSlot(c.d, formatted, i)));
        expect(c.subject.isFilled(formatted)).toBe(isFilledSlot(c.d, formatted, slots[slots.length - 1]));
        if (isGapFree(c.d, formatted)) {
          expect(c.subject.isFilled(formatted)).toBe(slots.every(i => isFilledSlot(c.d, formatted, i)));
        }
      })
    );
  });
});
