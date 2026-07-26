import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask from "../../src/index";
import { kzIban, kzPlate } from "../../src/presets";

describe("preset spread onto InputMask", () => {
  it("kzIban uppercases typed account letters", async () => {
    const user = userEvent.setup();
    render(<InputMask {...kzIban} data-testid="iban" />);
    const input = screen.getByTestId("iban") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("86125kzt5004100100");
    expect(input.value).toBe("KZ86 125K ZT50 0410 0100");
  });

  it("kzPlate uppercases and restricts letters", async () => {
    const user = userEvent.setup();
    render(<InputMask {...kzPlate} data-testid="plate" />);
    const input = screen.getByTestId("plate") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("123abc02");
    expect(input.value).toBe("123 ABC 02");
  });
});
