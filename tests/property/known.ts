import type { MaskDescription } from "./description";
import type { Field } from "./driver";

function literalsAfterFirstSlot(d: MaskDescription): string[] {
  const firstSlot = d.positions.findIndex(position => position.kind === "slot");
  return d.positions.slice(firstSlot).flatMap(position => (position.kind === "literal" ? [position.char] : []));
}

export const known = {
  slotLikeLiteral(d: MaskDescription): boolean {
    const slots = d.positions.flatMap(position => (position.kind === "slot" ? [position.regex] : []));
    return literalsAfterFirstSlot(d).some(char => slots.some(regex => new RegExp(regex).test(char)));
  },
  overlapsCountryCode(d: MaskDescription, digits: string): boolean {
    return digits.length > 0 && d.significant.includes(digits[0]);
  },
  fillsNoSlot(d: MaskDescription, text: string): boolean {
    return text.length > 0 && text.split("").every(char => d.prefix.includes(char) || !!d.placeholder?.includes(char));
  },
  containsPlaceholder(d: MaskDescription, text: string): boolean {
    return d.placeholder !== null && d.positions.some((position, i) => position.kind === "slot" && text.includes(d.placeholder![i]));
  },
  prefixOverflows(d: MaskDescription, text: string): boolean {
    const slots = d.positions.filter(position => position.kind === "slot");
    const filled = text
      .slice(d.prefix.length)
      .split("")
      .filter((char, i) => {
        const position = d.positions[d.prefix.length + i];
        return position?.kind === "slot" && new RegExp(position.regex).test(char);
      }).length;
    return (
      !!d.significant &&
      !d.prefix.startsWith("+") &&
      text.startsWith(d.prefix) &&
      d.significant.length + filled > slots.length
    );
  },
  caretInsideInsertion(previous: Field, value: string, caret: number): boolean {
    const head = previous.value.slice(0, previous.start);
    const tail = previous.value.slice(previous.end);
    const explained = value.length >= head.length + tail.length && value.startsWith(head) && value.endsWith(tail);
    return explained && caret !== value.length - tail.length;
  },
  selectionFromPrefix(d: MaskDescription, field: Field): boolean {
    return field.start < d.prefix.length && field.end > field.start;
  }
};
