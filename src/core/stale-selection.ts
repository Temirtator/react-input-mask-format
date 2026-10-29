import type { InputState } from "../types";

function explainsEdit(previous: string, next: string, start: number, end: number, caret: number | null): boolean {
  const head = previous.slice(0, start);
  const tail = previous.slice(end);
  if (next.startsWith(head) && next.endsWith(tail) && next.length >= head.length + tail.length) {
    return caret === null || caret >= next.length - tail.length;
  }
  if (start !== end || next.length >= previous.length) {
    return false;
  }
  const kept = next.length - tail.length;
  if (kept >= 0 && next.endsWith(tail) && previous.startsWith(next.slice(0, kept))) {
    return true;
  }
  return next.startsWith(head) && previous.endsWith(next.slice(start));
}

export function resolveStaleSelection(
  previous: InputState,
  current: InputState
): { previous: InputState; current: InputState } {
  const start = previous.selection.start ?? 0;
  const end = previous.selection.end ?? start;
  if (explainsEdit(previous.value, current.value, start, end, current.selection.start)) {
    return { previous, current };
  }
  const length = current.value.length;
  return {
    previous: { ...previous, selection: { start: 0, end: previous.value.length, length: previous.value.length } },
    current: { ...current, selection: { start: length, end: length, length: 0 } }
  };
}
