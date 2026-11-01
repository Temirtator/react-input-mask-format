import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardExpiryFormat } from "../../src/card/card-expiry-format";
import { useCardExpiryFormat } from "../../src/card/use-card-expiry-format";
import type { UseCardExpiryFormatOptions } from "../../src/card/use-card-expiry-format";
import type { CardExpiryValues } from "../../src/card/card-expiry";

function HookField(opts: UseCardExpiryFormatOptions) {
  const ref = useCardExpiryFormat(opts);
  return <input ref={ref} data-testid="h" />;
}

function Controlled({ onValueChange }: { onValueChange?: (values: CardExpiryValues) => void }) {
  const [v, setV] = React.useState("");
  return (
    <CardExpiryFormat
      value={v}
      onValueChange={(vals) => {
        onValueChange?.(vals);
        setV(vals.value);
      }}
      data-testid="c"
    />
  );
}

describe("CardExpiryFormat", () => {
  it("formats MM/YY while typing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Controlled onValueChange={onValueChange} />);
    const input = screen.getByTestId("c");
    await user.click(input);
    await user.keyboard("1226");
    expect(input).toHaveValue("12/26");
    expect(onValueChange.mock.calls.at(-1)?.[0]).toEqual({
      value: "12/26",
      formattedValue: "12/26",
      month: 12,
      year: 2026,
    });
  });

  it("steps back over the trailing separator", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByTestId("c");
    await user.click(input);
    await user.keyboard("1226");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("12/2");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("12/");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("1");
  });

  it("splits a pasted four-digit year and puts the caret at the end", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByTestId("c") as HTMLInputElement;
    await user.click(input);
    await user.paste("12/2026");
    expect(input).toHaveValue("12/26");
    expect(input.selectionStart).toBe(5);
  });

  it("does not clamp a month shifted by Backspace and restores it on retype", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Controlled onValueChange={onValueChange} />);
    const input = screen.getByTestId("c") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1296");
    input.setSelectionRange(2, 2);
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("19/6");
    expect(onValueChange.mock.calls.at(-1)?.[0]).toMatchObject({ value: "" });
    await user.keyboard("2");
    expect(input).toHaveValue("12/96");
  });

  it("sets numeric keyboard and expiry autofill by default", () => {
    render(<CardExpiryFormat value="" onValueChange={() => {}} data-testid="a" />);
    const input = screen.getByTestId("a");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("autocomplete", "cc-exp");
  });

  it("shows a stored value with the configured separator", () => {
    render(<CardExpiryFormat value="12/26" separator=" / " onValueChange={() => {}} data-testid="a" />);
    expect(screen.getByTestId("a")).toHaveValue("12 / 26");
  });
});

describe("useCardExpiryFormat", () => {
  it("formats while typing and reports the value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<HookField onValueChange={onValueChange} />);
    const input = screen.getByTestId("h");
    await user.click(input);
    await user.keyboard("0130");
    expect(input).toHaveValue("01/30");
    expect(onValueChange.mock.calls.at(-1)?.[0]).toMatchObject({ value: "01/30", year: 2030 });
  });

  it("steps back over the trailing separator", async () => {
    const user = userEvent.setup();
    render(<HookField />);
    const input = screen.getByTestId("h");
    await user.click(input);
    await user.keyboard("12{Backspace}");
    expect(input).toHaveValue("1");
  });
});
