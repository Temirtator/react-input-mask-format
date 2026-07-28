import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useNumberFormat } from "../../src/number/use-number-format";
import type { UseNumberFormatOptions } from "../../src/number/use-number-format";
import type { NumberFormatValues } from "../../src/number/types";
import { NumberFormat } from "../../src/number/number-format";

function HookField(opts: UseNumberFormatOptions) {
  const ref = useNumberFormat(opts);
  return <input ref={ref} data-testid="num" />;
}

describe("useNumberFormat", () => {
  it("groups thousands while typing on a raw input", async () => {
    const user = userEvent.setup();
    render(<HookField thousandSeparator="," />);
    const input = screen.getByTestId("num");
    await user.click(input);
    await user.keyboard("1234567");
    expect(input).toHaveValue("1,234,567");
  });

  it("emits onValueChange with value/formattedValue/floatValue", async () => {
    const user = userEvent.setup();
    let last: NumberFormatValues | null = null;
    render(
      <HookField
        thousandSeparator=","
        decimalScale={2}
        prefix="$ "
        onValueChange={v => (last = v)}
      />
    );
    const input = screen.getByTestId("num");
    await user.click(input);
    await user.keyboard("1234.5");
    expect(input).toHaveValue("$ 1,234.5");
    expect(last!.value).toBe("1234.5");
    expect(last!.floatValue).toBe(1234.5);
  });

  it("warns (dev) when thousand and decimal separators collide", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<HookField thousandSeparator="," decimalSeparator="," />);
    expect(spy.mock.calls.some(a => String(a[0]).includes("must differ"))).toBe(true);
    spy.mockRestore();
  });
});

describe("NumberFormat component", () => {
  it("renders a controlled formatted value", () => {
    render(<NumberFormat value={1234.5} thousandSeparator="," decimalScale={2} fixedDecimalScale data-testid="nf" onValueChange={() => {}} />);
    expect(screen.getByTestId("nf")).toHaveValue("1,234.50");
  });

  it("calls onValueChange while typing", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [v, setV] = useState<number | undefined>(undefined);
      return (
        <NumberFormat
          value={v ?? ""}
          onValueChange={vals => setV(vals.floatValue)}
          thousandSeparator=","
          prefix="$ "
          data-testid="nf"
        />
      );
    }
    render(<Controlled />);
    const input = screen.getByTestId("nf");
    await user.click(input);
    await user.keyboard("1234");
    expect(input).toHaveValue("$ 1,234");
  });

  it("reverts an edit rejected by isAllowed", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [v, setV] = useState<number | undefined>(undefined);
      return (
        <NumberFormat
          value={v ?? ""}
          onValueChange={vals => setV(vals.floatValue)}
          isAllowed={vals => vals.floatValue === undefined || vals.floatValue <= 99}
          data-testid="nf"
        />
      );
    }
    render(<Controlled />);
    const input = screen.getByTestId("nf");
    await user.click(input);
    await user.keyboard("12");
    expect(input).toHaveValue("12");
    await user.keyboard("3"); // 123 > 99 → rejected
    expect(input).toHaveValue("12");
  });

  it("does not leak numeric options to the DOM", () => {
    render(<NumberFormat value="5" prefix="$ " thousandSeparator="," data-testid="nf" onValueChange={() => {}} />);
    const el = screen.getByTestId("nf");
    expect(el.getAttribute("prefix")).toBeNull();
    expect(el.getAttribute("thousandSeparator")).toBeNull();
  });

  it("restores the caret to the pre-edit position when isAllowed rejects a mid-string edit", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [v, setV] = useState<number | undefined>(undefined);
      return (
        <NumberFormat
          value={v ?? ""}
          onValueChange={vals => setV(vals.floatValue)}
          isAllowed={vals => vals.floatValue === undefined || vals.floatValue <= 99}
          data-testid="nf"
        />
      );
    }
    render(<Controlled />);
    const input = screen.getByTestId("nf") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("15");
    expect(input).toHaveValue("15");
    input.setSelectionRange(1, 1); // caret between "1" and "5"
    await user.keyboard("3");       // "135" > 99 → rejected
    expect(input).toHaveValue("15");
    expect(input.selectionStart).toBe(1); // caret stays where the user was, not at the end
  });
});
