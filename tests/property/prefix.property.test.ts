import { describe, it, expect } from "vitest";
import { fc, holds, maskCase, digits } from "./arbitraries";
import { known } from "./known";
import { slotIndices } from "./description";
import { focus, pasteOverAll, typeString } from "./driver";

const plusCase = maskCase.filter(c => c.d.prefix.startsWith("+"));
const prefixedCase = maskCase.filter(c => c.d.prefix.length > 0);
const digitUnit = fc.constantFrom(..."0123456789".split(""));

describe("prefix masks", () => {
  it("X1 pasting +<country code> <digits> equals typing the digits", () => {
    holds(
      fc.property(
        plusCase.chain(c =>
          fc.tuple(fc.constant(c), fc.string({ unit: digitUnit, maxLength: slotIndices(c.d).length }))
        ),
        ([c, national]) => {
          const text = `+${c.d.significant} ${national}`;
          fc.pre(!known.slotLikeLiteral(c.d) && !known.containsPlaceholder(c.d, text));
          const pasted = pasteOverAll(c.subject, focus(c.subject), text);
          expect(pasted.value).toBe(typeString(c.subject, focus(c.subject), national).value);
        }
      )
    );
  });

  it("X2 select all and paste of digits equals formatting them", () => {
    holds(
      fc.property(prefixedCase.chain(c => fc.tuple(fc.constant(c), digits)), ([c, text]) => {
        fc.pre(!known.overlapsCountryCode(c.d, text) && !known.slotLikeLiteral(c.d));
        expect(pasteOverAll(c.subject, focus(c.subject), text).value).toBe(c.subject.format(text));
      })
    );
  });

  it("X3 pasting a country code with digits leaves the caret after the prefix", () => {
    holds(
      fc.property(
        prefixedCase.chain(c =>
          fc.tuple(
            fc.constant(c),
            fc.boolean(),
            fc.integer({ min: 0, max: c.d.significant.length }),
            digits
          )
        ),
        ([c, plus, length, national]) => {
          const text = `${plus ? "+" : ""}${c.d.significant.slice(0, length)}${national}`;
          fc.pre(!known.fillsNoSlotFromPrefix(c.d, text, 0));
          const pasted = pasteOverAll(c.subject, focus(c.subject), text);
          expect(pasted.start).toBeGreaterThanOrEqual(c.d.prefix.length);
        }
      )
    );
  });
});
