import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
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

  it("moves past a fixed decimal separator when it is typed", async () => {
    const user = userEvent.setup();
    let last: NumberFormatValues | null = null;
    render(
      <HookField
        thousandSeparator=" "
        decimalSeparator=","
        decimalScale={2}
        fixedDecimalScale
        onValueChange={v => (last = v)}
      />
    );
    const input = screen.getByTestId("num") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1234,5");
    expect(input).toHaveValue("1 234,50");
    expect(input.selectionStart).toBe(7);
    expect(last!.value).toBe("1234.50");
  });

  it("ignores a typed decimal separator when decimalScale is 0", async () => {
    const user = userEvent.setup();
    let last: NumberFormatValues | null = null;
    render(<HookField thousandSeparator="," decimalScale={0} onValueChange={v => (last = v)} />);
    const input = screen.getByTestId("num") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1234.5");
    expect(input).toHaveValue("12,345");
    expect(last!.value).toBe("12345");
    expect(input.selectionStart).toBe(6);
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

  it.each([
    [{}, "1234.5", "1 234,5"],
    [{ decimalScale: 2, fixedDecimalScale: true }, "1234.5", "1 234,50"],
    [{ allowedDecimalSeparators: [] }, "12.5", "125"]
  ])("reads a typed dot in a comma format (%o)", async (extra, keys, shown) => {
    const user = userEvent.setup();
    function Controlled() {
      const [v, setV] = useState("");
      return (
        <NumberFormat
          value={v}
          onValueChange={x => setV(x.value)}
          thousandSeparator=" "
          decimalSeparator=","
          {...extra}
          data-testid="nf"
        />
      );
    }
    render(<Controlled />);
    const input = screen.getByTestId("nf") as HTMLInputElement;
    await user.click(input);
    await user.keyboard(keys);
    expect(input).toHaveValue(shown);
  });

  it("moves past a fixed decimal separator when it is typed (controlled)", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [v, setV] = useState<number | undefined>(undefined);
      return (
        <NumberFormat
          value={v ?? ""}
          onValueChange={x => setV(x.floatValue)}
          thousandSeparator=","
          decimalScale={2}
          fixedDecimalScale
          data-testid="nf"
        />
      );
    }
    render(<Controlled />);
    const input = screen.getByTestId("nf") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1234.56");
    expect(input).toHaveValue("1,234.56");
  });

  it.each([
    ["value", "12,5", "12,5"],
    ["value with fixedDecimalScale", "1234,56", "1 234,56"]
  ])("keeps a comma decimal when the %s from onValueChange is passed back", async (_name, keys, shown) => {
    const user = userEvent.setup();
    const fixed = _name !== "value";
    function Controlled() {
      const [v, setV] = useState("");
      return (
        <NumberFormat
          value={v}
          onValueChange={x => setV(x.value)}
          thousandSeparator=" "
          decimalSeparator=","
          decimalScale={2}
          fixedDecimalScale={fixed}
          data-testid="nf"
        />
      );
    }
    render(<Controlled />);
    const input = screen.getByTestId("nf") as HTMLInputElement;
    await user.click(input);
    await user.keyboard(keys);
    expect(input).toHaveValue(shown);
  });

  it.each(["floatValue", "value"] as const)("re-formats when the options change (%s stored)", async store => {
    const user = userEvent.setup();
    let setPrefix: (p: string) => void = () => {};
    function Controlled() {
      const [v, setV] = useState<string | number>("");
      const [prefix, sp] = useState("$ ");
      setPrefix = sp;
      return (
        <NumberFormat
          value={v}
          prefix={prefix}
          onValueChange={x => setV(store === "value" ? x.value : (x.floatValue ?? ""))}
          data-testid="nf"
        />
      );
    }
    render(<Controlled />);
    const input = screen.getByTestId("nf") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("12");
    expect(input).toHaveValue("$ 12");
    act(() => setPrefix("€ "));
    expect(input).toHaveValue("€ 12");
  });

  it("ignores a typed decimal separator when decimalScale is 0", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [v, setV] = useState("");
      return <NumberFormat value={v} decimalScale={0} onValueChange={x => setV(x.value)} data-testid="nf" />;
    }
    render(<Controlled />);
    const input = screen.getByTestId("nf") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("12.");
    expect(input).toHaveValue("12");
    expect(input.selectionStart).toBe(2);
    await user.keyboard("3");
    expect(input).toHaveValue("123");
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

  it("preserves a trailing decimal separator while typing when the consumer stores floatValue", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [v, setV] = useState<number | undefined>(undefined);
      return (
        <NumberFormat
          value={v ?? ""}
          onValueChange={vals => setV(vals.floatValue)}
          thousandSeparator="," prefix="$ " decimalScale={2}
          data-testid="nf"
        />
      );
    }
    render(<Controlled />);
    const input = screen.getByTestId("nf");
    await user.click(input);
    await user.keyboard("12.5");
    expect(input).toHaveValue("$ 12.5");
  });
});

describe("NumberFormat editing around the decimal separator", () => {
  const shown = (input: HTMLInputElement) =>
    `${input.value.slice(0, input.selectionStart!)}|${input.value.slice(input.selectionStart!)}`;

  function Fixed() {
    const [v, setV] = useState<number | undefined>(undefined);
    return (
      <NumberFormat
        value={v ?? ""}
        onValueChange={x => setV(x.floatValue)}
        thousandSeparator=","
        decimalScale={2}
        fixedDecimalScale
        data-testid="nf"
      />
    );
  }

  it("Backspace from the end of a fixed fraction walks into the integer part", async () => {
    const user = userEvent.setup();
    render(<Fixed />);
    const input = screen.getByTestId("nf") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1234");
    input.setSelectionRange(input.value.length, input.value.length);
    await user.keyboard("{Backspace}");
    expect(shown(input)).toBe("1,234.0|0");
    await user.keyboard("{Backspace}");
    expect(shown(input)).toBe("1,234|.00");
    await user.keyboard("{Backspace}");
    expect(input.value).toBe("123.00");
    await user.keyboard("{Backspace}");
    expect(input.value).toBe("12.00");
  });

  it("a separator typed into an empty field puts the caret into the fraction", async () => {
    const user = userEvent.setup();
    render(<Fixed />);
    const input = screen.getByTestId("nf") as HTMLInputElement;
    await user.click(input);
    await user.keyboard(".5");
    expect(input.value).toBe("0.50");
  });

  it("decimalScale 0 ignores a separator typed in the middle", async () => {
    const user = userEvent.setup();
    function Integer() {
      const [v, setV] = useState("");
      return <NumberFormat value={v} onValueChange={x => setV(x.value)} thousandSeparator="," decimalScale={0} data-testid="nf" />;
    }
    render(<Integer />);
    const input = screen.getByTestId("nf") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1234");
    for (const caret of [0, 1, 3]) {
      input.setSelectionRange(caret, caret);
      await user.keyboard(".");
      expect(input.value).toBe("1,234");
      expect(input.selectionStart).toBe(caret);
    }
  });

  it("keeps an echoed value through an option change with a dot thousand separator", async () => {
    const user = userEvent.setup();
    let setPrefix: (p: string) => void = () => {};
    function German() {
      const [v, setV] = useState("");
      const [prefix, sp] = useState("€ ");
      setPrefix = sp;
      return (
        <NumberFormat
          value={v}
          prefix={prefix}
          onValueChange={x => setV(x.value)}
          thousandSeparator="."
          decimalSeparator=","
          data-testid="nf"
        />
      );
    }
    render(<German />);
    const input = screen.getByTestId("nf") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1234,5");
    expect(input.value).toBe("€ 1.234,5");
    act(() => setPrefix("EUR "));
    expect(input.value).toBe("EUR 1.234,5");
  });

  it("valueIsNumericString reads a canonical string value", () => {
    render(
      <NumberFormat value="1234.5" valueIsNumericString thousandSeparator="." decimalSeparator="," data-testid="nf" />
    );
    expect(screen.getByTestId("nf")).toHaveValue("1.234,5");
  });

  it("keeps the text being edited when an option changes in the same render", async () => {
    const user = userEvent.setup();
    function Years() {
      const [v, setV] = useState<number | undefined>(undefined);
      return (
        <NumberFormat
          value={v ?? ""}
          onValueChange={x => setV(x.floatValue)}
          decimalSeparator=","
          suffix={v === 1 ? " год" : " года"}
          data-testid="nf"
        />
      );
    }
    render(<Years />);
    const input = screen.getByTestId("nf") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1,5");
    expect(input.value).toBe("1,5 года");
    input.setSelectionRange(3, 3);
    await user.keyboard("{Backspace}");
    expect(input.value).toBe("1, год");
    await user.keyboard("7");
    expect(input.value).toBe("1,7 года");
  });
});

describe("NumberFormat with a suffix that has a dot", () => {
  it("a digit typed after the suffix joins the integer part", async () => {
    const user = userEvent.setup();
    function Rub() {
      const [v, setV] = useState("");
      return (
        <NumberFormat value={v} onValueChange={x => setV(x.value)} thousandSeparator=" " decimalSeparator="," suffix=" руб." data-testid="nf" />
      );
    }
    render(<Rub />);
    const input = screen.getByTestId("nf") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("12");
    expect(input.value).toBe("12 руб.");
    input.setSelectionRange(input.value.length, input.value.length);
    await user.keyboard("3");
    expect(input.value).toBe("123 руб.");
    expect(input.selectionStart).toBe(3);
  });
});

