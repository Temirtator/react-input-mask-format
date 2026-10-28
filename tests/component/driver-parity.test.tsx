import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask from "../../src/index";
import * as presets from "../../src/presets";
import type { InputMaskProps } from "../../src/types";
import { createSubject, type MaskSetup } from "../property/subject";
import { apply, caretAt, focus, type Field } from "../property/driver";

type Step =
  | { type: string }
  | { paste: string }
  | { selectAll: true }
  | { select: [number, number] }
  | { caret: number }
  | { backspace: true }
  | { del: true }
  | { blur: true }
  | { autofill: string };

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

type Outcome = { value: string; caret: number | null };

async function inComponent(setup: MaskSetup, steps: Step[]): Promise<Outcome> {
  const user = userEvent.setup();
  render(
    <>
      <InputMask {...(setup as InputMaskProps)} data-testid="field" />
      <button type="button">other</button>
    </>
  );
  const input = screen.getByTestId("field") as HTMLInputElement;
  await user.click(input);
  await nextFrame();
  for (const step of steps) {
    if ("type" in step) {
      await user.keyboard(step.type);
    } else if ("paste" in step) {
      await user.paste(step.paste);
    } else if ("selectAll" in step) {
      input.setSelectionRange(0, input.value.length);
      await nextFrame();
    } else if ("select" in step) {
      input.setSelectionRange(step.select[0], step.select[1]);
      await nextFrame();
    } else if ("caret" in step) {
      input.setSelectionRange(step.caret, step.caret);
      await nextFrame();
    } else if ("backspace" in step) {
      await user.keyboard("{Backspace}");
    } else if ("del" in step) {
      await user.keyboard("{Delete}");
    } else if ("blur" in step) {
      await user.click(screen.getByRole("button"));
    } else if ("autofill" in step) {
      fireEvent.input(input, { target: { value: step.autofill } });
    }
  }
  return { value: input.value, caret: input.selectionStart };
}

function inDriver(setup: MaskSetup, steps: Step[]): Outcome {
  const subject = createSubject(setup);
  let field: Field = focus(subject);
  for (const step of steps) {
    if ("type" in step) {
      field = step.type.split("").reduce((current, char) => apply(subject, current, { kind: "type", char }), field);
    } else if ("paste" in step) {
      field = apply(subject, field, { kind: "paste", text: step.paste });
    } else if ("selectAll" in step) {
      field = apply(subject, field, { kind: "selectAll" });
    } else if ("select" in step) {
      field = { ...field, start: step.select[0], end: step.select[1] };
    } else if ("caret" in step) {
      field = caretAt(field, step.caret);
    } else if ("backspace" in step) {
      field = apply(subject, field, { kind: "backspace" });
    } else if ("del" in step) {
      field = apply(subject, field, { kind: "del" });
    } else if ("blur" in step) {
      continue;
    } else if ("autofill" in step) {
      field = apply(subject, field, { kind: "autofill", text: step.autofill });
    }
  }
  return { value: field.value, caret: field.start };
}

const sequences: Array<[string, MaskSetup, Step[]]> = [
  ["kzPhone typing with a leading 7", presets.kzPhone, [{ type: "7011234567" }]],
  ["card select all + type", presets.card, [{ type: "4111" }, { selectAll: true }, { type: "5" }]],
  ["uzPhone international paste", presets.uzPhone, [{ paste: "+998 90 123 45 67" }]],
  ["kzPhone backspace", presets.kzPhone, [{ type: "701" }, { backspace: true }]],
  ["card overwrite in the middle", presets.card, [{ type: "1234" }, { caret: 2 }, { type: "9" }]],
  ["card partial selection + type", presets.card, [{ type: "12345678" }, { select: [2, 7] }, { type: "9" }]],
  ["kzIban uppercase", presets.kzIban, [{ type: "12123abc" }]],
  ["ruPlate transform", presets.ruPlate, [{ type: "a123bc77" }]],
  ["kzPhone autofill after blur", presets.kzPhone, [{ type: "01" }, { blur: true }, { autofill: "+7 777 987 65 43" }]],
  ["date delete in the middle", { mask: "99/99/9999" }, [{ type: "12312024" }, { caret: 3 }, { del: true }]],
  ["kgPhone select all + domestic paste", presets.kgPhone, [{ type: "555" }, { selectAll: true }, { paste: "0555 12 34 56" }]]
];

describe("driver parity with InputMask", () => {
  it.each(sequences)("%s", async (_name, setup, steps) => {
    expect(inDriver(setup, steps)).toEqual(await inComponent(setup, steps));
  });
});
