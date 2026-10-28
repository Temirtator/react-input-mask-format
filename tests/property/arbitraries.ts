import { expect } from "vitest";
import fc from "fast-check";
import { createSubject, extendedFormatChars, presets, type MaskSetup, type Subject } from "./subject";
import { accepts, describeMask, literalChars, TOKENS, type MaskDescription } from "./description";
import { describeAction, type Action } from "./driver";

const env = process.env;
fc.configureGlobal({
  numRuns: Number(env.FC_NUM_RUNS ?? 100),
  ...(env.FC_SEED ? { seed: Number(env.FC_SEED) } : {}),
  ...(env.FC_PATH ? { path: env.FC_PATH } : {})
});

export { fc };

export interface MaskCase {
  name: string;
  setup: MaskSetup;
  d: MaskDescription;
  subject: Subject;
}

export type Part = { kind: "literal"; char: string } | { kind: "slot"; token: string };

const LITERALS = [" ", "-", "(", ")", "/", ".", "+", "K", "Z", "7", "9"];
const BASIC_TOKENS = ["9", "a", "*"];
const EXTENDED_TOKENS = ["A", "Я", "#"];
const PLACEHOLDER_CHARS = ["_", "•", " "];

export interface GeneratedMask {
  parts: Part[];
  extended: boolean;
  asArray: boolean;
  placeholder: "default" | "underscore" | "none" | "full";
  fullPlaceholder: string[];
  uppercase: boolean;
}

function named<T extends object>(value: T, name: string): T {
  return Object.assign(value, { [fc.toStringMethod]: () => name });
}

function toCase(name: string, setup: MaskSetup): MaskCase {
  return named({ name, setup, d: describeMask(setup), subject: createSubject(setup) }, name);
}

export function renderMask(mask: GeneratedMask): MaskSetup {
  const tokens = mask.extended ? extendedFormatChars : TOKENS;
  const setup: MaskSetup = {
    mask: mask.asArray
      ? mask.parts.map(part => (part.kind === "literal" ? part.char : tokens[part.token]))
      : mask.parts.map(part => (part.kind === "slot" ? part.token : tokens[part.char] ? `\\${part.char}` : part.char)).join("")
  };
  if (mask.extended && !mask.asArray) {
    setup.formatChars = extendedFormatChars;
  }
  if (mask.placeholder === "underscore") {
    setup.maskPlaceholder = "_";
  } else if (mask.placeholder === "none") {
    setup.maskPlaceholder = null;
  } else if (mask.placeholder === "full") {
    setup.maskPlaceholder = mask.parts
      .map((part, i) => (part.kind === "literal" ? part.char : mask.fullPlaceholder[i % mask.fullPlaceholder.length]))
      .join("");
  }
  if (mask.uppercase) {
    setup.transform = "uppercase";
  }
  return setup;
}

const prefixLiteralPart = fc.constantFrom(" ", "-", "(", ")", "/", ".").map((char): Part => ({ kind: "literal", char }));
const slotPart = fc.constantFrom(...BASIC_TOKENS, ...EXTENDED_TOKENS).map((token): Part => ({ kind: "slot", token }));
const literalPart = fc.constantFrom(...LITERALS).map((char): Part => ({ kind: "literal", char }));

export const generatedMask: fc.Arbitrary<GeneratedMask> = fc
  .record({
    plus: fc.boolean(),
    prefix: fc.array(prefixLiteralPart, { maxLength: 4 }),
    first: slotPart,
    body: fc.array(
      fc.oneof(
        { weight: 3, arbitrary: slotPart },
        { weight: 1, arbitrary: literalPart }
      ),
      { maxLength: 11 }
    ),
    asArray: fc.boolean(),
    placeholder: fc.constantFrom("default" as const, "underscore" as const, "none" as const, "full" as const),
    fullPlaceholder: fc.array(fc.constantFrom(...PLACEHOLDER_CHARS), { minLength: 1, maxLength: 4 }),
    uppercase: fc.boolean()
  })
  .map(({ plus, prefix, first, body, ...rest }) => {
    const parts: Part[] = [...(plus ? [{ kind: "literal", char: "+" } as Part] : []), ...prefix, first, ...body];
    const extended = parts.some(part => part.kind === "slot" && EXTENDED_TOKENS.includes(part.token));
    return { parts, extended, ...rest, asArray: rest.asArray || rest.placeholder === "full" };
  });

const curated: Array<{ name: string; setup: MaskSetup }> = [
  { name: "us phone", setup: { mask: "+1 (999) 999-9999" } },
  { name: "ru trunk phone", setup: { mask: "8 (999) 999-99-99" } },
  { name: "uk phone", setup: { mask: "+44 9999 999999" } },
  { name: "de iban", setup: { mask: "DE99 9999 9999 9999 9999 99" } },
  { name: "by phone", setup: { mask: "+375 (99) 999-99-99" } },
  { name: "order id", setup: { mask: "ORD-999999", maskPlaceholder: null } }
];
export const presetCase: fc.Arbitrary<MaskCase> = fc.constantFrom(...[...presets, ...curated].map(({ name, setup }) => toCase(name, setup)));

export const generatedCase: fc.Arbitrary<MaskCase> = generatedMask.map(mask => {
  const setup = renderMask(mask);
  return toCase(`generated ${JSON.stringify({ ...setup, formatChars: setup.formatChars ? "extended" : undefined }, (_, v) => (v instanceof RegExp ? v.toString() : v))}`, setup);
});

export const maskCase: fc.Arbitrary<MaskCase> = fc.oneof(presetCase, generatedCase);

const ALPHABET = "0123456789abcxyzABCXYZавсАВСЕ_+ -()!#".split("");

export function charFor(c: MaskCase): fc.Arbitrary<string> {
  return fc.constantFrom(...new Set([...ALPHABET, ...literalChars(c.d)]));
}

export function textFor(c: MaskCase, maxLength = 25): fc.Arbitrary<string> {
  return fc.string({ unit: charFor(c), maxLength });
}

export function acceptedCharFor(c: MaskCase, slot: number): fc.Arbitrary<string | null> {
  const candidates = ALPHABET.filter(char => accepts(c.d, slot, char) && !literalChars(c.d).includes(char));
  return candidates.length ? fc.constantFrom(...candidates) : fc.constant(null);
}

export const digits: fc.Arbitrary<string> = fc.string({ unit: fc.constantFrom(..."0123456789".split("")), maxLength: 15 });

const fraction = fc.double({ min: 0, max: 1, noNaN: true });

export function actionFor(c: MaskCase): fc.Arbitrary<Action> {
  return fc
    .oneof(
      { weight: 4, arbitrary: charFor(c).map((char): Action => ({ kind: "type", char })) },
      { weight: 2, arbitrary: textFor(c).map((text): Action => ({ kind: "paste", text })) },
      { weight: 1, arbitrary: textFor(c).map((text): Action => ({ kind: "autofill", text })) },
      { weight: 1, arbitrary: fc.tuple(fraction, fraction).map(([from, to]): Action => ({ kind: "select", from, to })) },
      { weight: 1, arbitrary: fc.constant<Action>({ kind: "selectAll" }) },
      { weight: 1, arbitrary: fraction.map((at): Action => ({ kind: "moveCaret", at })) },
      { weight: 2, arbitrary: fc.constant<Action>({ kind: "backspace" }) },
      { weight: 1, arbitrary: fc.constant<Action>({ kind: "del" }) }
    )
    .map(action => named({ ...action }, describeAction(action)));
}

export function actionsFor(c: MaskCase): fc.Arbitrary<Action[]> {
  return fc.array(actionFor(c), { maxLength: 20 });
}

export function holds<T extends unknown[]>(property: fc.IProperty<T>): void {
  if (env.FC_STATS) {
    const details = fc.check(property);
    console.log(`STATS ${expect.getState().currentTestName}: runs=${details.numRuns} skips=${details.numSkips}`);
  }
  fc.assert(property);
}
