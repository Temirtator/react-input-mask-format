import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardNumberFormat } from "../../src/card/card-number-format";
import { useCardNumberFormat } from "../../src/card/use-card-number-format";
import type { UseCardNumberFormatOptions } from "../../src/card/use-card-number-format";
import type { CardNumberValues } from "../../src/card/card-number";

function HookField(opts: UseCardNumberFormatOptions) {
  const ref = useCardNumberFormat(opts);
  return <input ref={ref} data-testid="h" />;
}

function Controlled({
  initial = "",
  onValueChange,
}: {
  initial?: string;
  onValueChange?: (values: CardNumberValues) => void;
}) {
  const [v, setV] = React.useState(initial);
  return (
    <>
      <CardNumberFormat
        value={v}
        onValueChange={(vals) => {
          onValueChange?.(vals);
          setV(vals.value);
        }}
        data-testid="c"
      />
      <output data-testid="digits">{v}</output>
    </>
  );
}

describe("CardNumberFormat", () => {
  it("regroups an Amex while typing and reports the brand", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Controlled onValueChange={onValueChange} />);
    const input = screen.getByTestId("c");
    await user.click(input);
    await user.keyboard("378282246310005");
    expect(input).toHaveValue("3782 822463 10005");
    expect(onValueChange.mock.calls.at(-1)?.[0]).toEqual({
      value: "378282246310005",
      formattedValue: "3782 822463 10005",
      brand: "amex",
      complete: true,
      valid: true,
    });
    expect(screen.getByTestId("digits")).toHaveTextContent("378282246310005");
  });

  it("stops at the brand's longest length", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByTestId("c");
    await user.click(input);
    await user.keyboard("55555555555544449");
    expect(input).toHaveValue("5555 5555 5555 4444");
  });

  it("removes the digit before a separator on Backspace in the middle", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByTestId("c") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("41111111");
    input.setSelectionRange(5, 5);
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("4111 111");
    expect(input.selectionStart).toBe(3);
  });

  it("removes the digit after a separator on Delete in the middle", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByTestId("c") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("41111111");
    input.setSelectionRange(4, 4);
    await user.keyboard("{Delete}");
    expect(input).toHaveValue("4111 111");
  });

  it("keeps the caret after a digit typed in the middle across a brand change", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByTestId("c") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("41111111");
    input.setSelectionRange(0, 0);
    await user.keyboard("3");
    expect(input).toHaveValue("3411 11111");
    expect(input.selectionStart).toBe(1);
  });

  it("round-trips a parent that stores the digits", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Controlled initial="4111111111111111" onValueChange={onValueChange} />);
    const input = screen.getByTestId("c");
    expect(input).toHaveValue("4111 1111 1111 1111");
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(input);
    await user.keyboard("{End}{Backspace}");
    expect(input).toHaveValue("4111 1111 1111 111");
    expect(screen.getByTestId("digits")).toHaveTextContent("411111111111111");
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("regroups a pasted number with dashes and puts the caret at the end", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByTestId("c") as HTMLInputElement;
    await user.click(input);
    await user.paste("4111-1111-1111-1111");
    expect(input).toHaveValue("4111 1111 1111 1111");
    expect(input.selectionStart).toBe(19);
  });

  it("sets numeric keyboard and card autofill by default", () => {
    render(<CardNumberFormat value="" onValueChange={() => {}} data-testid="a" />);
    const input = screen.getByTestId("a");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("autocomplete", "cc-number");
  });

  it("lets props override the default attributes", () => {
    render(
      <CardNumberFormat value="" autoComplete="off" inputMode="text" onValueChange={() => {}} data-testid="a" />
    );
    const input = screen.getByTestId("a");
    expect(input).toHaveAttribute("inputmode", "text");
    expect(input).toHaveAttribute("autocomplete", "off");
  });

  it("forwards the ref to the input", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<CardNumberFormat ref={ref} value="" onValueChange={() => {}} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});

describe("useCardNumberFormat", () => {
  it("groups while typing and reports the brand", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<HookField onValueChange={onValueChange} />);
    const input = screen.getByTestId("h");
    await user.click(input);
    await user.keyboard("4111111111111111");
    expect(input).toHaveValue("4111 1111 1111 1111");
    expect(onValueChange.mock.calls.at(-1)?.[0]).toMatchObject({ brand: "visa", valid: true });
  });

  it("removes the digit before a separator on Backspace in the middle", async () => {
    const user = userEvent.setup();
    render(<HookField />);
    const input = screen.getByTestId("h") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("41111111");
    input.setSelectionRange(5, 5);
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("4111 111");
    expect(input.selectionStart).toBe(3);
  });

  it("keeps the caret after a digit typed in the middle across a brand change", async () => {
    const user = userEvent.setup();
    render(<HookField />);
    const input = screen.getByTestId("h") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("41111111");
    input.setSelectionRange(0, 0);
    await user.keyboard("3");
    expect(input).toHaveValue("3411 11111");
    expect(input.selectionStart).toBe(1);
  });

  it("regroups a pasted number with spaces and puts the caret at the end", async () => {
    const user = userEvent.setup();
    render(<HookField separator="-" />);
    const input = screen.getByTestId("h") as HTMLInputElement;
    await user.click(input);
    await user.paste("4111 1111 1111 1111");
    expect(input).toHaveValue("4111-1111-1111-1111");
    expect(input.selectionStart).toBe(19);
  });
});

describe("uncontrolled CardNumberFormat", () => {
  it("keeps typed digits without a value prop and still reports the brand", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<CardNumberFormat onValueChange={onValueChange} data-testid="u" />);
    const input = screen.getByTestId("u");
    await user.click(input);
    await user.keyboard("378282246310005");
    expect(input).toHaveValue("3782 822463 10005");
    expect(onValueChange.mock.calls.at(-1)?.[0]).toMatchObject({ brand: "amex", valid: true });
  });
});
