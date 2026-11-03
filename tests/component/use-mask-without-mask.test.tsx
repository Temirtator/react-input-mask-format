import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { useMask } from "../../src/index";
import type { InputMaskProps, UseMaskOptions } from "../../src/types";

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

function Component(props: UseMaskOptions & { onChange?: (value: string) => void }) {
  const { onChange, ...rest } = props;
  return (
    <InputMask
      {...(rest as InputMaskProps)}
      data-testid="field"
      onChange={e => onChange?.((e.target as HTMLInputElement).value)}
    />
  );
}

function Hook(props: UseMaskOptions & { onChange?: (value: string) => void }) {
  const { onChange, ...rest } = props;
  const ref = useMask(rest);
  return <input ref={ref} data-testid="field" onChange={e => onChange?.((e.target as HTMLInputElement).value)} />;
}

describe.each([
  ["InputMask", Component],
  ["useMask", Hook]
] as const)("without a mask: %s", (_name, Field) => {
  it("works as a plain input", async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    render(<Field mask={null} onChange={v => seen.push(v)} />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("ab12{Backspace}");
    expect(input.value).toBe("ab1");
    expect(seen).toEqual(["a", "ab", "ab1", "ab12", "ab1"]);
    await user.tab();
    expect(input.value).toBe("ab1");
  });

  it("works with no options at all", async () => {
    const user = userEvent.setup();
    render(<Field />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("x y");
    expect(input.value).toBe("x y");
  });

  it("applies a mask that arrives later", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Field mask={null} />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1234");
    rerender(<Field mask="99/99/99" />);
    expect(input.value).toBe("12/34/__");
    await user.keyboard("56");
    expect(input.value).toBe("12/34/56");
  });

  it("keeps the text when the mask is removed", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Field mask="99/99" />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1234");
    rerender(<Field mask={null} />);
    expect(input.value).toBe("12/34");
    await nextFrame();
    await user.keyboard("x");
    expect(input.value).toBe("12/34x");
  });
});
