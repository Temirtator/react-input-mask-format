import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { useMask } from "../../src/index";
import { kzPhone } from "../../src/presets";

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

function Hook() {
  const ref = useMask(kzPhone);
  return <input ref={ref} data-testid="field" />;
}

describe.each([
  ["InputMask", () => <InputMask {...kzPhone} data-testid="field" />],
  ["useMask", () => <Hook />]
])("%s paste into a partly filled kzPhone", (_, renderField) => {
  const partlyFilled = async () => {
    const user = userEvent.setup();
    render(renderField());
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await nextFrame();
    await user.keyboard("01");
    expect(input).toHaveValue("+7 (701) ___-__-__");
    return { user, input };
  };

  it("replaces the value with a complete international number pasted after the filled part", async () => {
    const { user, input } = await partlyFilled();
    expect(input.selectionStart).toBe(9);
    await user.paste("+7 701 234 56 78");
    expect(input).toHaveValue("+7 (701) 234-56-78");
    expect(input.selectionStart).toBe(18);
  });

  it("replaces the value with a complete international number pasted at the end", async () => {
    const { user, input } = await partlyFilled();
    input.setSelectionRange(18, 18);
    await nextFrame();
    await user.paste("+7 701 234 56 78");
    expect(input).toHaveValue("+7 (701) 234-56-78");
    expect(input.selectionStart).toBe(18);
  });

  it("keeps inserting an incomplete international number at the caret", async () => {
    const { user, input } = await partlyFilled();
    await user.paste("+7 701 234");
    expect(input).toHaveValue("+7 (701) 770-12-34");
  });
});
