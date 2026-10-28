import { describe, it, expect } from "vitest";
import { fc, holds, maskCase, actionsFor, textFor, acceptedCharFor, type MaskCase } from "./arbitraries";
import { firstEmptySlot, hasShape, isFilledSlot, isGapFree, literalChars, slotIndices } from "./description";
import { known } from "./known";
import { caretAt, focus, insert, apply, pasteOverAll, run, typeString, type Action, type Field } from "./driver";

function settled(c: MaskCase, field: Field): void {
  expect(hasShape(c.d, field.value)).toBe(true);
  expect(c.subject.format(field.value)).toBe(field.value);
}

function caretInBounds(c: MaskCase, field: Field): void {
  expect(field.start).toBe(field.end);
  expect(field.start).toBeGreaterThanOrEqual(c.d.prefix.length);
  expect(field.start).toBeLessThanOrEqual(c.d.positions.length);
}

const withActions = maskCase.chain(c => fc.tuple(fc.constant(c), actionsFor(c)));
const placeholderCase = maskCase.filter(c => c.d.placeholder !== null);
const placeholderWithActions = placeholderCase.chain(c => fc.tuple(fc.constant(c), actionsFor(c)));

function lastField(c: MaskCase, actions: Action[]): Field {
  const fields = run(c.subject, actions);
  return fields[fields.length - 1];
}

describe("editing", () => {
  it("E1 every state is of the mask's shape and a fixed point of formatValue", () => {
    holds(fc.property(withActions, ([c, actions]) => run(c.subject, actions).forEach(field => settled(c, field))));
  });

  it("E2 the caret stays collapsed and inside the editable part after every edit", () => {
    holds(
      fc.property(withActions, ([c, actions]) => {
        const fields = run(c.subject, actions);
        caretInBounds(c, fields[0]);
        actions.forEach((action, i) => {
          const text = action.kind === "type" ? action.char : action.kind === "paste" || action.kind === "autofill" ? action.text : null;
          if (text !== null) {
            const caretAfterEvent = action.kind === "autofill" ? text.length : fields[i].start + text.length;
            if (known.fillsNoSlotFromPrefix(c.d, text, Math.min(fields[i].start, caretAfterEvent))) {
              return;
            }
          }
          if (["type", "paste", "autofill", "backspace", "del", "focus"].includes(action.kind) && fields[i + 1] !== fields[i]) {
            caretInBounds(c, fields[i + 1]);
          }
        });
      })
    );
  });

  it("E3 typing from focus equals formatting the prefix and the typed text", () => {
    holds(
      fc.property(maskCase.chain(c => fc.tuple(fc.constant(c), textFor(c))), ([c, text]) => {
        fc.pre(!known.slotLikeLiteral(c.d) && !known.containsPlaceholder(c.d, text));
        expect(typeString(c.subject, focus(c.subject), text).value).toBe(c.subject.format(c.d.prefix + text));
      })
    );
  });

  it("E4 text no slot accepts leaves the value unchanged", () => {
    const junk = (c: MaskCase) =>
      fc.string({
        unit: fc.constantFrom(..."!@$%&=~?".split("").filter(ch => !literalChars(c.d).includes(ch) && !c.d.placeholder?.includes(ch))),
        minLength: 1,
        maxLength: 6
      });
    holds(
      fc.property(
        maskCase.chain(c => fc.tuple(fc.constant(c), actionsFor(c), junk(c))),
        ([c, actions, text]) => {
          const fields = run(c.subject, actions);
          const field = fields[fields.length - 1];
          fc.pre(!known.selectionFromPrefix(c.d, field));
          expect(insert(c.subject, field, text).value).toBe(field.value);
        }
      )
    );
  });

  it("E5 typing into the first empty slot and backspace restores the value", () => {
    holds(
      fc.property(
        placeholderWithActions.chain(([c, actions]) => {
          const field = lastField(c, actions);
          const slot = firstEmptySlot(c.d, field.value);
          return fc.tuple(fc.constant(c), fc.constant(field), fc.constant(slot), slot === null ? fc.constant(null) : acceptedCharFor(c, slot));
        }),
        ([c, field, slot, char]) => {
          fc.pre(slot !== null && char !== null && !known.slotLikeLiteral(c.d));
          const typed = insert(c.subject, caretAt(field, slot!), char!);
          expect(typed.value).not.toBe(field.value);
          const back = apply(c.subject, typed, { kind: "backspace" });
          expect(back.value).toBe(field.value);
        }
      )
    );
  });

  it("E5b typing an accepted character overwrites exactly the first slot at or after the caret", () => {
    holds(
      fc.property(
        placeholderWithActions.chain(([c, actions]) => {
          const field = lastField(c, actions);
          return fc.integer({ min: c.d.prefix.length, max: Math.max(c.d.prefix.length, field.value.length - 1) }).chain(caret => {
            const slot = slotIndices(c.d).find(i => i >= caret) ?? null;
            return fc.tuple(fc.constant(c), fc.constant(field), fc.constant(caret), fc.constant(slot), slot === null ? fc.constant(null) : acceptedCharFor(c, slot));
          });
        }),
        ([c, field, caret, slot, char]) => {
          fc.pre(slot !== null && char !== null && !known.slotLikeLiteral(c.d));
          const typed = insert(c.subject, caretAt(field, caret), char!);
          const expected = field.value.slice(0, slot!) + c.d.transform(char!, slot!) + field.value.slice(slot! + 1);
          expect(typed.value).toBe(expected);
        }
      )
    );
  });

  it("E6 backspace clears exactly the nearest slot left of the caret", () => {
    holds(
      fc.property(
        placeholderWithActions.chain(([c, actions]) =>
          fc.tuple(fc.constant(c), fc.constant(actions), fc.double({ min: 0, max: 1, noNaN: true }))
        ),
        ([c, actions, where]) => {
          const fields = run(c.subject, actions);
          const field = fields[fields.length - 1];
          const caret = c.d.prefix.length + 1 + Math.floor(where * (field.value.length - c.d.prefix.length));
          const slot = [...slotIndices(c.d)].reverse().find(i => i < caret);
          fc.pre(slot !== undefined && caret <= field.value.length);
          const back = apply(c.subject, caretAt(field, caret), { kind: "backspace" });
          const expected = field.value.slice(0, slot!) + c.d.placeholder![slot!] + field.value.slice(slot! + 1);
          expect(back.value).toBe(expected);
        }
      )
    );
  });

  it("E7 select all and paste of a gap-free formatted value keeps it", () => {
    holds(
      fc.property(
        maskCase.chain(c => fc.tuple(fc.constant(c), actionsFor(c), textFor(c))),
        ([c, actions, text]) => {
          const formatted = c.subject.format(text);
          fc.pre(
            isGapFree(c.d, formatted) &&
              slotIndices(c.d).some(i => isFilledSlot(c.d, formatted, i)) &&
              !known.slotLikeLiteral(c.d) &&
              !known.prefixOverflows(c.d, formatted)
          );
          const fields = run(c.subject, actions);
          expect(pasteOverAll(c.subject, fields[fields.length - 1], formatted).value).toBe(formatted);
        }
      )
    );
  });

  it("E8 any change event, with any stale selection, settles into a valid state", () => {
    holds(
      fc.property(
        maskCase.chain(c =>
          fc.tuple(fc.constant(c), actionsFor(c), textFor(c, 30), fc.nat(), fc.nat(), fc.nat())
        ),
        ([c, actions, value, a, b, caret]) => {
          const fields = run(c.subject, actions);
          const field = fields[fields.length - 1];
          const start = Math.min(a, b) % (field.value.length + 1);
          const end = Math.min(field.value.length, start + (Math.max(a, b) % (field.value.length + 1)));
          const at = caret % (value.length + 1);
          fc.pre(!known.caretInsideInsertion({ ...field, start, end }, value, at));
          const next = c.subject.change(
            { value, selection: { start: at, end: at } },
            { value: field.value, selection: { start, end, length: end - start } }
          );
          expect(next.selection.start).not.toBeNull();
          expect(next.selection.end).not.toBeNull();
          const result = { value: next.value, start: next.selection.start!, end: next.selection.end! };
          settled(c, result);
          if (!known.fillsNoSlotFromPrefix(c.d, value, Math.min(start, at))) {
            caretInBounds(c, result);
          }
        }
      )
    );
  });
});
