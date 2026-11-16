import React, { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { formatMask, isMaskComplete } from "../../src/index";
import { NumberFormat, formatNumber, parseNumber, useNumberFormat } from "../../src/number";

function field(): HTMLInputElement {
  return screen.getByTestId("field") as HTMLInputElement;
}

const arabic = { decimalSeparator: "٫", thousandSeparator: "٬" };

describe("a decimal separator from another script set as decimalSeparator", () => {
  it("round-trips in the helpers", () => {
    expect(formatNumber(1234.5, arabic)).toBe("1٬234٫5");
    expect(parseNumber(formatNumber(1234.5, arabic), arabic).floatValue).toBe(1234.5);
    expect(formatNumber("1٬234٫5", arabic)).toBe("1٬234٫5");
    expect(formatNumber("12．5", { decimalSeparator: "．" })).toBe("12．5");
  });

  it("is kept in defaultValue and value", () => {
    const { unmount } = render(<NumberFormat {...arabic} defaultValue="1234٫5" data-testid="field" />);
    expect(field()).toHaveValue("1٬234٫5");
    unmount();
    render(<NumberFormat {...arabic} value="1٬234٫5" onValueChange={() => {}} data-testid="field" />);
    expect(field()).toHaveValue("1٬234٫5");
  });

  it("is kept by a controlled field that echoes formattedValue", async () => {
    function Controlled() {
      const [value, setValue] = useState("12٫5");
      return (
        <NumberFormat {...arabic} value={value} onValueChange={v => setValue(v.formattedValue)} data-testid="field" />
      );
    }
    render(<Controlled />);
    expect(field()).toHaveValue("12٫5");
    await userEvent.type(field(), "6");
    expect(field()).toHaveValue("12٫56");
  });

  it("is typed when allowedDecimalSeparators does not list the dot", async () => {
    render(<NumberFormat {...arabic} allowedDecimalSeparators={[","]} data-testid="field" />);
    await userEvent.type(field(), "12٫5");
    expect(field()).toHaveValue("12٫5");
    await userEvent.type(field(), "6");
    expect(field()).toHaveValue("12٫56");
  });

  it("survives an option change in the hook", async () => {
    function Hook({ suffix }: { suffix?: string }) {
      const ref = useNumberFormat({ ...arabic, suffix });
      return <input ref={ref} data-testid="field" />;
    }
    const { rerender } = render(<Hook />);
    await userEvent.type(field(), "1234٫5");
    expect(field()).toHaveValue("1٬234٫5");
    rerender(<Hook suffix=" x" />);
    expect(field()).toHaveValue("1٬234٫5 x");
  });
});

describe("a decimal separator from another script with a dot as thousandSeparator", () => {
  const european = { thousandSeparator: ".", decimalSeparator: "," };

  it("is read as the decimal point", async () => {
    expect(formatNumber("١٢٣٤٫٥", european)).toBe("1.234,5");
    expect(formatNumber("１２．５", { decimalSeparator: "," })).toBe("12,5");
    expect(parseNumber("١٢٣٤٫٥", european).floatValue).toBe(1234.5);
    render(<NumberFormat {...european} data-testid="field" />);
    await userEvent.type(field(), "١٢٣٤٫٥");
    expect(field()).toHaveValue("1.234,5");
  });
});

describe("a prefix or suffix with digits or separators from another script", () => {
  it("stays out of the number in the component", async () => {
    const { unmount } = render(<NumberFormat suffix=" ٪٣" thousandSeparator data-testid="field" />);
    await userEvent.type(field(), "1234");
    expect(field()).toHaveValue("1,234 ٪٣");
    unmount();
    const second = render(<NumberFormat prefix="٣٫ " data-testid="field" />);
    await userEvent.type(field(), "12");
    expect(field()).toHaveValue("٣٫ 12");
    second.unmount();
    render(<NumberFormat suffix=" ٫" data-testid="field" />);
    await userEvent.type(field(), "12");
    expect(field()).toHaveValue("12 ٫");
  });

  it("stays out of the number in the hook", async () => {
    function Hook() {
      const ref = useNumberFormat({ suffix: " ٪٣", thousandSeparator: true });
      return <input ref={ref} data-testid="field" />;
    }
    render(<Hook />);
    await userEvent.type(field(), "1234");
    expect(field()).toHaveValue("1,234 ٪٣");
  });

  it("still reads typed digits from another script next to it", async () => {
    render(<NumberFormat suffix=" ٪٣" thousandSeparator data-testid="field" />);
    await userEvent.type(field(), "١٢٣٤٫٥");
    expect(field()).toHaveValue("1,234.5 ٪٣");
  });
});

describe("mask helpers without a mask", () => {
  it("return the value as it is and report it complete, like an unmasked InputMask", () => {
    expect(formatMask("abc", { mask: "" })).toBe("abc");
    expect(formatMask("abc", { mask: null as unknown as string })).toBe("abc");
    expect(isMaskComplete("abc", { mask: "" })).toBe(true);
    render(<InputMask mask="" defaultValue="abc" data-testid="field" />);
    expect(field()).toHaveValue("abc");
  });
});

describe("a numeric string value written with another script's separator", () => {
  it("is read as a decimal", () => {
    render(<NumberFormat value="١٢٫٥" valueIsNumericString onValueChange={() => {}} data-testid="field" />);
    expect(field()).toHaveValue("12.5");
  });
});

describe("isMaskComplete with a placeholder the mask itself would accept", () => {
  it("does not count the placeholder as typed characters", () => {
    expect(isMaskComplete("ab", { mask: "aaa", maskPlaceholder: "x" })).toBe(false);
    expect(isMaskComplete("abc", { mask: "aaa", maskPlaceholder: "x" })).toBe(true);
    expect(isMaskComplete("12", { mask: "99/99", maskPlaceholder: "0" })).toBe(false);
    expect(isMaskComplete("1234", { mask: "99/99", maskPlaceholder: "0" })).toBe(true);
    expect(isMaskComplete("12/__", { mask: "99/99" })).toBe(false);
    expect(isMaskComplete("12/34", { mask: "99/99" })).toBe(true);
  });
});
