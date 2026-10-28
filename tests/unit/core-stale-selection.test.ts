import { describe, it, expect } from "vitest";
import { resolveStaleSelection } from "../../src/core/stale-selection";
import type { InputState, Selection } from "../../src/types";

const state = (value: string, selection: Selection): InputState => ({ value, selection });
const caret = (position: number): Selection => ({ start: position, end: position });

describe("resolveStaleSelection keeps an explained edit", () => {
  it.each<[string, InputState, InputState]>([
    ["typing at the caret", state("12/3_/____", caret(4)), state("12/34_/____", caret(5))],
    ["replacing a selection", state("12/34/5678", { start: 0, end: 10 }), state("9", caret(1))],
    ["backspace", state("12/34/5678", caret(5)), state("12/3/5678", caret(4))],
    ["delete", state("12/34/5678", caret(3)), state("12/4/5678", caret(3))],
    ["repeated characters", state("aa", caret(1)), state("aaa", caret(2))],
    ["empty previous value", state("", { start: null, end: null }), state("+7 701 123 45 67", caret(16))],
    ["IME composition extending the text", state("+7 (701) 1__-__-__", caret(10)), state("+7 (701) 12__-__-__", caret(11))]
  ])("%s", (_name, previous, current) => {
    const resolved = resolveStaleSelection(previous, current);
    expect(resolved.previous).toBe(previous);
    expect(resolved.current).toBe(current);
  });
});

describe("resolveStaleSelection widens a stale selection to the whole value", () => {
  it.each<[string, InputState, InputState]>([
    ["autofill over a partly typed value, caret left at 9", state("+7 (701) ___-__-__", caret(9)), state("+7 777 987 65 43", caret(16))],
    ["focused fill on an empty prefixed field, caret 5", state("+7 (7__) ___-__-__", caret(5)), state("+7 701 123 45 67", caret(16))],
    ["controlled value replaced while the selection is unknown", state("+7 (701) 123-45-67", { start: null, end: null }), state("+7 777 987 65 43", caret(16))],
    ["IME rewrite in the middle", state("+7 (701) 123-45-67", caret(12)), state("+7 (701) 199-45-67", caret(12))]
  ])("%s", (_name, previous, current) => {
    const resolved = resolveStaleSelection(previous, current);
    expect(resolved.previous).toEqual({
      value: previous.value,
      selection: { start: 0, end: previous.value.length, length: previous.value.length }
    });
    expect(resolved.current).toEqual({
      value: current.value,
      selection: { start: current.value.length, end: current.value.length, length: 0 }
    });
  });
});
