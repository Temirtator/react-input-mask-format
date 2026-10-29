import { accepts, slotIndices } from "./description";
import type { MaskDescription } from "./description";

function literalsAfterFirstSlot(d: MaskDescription): string[] {
  const firstSlot = d.positions.findIndex(position => position.kind === "slot");
  return d.positions.slice(firstSlot).flatMap(position => (position.kind === "literal" ? [position.char] : []));
}

export const known = {
  slotLikeLiteral(d: MaskDescription): boolean {
    const slots = slotIndices(d);
    return literalsAfterFirstSlot(d).some(char => slots.some(i => accepts(d, i, char) || d.placeholder?.[i] === char));
  },
  entersPrefixStart(d: MaskDescription, text: string, start: number): boolean {
    if (start >= d.prefix.length || !text.length) {
      return false;
    }
    let at = start;
    for (const char of text.toUpperCase()) {
      const found = d.prefix.slice(at).toUpperCase().indexOf(char);
      if (found < 0) {
        return false;
      }
      at += found + 1;
    }
    return /[0-9A-Za-z]/.test(d.prefix.slice(at));
  }
};
