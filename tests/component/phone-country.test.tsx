import React, { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask from "../../src/index";
import { phonePresets, detectPhoneCountry } from "../../src/presets";
import type { PhoneCountry } from "../../src/presets";

function PhoneField() {
  const [country, setCountry] = useState<PhoneCountry>("KZ");
  const [phone, setPhone] = useState("");
  return (
    <>
      <select
        data-testid="country"
        value={country}
        onChange={e => {
          setCountry(e.target.value as PhoneCountry);
          setPhone("");
        }}
      >
        {Object.keys(phonePresets).map(code => (
          <option key={code}>{code}</option>
        ))}
      </select>
      <InputMask
        {...phonePresets[country]}
        value={phone}
        onChange={e => setPhone(e.target.value)}
        onPaste={e => {
          const text = e.clipboardData.getData("text");
          const detected = detectPhoneCountry(text);
          if (detected && detected !== country) {
            e.preventDefault();
            setCountry(detected);
            setPhone(text);
          }
        }}
        data-testid="phone"
      />
    </>
  );
}

describe("phone field with a country picker", () => {
  it("switches the country when a number of another country is pasted", async () => {
    const user = userEvent.setup();
    render(<PhoneField />);
    const input = screen.getByTestId("phone") as HTMLInputElement;
    await user.click(input);
    await user.paste("+998 90 123 45 67");
    expect((screen.getByTestId("country") as HTMLSelectElement).value).toBe("UZ");
    expect(input.value).toBe("+998 (90) 123-45-67");
  });

  it("keeps the country for a number of the same country", async () => {
    const user = userEvent.setup();
    render(<PhoneField />);
    const input = screen.getByTestId("phone") as HTMLInputElement;
    await user.click(input);
    await user.paste("+7 701 234 56 78");
    expect((screen.getByTestId("country") as HTMLSelectElement).value).toBe("KZ");
    expect(input.value).toBe("+7 (701) 234-56-78");
  });

  it("tells Russian and Kazakh +7 numbers apart", async () => {
    const user = userEvent.setup();
    render(<PhoneField />);
    const input = screen.getByTestId("phone") as HTMLInputElement;
    await user.click(input);
    await user.paste("+7 912 345-67-89");
    expect((screen.getByTestId("country") as HTMLSelectElement).value).toBe("RU");
    expect(input.value).toBe("+7 (912) 345-67-89");
  });

  it("clears the number when the country is picked by hand", async () => {
    const user = userEvent.setup();
    render(<PhoneField />);
    const input = screen.getByTestId("phone") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("01234");
    await user.selectOptions(screen.getByTestId("country"), "GE");
    expect(input.value).toBe("");
    await user.click(input);
    await user.keyboard("555123456");
    expect(input.value).toBe("+995 (555) 12-34-56");
  });
});
