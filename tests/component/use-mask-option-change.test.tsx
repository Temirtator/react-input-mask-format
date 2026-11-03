import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { useMask } from "../../src/index";
import { kzPhone, uzPhone } from "../../src/presets";
import type { InputMaskProps, UseMaskOptions } from "../../src/types";

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

function Component(props: UseMaskOptions) {
  return <InputMask {...(props as InputMaskProps)} data-testid="field" />;
}

function Hook(props: UseMaskOptions) {
  const ref = useMask(props);
  return <input ref={ref} data-testid="field" />;
}

describe.each([
  ["InputMask", Component],
  ["useMask", Hook]
] as const)("option change: %s", (_name, Field) => {
  it("re-lays out a focused value when the mask changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Field mask="99/99" />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1234");
    rerender(<Field mask="99-99-99" />);
    expect(input.value).toBe("12-34-__");
    await user.keyboard("56");
    expect(input.value).toBe("12-34-56");
  });

  it("re-lays out a blurred value when the mask changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Field mask="99/99" />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1234");
    await user.tab();
    rerender(<Field mask="9999 99" />);
    expect(input.value).toBe("1234 __");
  });

  it("follows a placeholder change", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Field mask="99/99" />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1");
    rerender(<Field mask="99/99" maskPlaceholder="-" />);
    expect(input.value).toBe("1-/--");
  });

  it("shows and hides the template with alwaysShowMask", () => {
    const { rerender } = render(<Field mask="99/99" />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    expect(input.value).toBe("");
    rerender(<Field mask="99/99" alwaysShowMask />);
    expect(input.value).toBe("__/__");
    rerender(<Field mask="99/99" />);
    expect(input.value).toBe("");
  });

  it("switches between phone presets", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Field {...kzPhone} />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await nextFrame();
    await user.keyboard("0123");
    expect(input.value).toBe("+7 (701) 23_-__-__");
    rerender(<Field {...uzPhone} />);
    expect(input.value).toBe("+998 (77) 012-3_-__");
  });

  it("keeps the value and caret when the options do not change", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Field mask="99/99" />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("12");
    input.setSelectionRange(1, 1);
    rerender(<Field mask="99/99" />);
    expect(input.value).toBe("12/__");
    expect(input.selectionStart).toBe(1);
  });
});
