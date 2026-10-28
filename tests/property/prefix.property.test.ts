import { describe, it, expect } from "vitest";
import { fc, holds, maskCase, digits } from "./arbitraries";
import { known } from "./known";
import { slotIndices } from "./description";
import { focus, pasteOverAll, typeString } from "./driver";

const plusCase = maskCase.filter(c => c.d.prefix.startsWith("+") && c.d.significant.length > 0);
const prefixedCase = maskCase.filter(c => c.d.significant.length > 0);

describe("prefix masks", () => {
  it("X1 pasting +<country code> <digits> equals typing the digits", () => {
    holds(
      fc.property(plusCase.chain(c => fc.tuple(fc.constant(c), digits)), ([c, national]) => {
        fc.pre(national.length <= slotIndices(c.d).length);
        const pasted = pasteOverAll(c.subject, focus(c.subject), `+${c.d.significant} ${national}`);
        expect(pasted.value).toBe(typeString(c.subject, focus(c.subject), national).value);
      })
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
            fc.integer({ min: 1, max: c.d.significant.length }),
            digits
          )
        ),
        ([c, plus, length, national]) => {
          const text = `${plus ? "+" : ""}${c.d.significant.slice(0, length)}${national}`;
          fc.pre(!known.fillsNoSlot(c.d, text));
          const pasted = pasteOverAll(c.subject, focus(c.subject), text);
          expect(pasted.start).toBeGreaterThanOrEqual(c.d.prefix.length);
        }
      )
    );
  });
});
