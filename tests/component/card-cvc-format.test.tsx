import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardCvcFormat } from "../../src/card/card-cvc-format";
import { useCardCvcFormat } from "../../src/card/use-card-cvc-format";
import type { UseCardCvcFormatOptions } from "../../src/card/use-card-cvc-format";
import type { CardCvcValues } from "../../src/card/card-cvc";
import type { CardBrand } from "../../src/card/types";

function HookField(opts: UseCardCvcFormatOptions) {
  const ref = useCardCvcFormat(opts);
  return <input ref={ref} data-testid="h" />;
}

function Controlled({
  brand,
  onValueChange,
}: {
  brand?: CardBrand;
  onValueChange: (values: CardCvcValues) => void;
}) {
  const [v, setV] = React.useState("");
  return (
    <CardCvcFormat
      brand={brand}
      value={v}
      onValueChange={(vals) => {
        onValueChange(vals);
        setV(vals.value);
      }}
      data-testid="c"
    />
  );
}

describe("CardCvcFormat", () => {
  it("cuts four digits to three and reports it when the brand leaves amex", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<Controlled brand="amex" onValueChange={onValueChange} />);
    const input = screen.getByTestId("c");
    await user.click(input);
    await user.keyboard("12345");
    expect(input).toHaveValue("1234");
    const calls = onValueChange.mock.calls.length;
    rerender(<Controlled brand="visa" onValueChange={onValueChange} />);
    expect(input).toHaveValue("123");
    expect(onValueChange).toHaveBeenCalledTimes(calls + 1);
    expect(onValueChange.mock.calls.at(-1)?.[0]).toEqual({
      value: "123",
      formattedValue: "123",
      complete: true,
    });
  });

  it("emits nothing when the brand changes without changing the length", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<Controlled brand="visa" onValueChange={onValueChange} />);
    const input = screen.getByTestId("c");
    await user.click(input);
    await user.keyboard("123");
    const calls = onValueChange.mock.calls.length;
    rerender(<Controlled brand="mastercard" onValueChange={onValueChange} />);
    expect(input).toHaveValue("123");
    expect(onValueChange).toHaveBeenCalledTimes(calls);
  });

  it("sets numeric keyboard and CSC autofill by default", () => {
    render(<CardCvcFormat value="" onValueChange={() => {}} data-testid="a" />);
    const input = screen.getByTestId("a");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("autocomplete", "cc-csc");
  });
});

describe("useCardCvcFormat", () => {
  it("cuts four digits to three and reports it when the brand leaves amex", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<HookField brand="amex" onValueChange={onValueChange} />);
    const input = screen.getByTestId("h");
    await user.click(input);
    await user.keyboard("1234");
    const calls = onValueChange.mock.calls.length;
    rerender(<HookField brand="visa" onValueChange={onValueChange} />);
    expect(input).toHaveValue("123");
    expect(onValueChange).toHaveBeenCalledTimes(calls + 1);
    expect(onValueChange.mock.calls.at(-1)?.[0]).toEqual({
      value: "123",
      formattedValue: "123",
      complete: true,
    });
  });

  it("emits nothing when the brand changes without changing the length", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<HookField brand="visa" onValueChange={onValueChange} />);
    const input = screen.getByTestId("h");
    await user.click(input);
    await user.keyboard("123");
    const calls = onValueChange.mock.calls.length;
    rerender(<HookField brand="mastercard" onValueChange={onValueChange} />);
    expect(onValueChange).toHaveBeenCalledTimes(calls);
  });
});
