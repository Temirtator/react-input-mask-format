import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { useMask } from "../../src/index";
import { kzPhone, uzPhone } from "../../src/presets";
import type { InputMaskProps, UseMaskOptions } from "../../src/types";

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
] as const)("%s", (_name, Field) => {
  it("autofill over a partly typed value after the field was left replaces it", async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    render(<Field {...kzPhone} onChange={v => seen.push(v)} />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("01");
    expect(input.value).toBe("+7 (701) ___-__-__");
    await user.tab();
    fireEvent.input(input, { target: { value: "+7 777 987 65 43" } });
    expect(input.value).toBe("+7 (777) 987-65-43");
    expect(seen[seen.length - 1]).toBe("+7 (777) 987-65-43");
  });

  it("pasting a partial international number fills the national slots", async () => {
    const user = userEvent.setup();
    render(<Field {...uzPhone} />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.paste("+998 90 123 45 6");
    expect(input.value).toBe("+998 (90) 123-45-6_");
  });
});

describe("InputMask controlled value", () => {
  it("formats a partial international value", () => {
    render(<InputMask {...kzPhone} value="+7 777 987 65 4" onChange={() => {}} data-testid="kz" />);
    expect((screen.getByTestId("kz") as HTMLInputElement).value).toBe("+7 (777) 987-65-4_");
  });
});
