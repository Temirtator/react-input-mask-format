import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { useMask } from "../../src/index";
import { kzIban, kzPlate, ruPhone, ruPlate, uzPhone, uzPlate, kgPhone, kzPhone } from "../../src/presets";
import type { MaskPreset } from "../../src/presets";

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

  it("ruPlate KNOWN LIMITATION: deleting a middle character drops the tail", async () => {
    const user = userEvent.setup();
    render(<InputMask {...ruPlate} data-testid="plate" />);
    const input = screen.getByTestId("plate") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("a123bc77");
    input.setSelectionRange(3, 3);
    await selectionSettled();
    await user.keyboard("{Backspace}");
    // README documents this (no placeholder => rest shifts left, misfit chars dropped);
    // a core fix is a follow-up.
    expect(input.value).toBe("А 237 ");
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

describe("Uzbekistan presets on InputMask", () => {
  it("uzPhone: typing a national number starting with 9", async () => {
    const user = userEvent.setup();
    render(<InputMask {...uzPhone} data-testid="uz-phone" />);
    const input = screen.getByTestId("uz-phone") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("901234567");
    expect(input.value).toBe("+998 (90) 123-45-67");
  });

  it("uzPhone: pasting a national number starting with 9", async () => {
    const user = userEvent.setup();
    render(<InputMask {...uzPhone} data-testid="uz-phone" />);
    const input = screen.getByTestId("uz-phone") as HTMLInputElement;
    await user.click(input);
    await user.paste("901234567");
    expect(input.value).toBe("+998 (90) 123-45-67");
  });

  it("uzPhone: pasting an international or domestic-8 number", async () => {
    const user = userEvent.setup();
    for (const pasted of ["+998 90 123 45 67", "998901234567", "8 90 123 45 67"]) {
      const { unmount } = render(<InputMask {...uzPhone} data-testid="uz-phone" />);
      const input = screen.getByTestId("uz-phone") as HTMLInputElement;
      await user.click(input);
      await user.paste(pasted);
      expect(input.value).toBe("+998 (90) 123-45-67");
      unmount();
    }
  });

  it("uzPhone KNOWN LIMITATION: typing the country code key by key fills the operator code", async () => {
    // Without look-ahead a typed 9 cannot be told apart from an operator-code 9. README documents it.
    const user = userEvent.setup();
    render(<InputMask {...uzPhone} data-testid="uz-phone" />);
    const input = screen.getByTestId("uz-phone") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("998901234567");
    expect(input.value).toBe("+998 (99) 890-12-34");
  });

  it("uzPhone: paste after typing keeps the typed digits", async () => {
    const user = userEvent.setup();
    render(<InputMask {...uzPhone} data-testid="uz-phone" />);
    const input = screen.getByTestId("uz-phone") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("90");
    await user.paste("1234567");
    expect(input.value).toBe("+998 (90) 123-45-67");
  });

  it("uzPhone: a full international value set programmatically formats correctly", () => {
    render(<InputMask {...uzPhone} value="+998901234567" onChange={() => {}} data-testid="uz-phone" />);
    expect((screen.getByTestId("uz-phone") as HTMLInputElement).value).toBe("+998 (90) 123-45-67");
  });

  it("uzPlate: lowercase letters are uppercased", async () => {
    const user = userEvent.setup();
    render(<InputMask {...uzPlate} data-testid="uz-plate" />);
    const input = screen.getByTestId("uz-plate") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("01a123bc");
    expect(input.value).toBe("01 A 123 BC");
  });
});

describe("Kyrgyzstan presets on InputMask", () => {
  it("kgPhone: typing with the domestic leading 0", async () => {
    const user = userEvent.setup();
    render(<InputMask {...kgPhone} data-testid="kg-phone" />);
    const input = screen.getByTestId("kg-phone") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("0555123456");
    expect(input.value).toBe("+996 (555) 12-34-56");
  });

  it("kgPhone: pasting a domestic 0555 number", async () => {
    const user = userEvent.setup();
    render(<InputMask {...kgPhone} data-testid="kg-phone" />);
    const input = screen.getByTestId("kg-phone") as HTMLInputElement;
    await user.click(input);
    await user.paste("0555 12 34 56");
    expect(input.value).toBe("+996 (555) 12-34-56");
  });

  it("kgPhone: typing an operator code starting with 9", async () => {
    const user = userEvent.setup();
    render(<InputMask {...kgPhone} data-testid="kg-phone" />);
    const input = screen.getByTestId("kg-phone") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("995123456");
    expect(input.value).toBe("+996 (995) 12-34-56");
  });

  it("kgPhone: pasting an international number", async () => {
    const user = userEvent.setup();
    render(<InputMask {...kgPhone} data-testid="kg-phone" />);
    const input = screen.getByTestId("kg-phone") as HTMLInputElement;
    await user.click(input);
    await user.paste("+996 555 12 34 56");
    expect(input.value).toBe("+996 (555) 12-34-56");
  });
});

// The mask tracks the selection in a requestAnimationFrame loop, so let it observe setSelectionRange.
const selectionSettled = () => new Promise<void>((resolve) => setTimeout(resolve, 50));

function HookedInput({ preset }: { preset: MaskPreset }) {
  const ref = useMask(preset);
  return <input ref={ref} data-testid="hooked" />;
}

describe("prefix-aware paste across presets", () => {
  const cases: Array<[string, MaskPreset, string, string]> = [
    ["kzPhone international", kzPhone, "+7 701 123 45 67", "+7 (701) 123-45-67"],
    ["kzPhone domestic 8", kzPhone, "8 701 123 45 67", "+7 (701) 123-45-67"],
    ["ruPhone domestic 8", ruPhone, "89123456789", "+7 (912) 345-67-89"],
    ["ruPhone international", ruPhone, "+7 912 345-67-89", "+7 (912) 345-67-89"],
    ["kzIban full IBAN", kzIban, "KZ86 125K ZT50 0410 0100", "KZ86 125K ZT50 0410 0100"]
  ];
  for (const [name, preset, pasted, expected] of cases) {
    it(name, async () => {
      const user = userEvent.setup();
      render(<InputMask {...preset} data-testid="p" />);
      const input = screen.getByTestId("p") as HTMLInputElement;
      await user.click(input);
      await user.paste(pasted);
      expect(input.value).toBe(expected);
    });
  }

  it("uzPhone filled: select all + paste an international number", async () => {
    const user = userEvent.setup();
    render(<InputMask {...uzPhone} data-testid="p" />);
    const input = screen.getByTestId("p") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("901234567");
    input.setSelectionRange(0, input.value.length);
    await selectionSettled();
    await user.paste("+998 91 765 43 21");
    expect(input.value).toBe("+998 (91) 765-43-21");
  });

  it("kgPhone filled: select all + paste an international number", async () => {
    const user = userEvent.setup();
    render(<InputMask {...kgPhone} data-testid="p" />);
    const input = screen.getByTestId("p") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("555123456");
    input.setSelectionRange(0, input.value.length);
    await selectionSettled();
    await user.paste("+996 700 98 76 54");
    expect(input.value).toBe("+996 (700) 98-76-54");
  });

  it("uzPhone filled: select all + paste a bare national number", async () => {
    const user = userEvent.setup();
    render(<InputMask {...uzPhone} data-testid="p" />);
    const input = screen.getByTestId("p") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("901234567");
    input.setSelectionRange(0, input.value.length);
    await selectionSettled();
    await user.paste("91 765 43 21");
    expect(input.value).toBe("+998 (91) 765-43-21");
  });

  it("uzPhone empty: paste at cursor 0", async () => {
    const user = userEvent.setup();
    render(<InputMask {...uzPhone} data-testid="p" />);
    const input = screen.getByTestId("p") as HTMLInputElement;
    await user.click(input);
    input.setSelectionRange(0, 0);
    await selectionSettled();
    await user.paste("+998 91 765 43 21");
    expect(input.value).toBe("+998 (91) 765-43-21");
  });

  it("ruPhone filled: select all + paste an international number", async () => {
    const user = userEvent.setup();
    render(<InputMask {...ruPhone} data-testid="p" />);
    const input = screen.getByTestId("p") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("9123456789");
    input.setSelectionRange(0, input.value.length);
    await selectionSettled();
    await user.paste("+7 912 345-67-89");
    expect(input.value).toBe("+7 (912) 345-67-89");
  });

  it("useMask gets the same fix", async () => {
    const user = userEvent.setup();
    render(<HookedInput preset={uzPhone} />);
    const input = screen.getByTestId("hooked") as HTMLInputElement;
    await user.click(input);
    await user.paste("+998 90 123 45 67");
    expect(input.value).toBe("+998 (90) 123-45-67");
  });
});
