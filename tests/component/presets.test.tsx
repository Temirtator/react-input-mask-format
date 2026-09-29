import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask from "../../src/index";
import { kzIban, kzPlate, ruPhone, ruPlate } from "../../src/presets";

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

function ControlledRuPlate() {
  const [value, setValue] = React.useState("");
  return (
    <>
      <InputMask
        {...ruPlate}
        value={value}
        onChange={e => setValue(e.target.value)}
        data-testid="ru-plate"
      />
      <button type="button">next</button>
    </>
  );
}

describe("Russia presets on InputMask", () => {
  it("ruPlate: Latin typing becomes Cyrillic", async () => {
    const user = userEvent.setup();
    render(<InputMask {...ruPlate} data-testid="plate" />);
    const input = screen.getByTestId("plate") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("a123bc777");
    expect(input.value).toBe("А 123 ВС 777");
  });

  it("ruPlate: partial 2-digit region survives blur (controlled)", async () => {
    const user = userEvent.setup();
    render(<ControlledRuPlate />);
    const input = screen.getByTestId("ru-plate") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("a123bc77");
    await user.click(screen.getByRole("button", { name: "next" }));
    expect(input.value).toBe("А 123 ВС 77");
  });

  it("ruPlate: partial 2-digit region survives blur (uncontrolled)", async () => {
    const user = userEvent.setup();
    render(<><InputMask {...ruPlate} data-testid="plate" /><button type="button">next</button></>);
    const input = screen.getByTestId("plate") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("a123bc77");
    await user.click(screen.getByRole("button", { name: "next" }));
    expect(input.value).toBe("А 123 ВС 77");
  });

  it("ruPhone: a typed leading 7 is skipped", async () => {
    const user = userEvent.setup();
    render(<InputMask {...ruPhone} data-testid="phone" />);
    const input = screen.getByTestId("phone") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("79123456789");
    expect(input.value).toBe("+7 (912) 345-67-89");
  });
});
