import React, { useState } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { NumberFormat, useNumberFormat } from "../../src/number";
import type { UseNumberFormatOptions } from "../../src/number";
import { DateFormat } from "../../src/date";
import { TimeFormat } from "../../src/time";
import { CardNumberFormat, CardExpiryFormat, CardCvcFormat } from "../../src/card";

let consoleError: ReturnType<typeof vi.spyOn> | undefined;

afterEach(() => {
  consoleError?.mockRestore();
  consoleError = undefined;
});

function field(): HTMLInputElement {
  return screen.getByTestId("field") as HTMLInputElement;
}

describe("NumberFormat without value", () => {
  it("can be typed into and reports values", async () => {
    const onValueChange = vi.fn();
    render(<NumberFormat thousandSeparator="," onValueChange={onValueChange} data-testid="field" />);
    await userEvent.type(field(), "1234.5");
    expect(field()).toHaveValue("1,234.5");
    expect(onValueChange).toHaveBeenLastCalledWith({ value: "1234.5", formattedValue: "1,234.5", floatValue: 1234.5 });
  });

  it("shows a number or string defaultValue without a React warning", async () => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const onValueChange = vi.fn();
    render(
      <>
        <NumberFormat defaultValue={1234.5} thousandSeparator="," onValueChange={onValueChange} data-testid="field" />
        <NumberFormat defaultValue="5" prefix="$ " data-testid="other" />
      </>
    );
    expect(field()).toHaveValue("1,234.5");
    expect(screen.getByTestId("other")).toHaveValue("$ 5");
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.type(field(), "6");
    expect(field()).toHaveValue("1,234.56");
    expect(consoleError.mock.calls).toEqual([]);
  });

  it("goes back to defaultValue on form reset", async () => {
    render(
      <form data-testid="form">
        <NumberFormat defaultValue={12} thousandSeparator="," data-testid="field" />
      </form>
    );
    await userEvent.type(field(), "345");
    expect(field()).toHaveValue("12,345");
    await act(async () => {
      (screen.getByTestId("form") as HTMLFormElement).reset();
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(field()).toHaveValue("12");
  });

  it("re-formats the typed text when options change", async () => {
    function Switch() {
      const [prefix, setPrefix] = useState("$ ");
      return (
        <>
          <NumberFormat prefix={prefix} data-testid="field" />
          <button type="button" onClick={() => setPrefix("€ ")}>euro</button>
        </>
      );
    }
    render(<Switch />);
    await userEvent.type(field(), "12");
    fireEvent.click(screen.getByText("euro"));
    expect(field()).toHaveValue("€ 12");
  });
});

describe("onChange on number, date, time and card fields", () => {
  it.each<[string, React.ReactElement<Record<string, unknown>>, string, string]>([
    ["NumberFormat", <NumberFormat thousandSeparator="," />, "1234", "1,234"],
    ["DateFormat", <DateFormat />, "12052024", "12.05.2024"],
    ["TimeFormat", <TimeFormat />, "0930", "09:30"],
    ["CardNumberFormat", <CardNumberFormat />, "4111111111111111", "4111 1111 1111 1111"],
    ["CardExpiryFormat", <CardExpiryFormat />, "1226", "12/26"],
    ["CardCvcFormat", <CardCvcFormat />, "123", "123"]
  ])("%s calls onChange with the formatted text", async (_name, element, keys, expected) => {
    const onChange = vi.fn((event: React.ChangeEvent<HTMLInputElement>) => event.target.value);
    render(React.cloneElement(element, { onChange, "data-testid": "field" }));
    await userEvent.type(field(), keys);
    expect(onChange).toHaveBeenCalledTimes(keys.length);
    expect(onChange.mock.results[keys.length - 1].value).toBe(expected);
    expect(field()).toHaveValue(expected);
  });

  it("works with react-hook-form register", async () => {
    const submitted = vi.fn();
    function Form() {
      const { register, handleSubmit, watch } = useForm({ defaultValues: { amount: "", birthday: "" } });
      return (
        <form onSubmit={handleSubmit(submitted)}>
          <NumberFormat {...register("amount")} thousandSeparator="," data-testid="field" />
          <DateFormat {...register("birthday")} data-testid="date" />
          <output data-testid="watched">{watch("birthday")}</output>
          <button type="submit">send</button>
        </form>
      );
    }
    render(<Form />);
    await userEvent.type(field(), "1234");
    await userEvent.type(screen.getByTestId("date"), "12052024");
    expect(screen.getByTestId("watched")).toHaveTextContent("12.05.2024");
    await userEvent.click(screen.getByText("send"));
    expect(submitted.mock.calls[0][0]).toEqual({ amount: "1,234", birthday: "12.05.2024" });
  });
});

describe("useNumberFormat option change", () => {
  function Hook(options: UseNumberFormatOptions) {
    const ref = useNumberFormat(options);
    return <input ref={ref} data-testid="field" />;
  }

  it("re-formats the shown text with the new options", async () => {
    const { rerender } = render(<Hook prefix="$" decimalScale={2} />);
    await userEvent.type(field(), "12.34");
    expect(field()).toHaveValue("$12.34");
    rerender(<Hook prefix="€" decimalScale={2} />);
    expect(field()).toHaveValue("€12.34");
    rerender(<Hook prefix="€" decimalScale={0} />);
    expect(field()).toHaveValue("€12");
    await userEvent.type(field(), "5");
    expect(field()).toHaveValue("€125");
  });

  it("does not touch the text when options stay the same", async () => {
    const { rerender } = render(<Hook thousandSeparator="," />);
    await userEvent.type(field(), "1234");
    rerender(<Hook thousandSeparator="," />);
    expect(field()).toHaveValue("1,234");
  });
});

describe("review cases", () => {
  it("clears when a controlled value goes back to undefined", async () => {
    function Clearable() {
      const [value, setValue] = useState<number | undefined>();
      return (
        <>
          <NumberFormat thousandSeparator="," value={value} onValueChange={v => setValue(v.floatValue)} data-testid="field" />
          <button type="button" onClick={() => setValue(undefined)}>clear</button>
          <button type="button" onClick={() => setValue(42)}>set</button>
        </>
      );
    }
    render(<Clearable />);
    await userEvent.type(field(), "1234");
    expect(field()).toHaveValue("1,234");
    fireEvent.click(screen.getByText("clear"));
    expect(field()).toHaveValue("");
    fireEvent.click(screen.getByText("set"));
    expect(field()).toHaveValue("42");
    fireEvent.click(screen.getByText("clear"));
    expect(field()).toHaveValue("");
  });

  it("useNumberFormat keeps the caret's digit position when options change while focused", async () => {
    function Hook(options: UseNumberFormatOptions) {
      const ref = useNumberFormat(options);
      return <input ref={ref} data-testid="field" />;
    }
    const { rerender } = render(<Hook decimalScale={2} fixedDecimalScale />);
    await userEvent.type(field(), "12");
    expect(field()).toHaveValue("12.00");
    expect(field().selectionStart).toBe(2);
    rerender(<Hook decimalScale={3} fixedDecimalScale />);
    expect(field()).toHaveValue("12.000");
    expect(field().selectionStart).toBe(2);
    await userEvent.keyboard("3");
    expect(field()).toHaveValue("123.000");
  });

  it("shows values react-hook-form writes on mount from defaultValues", () => {
    function Form() {
      const { register } = useForm({ defaultValues: { amount: "1234", birthday: "12052024", card: "4111111111111111" } });
      return (
        <form>
          <NumberFormat {...register("amount")} thousandSeparator="," data-testid="field" />
          <DateFormat {...register("birthday")} data-testid="date" />
          <CardNumberFormat {...register("card")} data-testid="card" />
        </form>
      );
    }
    render(<Form />);
    expect(field()).toHaveValue("1,234");
    expect(screen.getByTestId("date")).toHaveValue("12.05.2024");
    expect(screen.getByTestId("card")).toHaveValue("4111 1111 1111 1111");
  });

  it("a cancelled form reset leaves the fields alone", async () => {
    render(
      <form data-testid="form" onReset={event => event.preventDefault()}>
        <NumberFormat defaultValue="1234" thousandSeparator="," data-testid="field" />
        <DateFormat defaultValue="2024-05-12" data-testid="date" />
      </form>
    );
    await userEvent.type(field(), "5");
    await userEvent.type(screen.getByTestId("date"), "{Backspace}");
    act(() => {
      (screen.getByTestId("form") as HTMLFormElement).reset();
    });
    expect(field()).toHaveValue("12,345");
    expect(screen.getByTestId("date")).toHaveValue("12.05.202");
  });
});
