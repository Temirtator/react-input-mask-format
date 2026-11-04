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
])("%s with the caret moved to the end of a focused field", (_, renderField) => {
  it("keeps the characters typed after the caret is moved to the end", async () => {
    const user = userEvent.setup();
    render(renderField());
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await nextFrame();
    await user.keyboard("01");
    expect(input).toHaveValue("+7 (701) ___-__-__");
    input.setSelectionRange(18, 18);
    await nextFrame();
    await user.keyboard("2345678");
    expect(input).toHaveValue("+7 (701) 234-56-78");
  });
});
