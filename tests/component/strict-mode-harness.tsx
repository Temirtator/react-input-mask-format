import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export type Options = Record<string, unknown>;
export type Emit = (value: unknown) => void;
export type FieldProps = Options & { emit: Emit };
export type Field = (props: FieldProps) => React.ReactElement;

export type Timing = { delay: number | null; settle: () => Promise<void> };

export const frames: Timing = {
  delay: 0,
  settle: () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
};
export const microtasks: Timing = { delay: null, settle: () => Promise.resolve() };

export type Step =
  | { focus: true }
  | { blur: true }
  | { type: string }
  | { paste: string }
  | { selectAll: true }
  | { caret: number }
  | { external: true }
  | { write: string }
  | { rerender: Options };

export type Row = [string, Options, Step[], string, number?];
export type Suite = [string, Field, Row[], Timing];

type Snapshot = { value: string; start: number | null; end: number | null };
type Outcome = { trace: Snapshot[]; emitted: unknown[]; errors: string[] };

export const focus: Step = { focus: true };
export const blur: Step = { blur: true };
export const selectAll: Step = { selectAll: true };
export const external: Step = { external: true };
export const type = (keys: string): Step => ({ type: keys });
export const paste = (text: string): Step => ({ paste: text });
export const caret = (at: number): Step => ({ caret: at });
export const write = (value: string): Step => ({ write: value });
export const rerender = (next: Options): Step => ({ rerender: next });

async function run(Field: Field, timing: Timing, options: Options, steps: Step[], strict: boolean): Promise<Outcome> {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const emitted: unknown[] = [];
    const emit: Emit = value => {
      emitted.push(value);
    };
    const ui = (current: Options) => (
      <>
        <Field {...current} emit={emit} />
        <button type="button">other</button>
      </>
    );
    const user = userEvent.setup({ delay: timing.delay });
    let current = options;
    const view = render(ui(current), { wrapper: strict ? React.StrictMode : undefined });
    const scope = within(view.container);
    const input = scope.getByTestId("field") as HTMLInputElement;
    await timing.settle();
    const snapshot = (): Snapshot => ({
      value: input.value,
      start: input.selectionStart,
      end: input.selectionEnd
    });
    const trace = [snapshot()];
    for (const step of steps) {
      if ("focus" in step) {
        await user.click(input);
        await timing.settle();
      } else if ("blur" in step) {
        await user.click(scope.getByText("other"));
        await timing.settle();
      } else if ("type" in step) {
        await user.keyboard(step.type);
      } else if ("paste" in step) {
        await user.paste(step.paste);
      } else if ("selectAll" in step) {
        input.setSelectionRange(0, input.value.length);
        await timing.settle();
      } else if ("caret" in step) {
        input.setSelectionRange(step.caret, step.caret);
        await timing.settle();
      } else if ("external" in step) {
        fireEvent.click(scope.getByText("external"));
      } else if ("write" in step) {
        input.value = step.write;
      } else {
        current = { ...current, ...step.rerender };
        view.rerender(ui(current));
      }
      trace.push(snapshot());
    }
    view.unmount();
    return { trace, emitted, errors: spy.mock.calls.map(call => String(call[0])) };
  } finally {
    spy.mockRestore();
  }
}

export function compareStrictMode(suites: Suite[]): void {
  describe.each(suites)("StrictMode: %s", (_name, Field, rows, timing) => {
    it.each(rows)("%s", async (_row, options, steps, expected, calls) => {
      const plain = await run(Field, timing, options, steps, false);
      const strict = await run(Field, timing, options, steps, true);
      expect(plain.trace[plain.trace.length - 1].value).toBe(expected);
      if (calls !== undefined) expect(plain.emitted).toHaveLength(calls);
      expect(plain.errors).toEqual([]);
      expect(strict).toEqual(plain);
    });
  });
}
