import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { useMask } from "../../src/index";
import { kzIban, kzPlate, ruPhone, ruPlate, uzPhone, uzPlate, kgPhone, kzPhone } from "../../src/presets";
import type { MaskPreset } from "../../src/presets";

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

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

  it("ruPlate: deleting a middle character leaves a gap and keeps the rest", async () => {
    const user = userEvent.setup();
    render(<InputMask {...ruPlate} data-testid="plate" />);
    const input = screen.getByTestId("plate") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("a123bc77");
    input.setSelectionRange(3, 3);
    await nextFrame();
    await user.keyboard("{Backspace}");
    expect(input.value).toBe("А _23 ВС 77_");
    await user.keyboard("9");
    expect(input.value).toBe("А 923 ВС 77_");
  });

  it("ruPlate: partial 2-digit region survives blur (controlled)", async () => {
    const user = userEvent.setup();
    render(<ControlledRuPlate />);
    const input = screen.getByTestId("ru-plate") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("a123bc77");
    await user.click(screen.getByRole("button", { name: "next" }));
    expect(input.value).toBe("А 123 ВС 77_");
  });

  it("ruPlate: partial 2-digit region survives blur (uncontrolled)", async () => {
    const user = userEvent.setup();
    render(<><InputMask {...ruPlate} data-testid="plate" /><button type="button">next</button></>);
    const input = screen.getByTestId("plate") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("a123bc77");
    await user.click(screen.getByRole("button", { name: "next" }));
    expect(input.value).toBe("А 123 ВС 77_");
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

// The mask tracks the selection in a requestAnimationFrame loop; its callback is queued earlier
// in the same frame, so one frame lets it observe setSelectionRange.

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
    await nextFrame();
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
    await nextFrame();
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
    await nextFrame();
    await user.paste("91 765 43 21");
    expect(input.value).toBe("+998 (91) 765-43-21");
  });

  it("uzPhone empty: paste at cursor 0", async () => {
    const user = userEvent.setup();
    render(<InputMask {...uzPhone} data-testid="p" />);
    const input = screen.getByTestId("p") as HTMLInputElement;
    await user.click(input);
    input.setSelectionRange(0, 0);
    await nextFrame();
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
    await nextFrame();
    await user.paste("+7 912 345-67-89");
    expect(input.value).toBe("+7 (912) 345-67-89");
  });

  // Retyping over a selected value: the first key continues the prefix when it matches the
  // prefix's next letter/digit ("+" and other literals are skipped).
  const retypeCases: Array<[string, MaskPreset, string, string, string]> = [
    ["kzPhone with country code", kzPhone, "7011234567", "77779876543", "+7 (777) 987-65-43"],
    ["kzPhone national", kzPhone, "7771234567", "7019876543", "+7 (701) 987-65-43"],
    ["ruPhone with country code", ruPhone, "9123456789", "79876543210", "+7 (987) 654-32-10"],
    ["uzPhone with country code", uzPhone, "901234567", "998917654321", "+998 (91) 765-43-21"],
    ["kgPhone with country code", kgPhone, "555123456", "996700987654", "+996 (700) 98-76-54"],
    ["uzPhone national not starting with 9", uzPhone, "901234567", "331234567", "+998 (33) 123-45-67"]
  ];
  it("KNOWN LIMITATION: select all + typing a national number that starts with the prefix's next digit", async () => {
    // Key by key, uzPhone "9…" and kzPhone "77…" cannot be told apart from the country code; same as 2.6.0.
    // README documents it; paste and programmatic values are not affected.
    const user = userEvent.setup();
    for (const [preset, initial, typed, expected] of [
      [uzPhone, "331234567", "901234567", "+998 (01) 234-56-7_"],
      [kzPhone, "7011234567", "7779876543", "+7 (779) 876-54-3_"]
    ] as Array<[MaskPreset, string, string, string]>) {
      const { unmount } = render(<InputMask {...preset} data-testid="p" />);
      const input = screen.getByTestId("p") as HTMLInputElement;
      await user.click(input);
      await user.keyboard(initial);
      input.setSelectionRange(0, input.value.length);
      await nextFrame();
      await user.keyboard(typed);
      expect(input.value).toBe(expected);
      unmount();
    }
  });

  for (const [name, preset, initial, typed, expected] of retypeCases) {
    it(`filled: select all + type ${name}`, async () => {
      const user = userEvent.setup();
      render(<InputMask {...preset} data-testid="p" />);
      const input = screen.getByTestId("p") as HTMLInputElement;
      await user.click(input);
      await user.keyboard(initial);
      input.setSelectionRange(0, input.value.length);
      await nextFrame();
      await user.keyboard(typed);
      expect(input.value).toBe(expected);
    });
  }

  it("kzIban filled: select all + type k clears to the prefix", async () => {
    const user = userEvent.setup();
    render(<InputMask {...kzIban} data-testid="p" />);
    const input = screen.getByTestId("p") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("86125kzt5004100100");
    input.setSelectionRange(0, input.value.length);
    await nextFrame();
    await user.keyboard("k");
    expect(input.value).toBe("KZ__ ____ ____ ____ ____");
  });

  it("kzIban filled: select all + type k7 leaves no stale tail", async () => {
    const user = userEvent.setup();
    render(<InputMask {...kzIban} data-testid="p" />);
    const input = screen.getByTestId("p") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("86125kzt5004100100");
    input.setSelectionRange(0, input.value.length);
    await nextFrame();
    await user.keyboard("k7");
    expect(input.value).toBe("KZ7_ ____ ____ ____ ____");
  });

  it("kzIban filled: select all + paste a lowercase IBAN", async () => {
    const user = userEvent.setup();
    render(<InputMask {...kzIban} data-testid="p" />);
    const input = screen.getByTestId("p") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("86125kzt5004100100");
    input.setSelectionRange(0, input.value.length);
    await nextFrame();
    await user.paste("kz86125kzt5004100100");
    expect(input.value).toBe("KZ86 125K ZT50 0410 0100");
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

function DigitsOnlyInput({ mask }: { mask: MaskPreset["mask"] }) {
  const [value, setValue] = React.useState("");
  return (
    <InputMask
      mask={mask}
      value={value}
      onChange={e => setValue(e.target.value.replace(/\D/g, ""))}
      data-testid="digits"
    />
  );
}

describe("prefix-aware controlled and autofill input", () => {
  const typed: Array<[string, MaskPreset["mask"], string, string]> = [
    ["uzPhone", uzPhone.mask, "901234567", "+998 (90) 123-45-67"],
    ["kgPhone", kgPhone.mask, "555123456", "+996 (555) 12-34-56"],
    ["kzPhone", kzPhone.mask, "011234567", "+7 (701) 123-45-67"],
    ["custom +1 mask", "+1 (999) 999-9999", "5551234567", "+1 (555) 123-4567"]
  ];
  for (const [name, mask, keys, expected] of typed) {
    it(`digits-only controlled ${name}: typing key by key keeps the number`, async () => {
      const user = userEvent.setup();
      render(<DigitsOnlyInput mask={mask} />);
      const input = screen.getByTestId("digits") as HTMLInputElement;
      await user.click(input);
      await user.keyboard(keys);
      expect(input.value).toBe(expected);
    });
  }

  it("controlled kzPhone: a stored 10-digit national number starting with 77 is shown in full", () => {
    render(<InputMask mask={kzPhone.mask} maskPlaceholder="_" value="7771234567" onChange={() => {}} data-testid="p" />);
    expect((screen.getByTestId("p") as HTMLInputElement).value).toBe("+7 (777) 123-45-67");
  });

  it("uncontrolled uzPhone: unfocused change with an international number", () => {
    render(<InputMask {...uzPhone} data-testid="p" />);
    const input = screen.getByTestId("p") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "+998901234567" } });
    expect(input.value).toBe("+998 (90) 123-45-67");
  });

  it("uncontrolled uzPhone: unfocused change with a bare national number", () => {
    render(<InputMask {...uzPhone} data-testid="p" />);
    const input = screen.getByTestId("p") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "901234567" } });
    expect(input.value).toBe("+998 (90) 123-45-67");
  });

  it("uncontrolled kgPhone: unfocused change with an international number", () => {
    render(<InputMask {...kgPhone} data-testid="p" />);
    const input = screen.getByTestId("p") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "+996555123456" } });
    expect(input.value).toBe("+996 (555) 12-34-56");
  });

  it("useMask uzPhone: unfocused input with an international number", () => {
    // useMask listens to the native "input" event (autofill fires it); fireEvent.change would not reach it
    render(<HookedInput preset={uzPhone} />);
    const input = screen.getByTestId("hooked") as HTMLInputElement;
    fireEvent.input(input, { target: { value: "+998901234567" } });
    expect(input.value).toBe("+998 (90) 123-45-67");
  });
});
