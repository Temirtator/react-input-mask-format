import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { useMask } from "../../src/index";

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

const mask = "+7 (999) 999-99-99";

type FieldProps = { defaultValue: string; selectOnFocus: boolean };

function Component({ defaultValue, selectOnFocus }: FieldProps) {
  return (
    <InputMask
      mask={mask}
      defaultValue={defaultValue}
      data-testid="field"
      onFocus={selectOnFocus ? e => e.target.select() : undefined}
    />
  );
}

function Hook({ defaultValue, selectOnFocus }: FieldProps) {
  const ref = useMask({ mask });
  return (
    <input
      ref={ref}
      defaultValue={defaultValue}
      data-testid="field"
      onFocus={selectOnFocus ? e => e.target.select() : undefined}
    />
  );
}

describe.each([
  ["InputMask", Component],
  ["useMask", Hook]
] as const)("select on focus: %s", (_name, Field) => {
  it("keeps the selection made by onFocus on a partly filled value", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="777" selectOnFocus />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await nextFrame();
    expect(input.value).toBe("+7 (777) ___-__-__");
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, input.value.length]);
    await user.keyboard("9");
    expect(input.value).toBe("+7 (9__) ___-__-__");
  });

  it("puts the caret on the first slot of an empty value even with onFocus selection", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="" selectOnFocus />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await nextFrame();
    expect([input.selectionStart, input.selectionEnd]).toEqual([4, 4]);
    await user.keyboard("777");
    expect(input.value).toBe("+7 (777) ___-__-__");
  });

  it("still moves the caret to the first empty slot without onFocus selection", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="777" selectOnFocus={false} />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await nextFrame();
    expect([input.selectionStart, input.selectionEnd]).toEqual([9, 9]);
  });
});
