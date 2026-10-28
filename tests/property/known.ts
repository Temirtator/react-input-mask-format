import { accepts, isFilledSlot, slotIndices } from "./description";
import type { MaskDescription } from "./description";

function literalsAfterFirstSlot(d: MaskDescription): string[] {
  const firstSlot = d.positions.findIndex(position => position.kind === "slot");
  return d.positions.slice(firstSlot).flatMap(position => (position.kind === "literal" ? [position.char] : []));
}

export const known = {
  slotLikeLiteral(d: MaskDescription): boolean {
    const slots = slotIndices(d);
    return literalsAfterFirstSlot(d).some(char => slots.some(i => accepts(d, i, char)));
  },
  entersPrefixStart(d: MaskDescription, text: string, start: number): boolean {
    return [start, 0].some(from => {
      if (from >= d.prefix.length || !text.length) {
        return false;
      }
      let at = from;
      for (const char of text.toUpperCase()) {
        const found = d.prefix.slice(at).toUpperCase().indexOf(char);
        if (found < 0) {
          return false;
        }
        at += found + 1;
      }
      return /[0-9A-Za-z]/.test(d.prefix.slice(at));
    });
  },
  containsPlaceholder(d: MaskDescription, text: string): boolean {
    return d.placeholder !== null && d.positions.some((position, i) => position.kind === "slot" && text.includes(d.placeholder![i]));
  },
  prefixOverflows(d: MaskDescription, text: string): boolean {
    const slots = slotIndices(d);
    const filled = text
      .slice(d.prefix.length)
      .split("")
      .filter((_, i) => isFilledSlot(d, text, d.prefix.length + i)).length;
    const readable = d.significant.split("").some(char => slots.some(i => accepts(d, i, char)));
    return (
      !!d.significant &&
      readable &&
      !d.prefix.startsWith("+") &&
      text.startsWith(d.prefix) &&
      d.significant.length + filled > slots.length
    );
  }
};
