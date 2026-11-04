import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { useMask, isMaskComplete, formatMask } from "../../src/index";
import { vin, ruPlate } from "../../src/presets";
import { NumberFormat, formatNumber, parseNumber } from "../../src/number";
import { CardExpiryFormat, formatCardExpiry, parseCardExpiry } from "../../src/card";
import { DateFormat } from "../../src/date";

function field(): HTMLInputElement {
  return screen.getByTestId("field") as HTMLInputElement;
}

describe("decimal separators from other scripts", () => {
  it("are read as the decimal point", async () => {
    expect(formatNumber("١٢٫٥", { thousandSeparator: "," })).toBe("12.5");
    expect(parseNumber("١٬٢٣٤٫٥", { thousandSeparator: "," }).floatValue).toBe(1234.5);
    expect(formatNumber("１２．５", {})).toBe("12.5");
    render(<NumberFormat thousandSeparator="," decimalScale={2} prefix="$ " data-testid="field" />);
    await userEvent.type(field(), "۱۲٫۵");
    expect(field()).toHaveValue("$ 12.5");
  });
});

describe("masks that accept Arabic-Indic or Persian digits themselves", () => {
  function Hook() {
    const ref = useMask({ mask: "9999", formatChars: { "9": /[٠-٩]/ } });
    return <input ref={ref} data-testid="hook" />;
  }

  it("keep those digits", async () => {
    render(
      <>
        <InputMask mask="9999" formatChars={{ "9": /[٠-٩]/ }} data-testid="field" />
        <Hook />
      </>
    );
    await userEvent.type(field(), "١٢٣٤");
    expect(field()).toHaveValue("١٢٣٤");
    await userEvent.type(screen.getByTestId("hook"), "١٢");
    expect(screen.getByTestId("hook")).toHaveValue("١٢__");
  });

  it("keep a placeholder made of such digits", async () => {
    render(<InputMask mask="99/99" maskPlaceholder="٠" alwaysShowMask data-testid="field" />);
    expect(field()).toHaveValue("٠٠/٠٠");
    await userEvent.type(field(), "1234");
    expect(field()).toHaveValue("12/34");
    expect(isMaskComplete("٠٠/٠٠", { mask: "99/99", maskPlaceholder: "٠" })).toBe(false);
  });
});

describe("card expiry", () => {
  it("reads non-ASCII digits in values", () => {
    expect(formatCardExpiry("١٢٢٥")).toBe("12/25");
    expect(parseCardExpiry("١٢/٢٥").value).toBe("12/25");
    render(<CardExpiryFormat defaultValue="١٢٢٥" data-testid="field" />);
    expect(field()).toHaveValue("12/25");
  });
});

describe("mask helpers and presets with a transform", () => {
  it.each<[string, typeof vin, string, string]>([
    ["vin", vin, "1hgcm82633a004352", "1HGCM82633A004352"],
    ["ruPlate", ruPlate, "A123BC777", "А 123 ВС 777"]
  ])("%s raw text counts as complete and formats like the field", (_name, preset, raw, shown) => {
    expect(isMaskComplete(raw, preset)).toBe(true);
    expect(formatMask(raw, preset)).toBe(shown);
  });
});

describe("form reset while composing", () => {
  function setValue(el: HTMLInputElement, value: string): void {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, value);
  }

  it.each<[string, React.ReactElement]>([
    ["NumberFormat", <NumberFormat thousandSeparator="," data-testid="field" />],
    ["DateFormat", <DateFormat data-testid="field" />]
  ])("%s clears the composed text", async (_name, element) => {
    render(<form data-testid="form">{element}</form>);
    await userEvent.type(field(), "12");
    const el = field();
    act(() => {
      fireEvent.compositionStart(el, { data: "" });
      setValue(el, el.value + "3");
      fireEvent.input(el, { isComposing: true, inputType: "insertCompositionText", data: "3" });
    });
    act(() => {
      (screen.getByTestId("form") as HTMLFormElement).reset();
    });
    expect(field()).toHaveValue("");
  });
});
