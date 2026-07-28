import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useNumberFormat } from "../../src/number/use-number-format";
import type { UseNumberFormatOptions } from "../../src/number/use-number-format";
import type { NumberFormatValues } from "../../src/number/types";

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
