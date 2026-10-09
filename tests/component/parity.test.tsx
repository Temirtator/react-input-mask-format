import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { useMask } from "../../src/index";
import { kzPhone, ruPhone, uzPhone, kgPhone } from "../../src/presets";
import type { InputMaskProps, UseMaskOptions } from "../../src/types";

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

type Options = UseMaskOptions & { alwaysShowMask?: boolean };

function Component(props: Options & { onChange?: (value: string) => void }) {
  const { onChange, ...rest } = props;
  return (
    <InputMask
      {...(rest as InputMaskProps)}
      data-testid="field"
      onChange={e => onChange?.((e.target as HTMLInputElement).value)}
    />
  );
}

function Hook(props: Options & { onChange?: (value: string) => void }) {
  const { onChange, ...rest } = props;
  const ref = useMask(rest);
  return (
    <input
      ref={ref}
      data-testid="field"
      onChange={e => onChange?.((e.target as HTMLInputElement).value)}
    />
  );
}

async function selectAll(input: HTMLInputElement) {
  input.setSelectionRange(0, input.value.length);
  await nextFrame();
}

describe.each([
  ["InputMask", Component],
  ["useMask", Hook]
] as const)("parity: %s", (_name, Field) => {
  it("masks typed characters", async () => {
    const user = userEvent.setup();
    render(<Field mask="99/99/9999" />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("12345678");
    expect(input.value).toBe("12/34/5678");
  });

  it("fires onChange with the masked value", async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    render(<Field mask="99/99/9999" onChange={v => seen.push(v)} />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("12");
    expect(seen[seen.length - 1]).toBe("12/__/____");
  });

  it("shows the mask on focus and clears an empty value on blur", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Field mask="99/99" />
        <button type="button">other</button>
      </>
    );
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    expect(input.value).toBe("__/__");
    await user.click(screen.getByRole("button"));
    expect(input.value).toBe("");
  });

  it("keeps an empty mask on blur with alwaysShowMask", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Field mask="99/99" alwaysShowMask />
        <button type="button">other</button>
      </>
    );
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.click(screen.getByRole("button"));
    expect(input.value).toBe("__/__");
  });

  it("applies beforeMaskedStateChange on change", async () => {
    const user = userEvent.setup();
    const before = vi.fn(({ nextState }) => ({
      ...nextState,
      value: nextState.value.replace(/_/g, "-")
    }));
    render(<Field mask="99/99" beforeMaskedStateChange={before} />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1");
    expect(input.value).toBe("1-/--");
    const changeCall = before.mock.calls.find(([arg]) => arg.previousState !== undefined);
    expect(changeCall).toBeDefined();
    expect(Object.keys(changeCall![0]).sort()).toEqual(["currentState", "nextState", "previousState"]);
  });

  it("applies transform and RegExp formatChars", async () => {
    const user = userEvent.setup();
    render(<Field mask="AAA" formatChars={{ A: /[A-Z]/ }} transform="uppercase" />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("abc");
    expect(input.value).toBe("ABC");
  });

  const retypeCases: Array<[string, Options, string, string, string]> = [
    ["kzPhone with country code", kzPhone, "7011234567", "77779876543", "+7 (777) 987-65-43"],
    ["kzPhone national", kzPhone, "7771234567", "7019876543", "+7 (701) 987-65-43"],
    ["ruPhone with country code", ruPhone, "9123456789", "79876543210", "+7 (987) 654-32-10"],
    ["uzPhone with country code", uzPhone, "901234567", "998917654321", "+998 (91) 765-43-21"],
    ["kgPhone with country code", kgPhone, "555123456", "996700987654", "+996 (700) 98-76-54"],
    ["uzPhone national not starting with 9", uzPhone, "901234567", "331234567", "+998 (33) 123-45-67"]
  ];
  for (const [name, preset, initial, typed, expected] of retypeCases) {
    it(`select all + type: ${name}`, async () => {
      const user = userEvent.setup();
      render(<Field {...preset} />);
      const input = screen.getByTestId("field") as HTMLInputElement;
      await user.click(input);
      await user.keyboard(initial);
      await selectAll(input);
      await user.keyboard(typed);
      expect(input.value).toBe(expected);
    });
  }

  it("select all + paste replaces the value", async () => {
    const user = userEvent.setup();
    render(<Field {...kzPhone} />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("7011234567");
    await selectAll(input);
    await user.paste("+7 701 555 44 33");
    expect(input.value).toBe("+7 (701) 555-44-33");
  });

  it("select all + delete empties the slots", async () => {
    const user = userEvent.setup();
    render(<Field mask="99/99" />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1234");
    await selectAll(input);
    await user.keyboard("{Backspace}");
    expect(input.value).toBe("__/__");
  });
});
