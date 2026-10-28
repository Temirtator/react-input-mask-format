import type { MaskSetup } from "./subject";

export type Position = { kind: "literal"; char: string } | { kind: "slot"; regex: RegExp };

export interface MaskDescription {
  positions: Position[];
  placeholder: string | null;
  prefix: string;
  significant: string;
  transform: (char: string, position: number) => string;
}

export const TOKENS: Record<string, RegExp> = { "9": /[0-9]/, a: /[A-Za-z]/, "*": /[A-Za-z0-9]/ };

function parsePositions(setup: MaskSetup): Position[] {
  if (Array.isArray(setup.mask)) {
    return setup.mask.map(part =>
      typeof part === "string" ? { kind: "literal", char: part } : { kind: "slot", regex: part }
    );
  }
  const tokens = setup.formatChars ?? TOKENS;
  const positions: Position[] = [];
  let escaped = false;
  for (const char of setup.mask) {
    if (!escaped && char === "\\") {
      escaped = true;
      continue;
    }
    positions.push(!escaped && tokens[char] ? { kind: "slot", regex: tokens[char] } : { kind: "literal", char });
    escaped = false;
  }
  return positions;
}

function resolvePlaceholder(setup: MaskSetup, positions: Position[]): string | null {
  const placeholder = setup.maskPlaceholder === undefined ? "_" : setup.maskPlaceholder;
  if (!placeholder) {
    return null;
  }
  return positions
    .map((position, i) => (position.kind === "literal" ? position.char : placeholder.length === 1 ? placeholder : placeholder[i]))
    .join("");
}

function resolveTransform(setup: MaskSetup): (char: string, position: number) => string {
  const { transform } = setup;
  if (transform === "uppercase") {
    return char => char.toUpperCase();
  }
  if (transform === "lowercase") {
    return char => char.toLowerCase();
  }
  return typeof transform === "function" ? transform : char => char;
}

export function describeMask(setup: MaskSetup): MaskDescription {
  const positions = parsePositions(setup);
  const firstSlot = positions.findIndex(position => position.kind === "slot");
  const prefix = positions
    .slice(0, firstSlot === -1 ? positions.length : firstSlot)
    .map(position => (position as { char: string }).char)
    .join("");
  return {
    positions,
    placeholder: resolvePlaceholder(setup, positions),
    prefix,
    significant: prefix.replace(/[^0-9A-Za-z]/g, ""),
    transform: resolveTransform(setup)
  };
}

export function slotIndices(d: MaskDescription): number[] {
  return d.positions.flatMap((position, i) => (position.kind === "slot" ? [i] : []));
}

export function accepts(d: MaskDescription, position: number, char: string): boolean {
  const slot = d.positions[position];
  return slot?.kind === "slot" && new RegExp(slot.regex).test(d.transform(char, position));
}

export function isFilledSlot(d: MaskDescription, value: string, position: number): boolean {
  const slot = d.positions[position];
  return slot?.kind === "slot" && position < value.length && new RegExp(slot.regex).test(value[position]);
}

export function hasShape(d: MaskDescription, value: string): boolean {
  const length = d.positions.length;
  if (value.length > length || (d.placeholder !== null && value.length !== length)) {
    return false;
  }
  if (d.placeholder === null && value.length < length && d.positions[value.length].kind !== "slot") {
    return false;
  }
  return value.split("").every((char, i) => {
    const position = d.positions[i];
    if (position.kind === "literal") {
      return char === position.char;
    }
    return (d.placeholder !== null && char === d.placeholder[i]) || new RegExp(position.regex).test(char);
  });
}

export function isGapFree(d: MaskDescription, value: string): boolean {
  const filled = slotIndices(d).map(i => isFilledSlot(d, value, i));
  return filled.every((isFilled, k) => isFilled || filled.slice(k).every(next => !next));
}

export function firstEmptySlot(d: MaskDescription, value: string): number | null {
  const slots = slotIndices(d);
  const lastFilled = slots.reduce((last, i) => (isFilledSlot(d, value, i) ? i : last), -1);
  const next = slots.find(i => i > lastFilled);
  return next === undefined ? null : next;
}

export function literalChars(d: MaskDescription): string[] {
  return [...new Set(d.positions.flatMap(position => (position.kind === "literal" ? [position.char] : [])))];
}
