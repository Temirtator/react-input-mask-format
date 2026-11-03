import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { useMask } from "../../src/index";

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

function Component({ defaultValue }: { defaultValue?: string }) {
  return (
    <form data-testid="form">
      <InputMask mask="99/99/9999" defaultValue={defaultValue} data-testid="field" />
    </form>
  );
}

function Hook({ defaultValue }: { defaultValue?: string }) {
  const ref = useMask({ mask: "99/99/9999" });
  return (
    <form data-testid="form">
      <input ref={ref} defaultValue={defaultValue} data-testid="field" />
    </form>
  );
}

describe.each([
  ["InputMask", Component],
  ["useMask", Hook]
] as const)("%s", (_name, Field) => {
  it("form reset brings back the formatted default value", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="12122020" />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(input.value).toBe("12/12/2020");
    await user.click(input);
    input.setSelectionRange(10, 10);
    await user.keyboard("{Backspace}{Backspace}");
    expect(input.value).toBe("12/12/20__");
    await user.tab();
    form.reset();
    await nextFrame();
    expect(input.value).toBe("12/12/2020");
    await user.click(input);
    await nextFrame();
    expect(input.selectionStart).toBe(10);
    await user.keyboard("{Backspace}");
    expect(input.value).toBe("12/12/202_");
  });

  it("puts the caret at the end of a full value written without an event", async () => {
    const user = userEvent.setup();
    render(<Field />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    input.value = "12345678";
    await user.click(input);
    await nextFrame();
    expect(input.value).toBe("12/34/5678");
    expect([input.selectionStart, input.selectionEnd]).toEqual([10, 10]);
    await user.keyboard("{Backspace}");
    expect(input.value).toBe("12/34/567_");
  });
});
