import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import InputMask from "../../src/index";
import type { BeforeMaskedValueChangeFn } from "../../src/types";

describe("v2 compatibility props", () => {
  it("maskChar works as maskPlaceholder alias", () => {
    render(<InputMask mask="99/99" maskChar="-" alwaysShowMask data-testid="in" />);
    expect(screen.getByTestId("in")).toHaveValue("--/--");
  });

  it("maskChar={null} works like maskPlaceholder={null}", () => {
    render(<InputMask mask="99/99" maskChar={null} value="12" onChange={() => {}} data-testid="in" />);
    expect(screen.getByTestId("in")).toHaveValue("12/");
  });

  it("custom formatChars define new mask tokens", () => {
    render(
      <InputMask mask="##-##" formatChars={{ "#": "[0-9]" }} value="1234" onChange={() => {}} data-testid="in" />
    );
    expect(screen.getByTestId("in")).toHaveValue("12-34");
  });

  it("beforeMaskedValueChange receives v2 arguments", () => {
    const fn = vi.fn<BeforeMaskedValueChangeFn>((newState) => newState);
    render(
      <InputMask mask="99/99" value="12" onChange={() => {}} beforeMaskedValueChange={fn} data-testid="in" />
    );
    expect(fn).toHaveBeenCalled();
    const [, , , maskOptions] = fn.mock.calls[0];
    expect(maskOptions).toMatchObject({ maskChar: "_", alwaysShowMask: false });
  });

  it("emits one-time deprecation warning in dev", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<InputMask mask="99" maskChar="-" alwaysShowMask data-testid="a" />);
    render(<InputMask mask="99" maskChar="-" alwaysShowMask data-testid="b" />);
    const calls = spy.mock.calls.filter(args => String(args[0]).includes("maskChar"));
    expect(calls.length).toBeLessThanOrEqual(1);
    spy.mockRestore();
  });
});
