import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useDateFormat } from "../../src/date/use-date-format";
import type { UseDateFormatOptions } from "../../src/date/use-date-format";
import type { DateFormatValues } from "../../src/date/types";
import { DateFormat } from "../../src/date/date-format";

function HookField(opts: UseDateFormatOptions) {
  const ref = useDateFormat(opts);
  return <input ref={ref} data-testid="d" />;
}

describe("useDateFormat", () => {
  it("inserts separators and clamps while typing on a raw input", async () => {
    const user = userEvent.setup();
    render(<HookField />);
    const input = screen.getByTestId("d");
    await user.click(input);
    await user.keyboard("45139999");
    expect(input).toHaveValue("31.12.9999");
  });

  it("emits onValueChange with the value contract", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<HookField onValueChange={onValueChange} />);
    const input = screen.getByTestId("d");
    await user.click(input);
    await user.keyboard("12052024");
    const last = onValueChange.mock.calls.at(-1)?.[0] as DateFormatValues;
    expect(last).toEqual({
      value: "2024-05-12",
      formattedValue: "12.05.2024",
      day: 12,
      month: 5,
      year: 2024,
    });
  });

  it("steps backward through both separators with repeated backspaces", async () => {
    const user = userEvent.setup();
    render(<HookField />);
    const input = screen.getByTestId("d");
    await user.click(input);
    await user.keyboard("12053");
    expect(input).toHaveValue("12.05.3");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("12.05.");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("12.0");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("12.");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("1");
  });

  it("works with a multi-character separator and the month first", async () => {
    const user = userEvent.setup();
    render(<HookField order="mdy" separator=" / " />);
    const input = screen.getByTestId("d");
    await user.click(input);
    await user.keyboard("0512");
    expect(input).toHaveValue("05 / 12 / ");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("05 / 1");
  });
});

function Controlled({ initial = "" }: { initial?: string }) {
  const [v, setV] = React.useState(initial);
  return (
    <>
      <DateFormat value={v} onValueChange={(vals) => setV(vals.value)} data-testid="c" />
      <output data-testid="iso">{v}</output>
    </>
  );
}

describe("DateFormat", () => {
  it("formats and clamps a controlled input while typing", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByTestId("c");
    await user.click(input);
    await user.keyboard("12052024");
    expect(input).toHaveValue("12.05.2024");
    expect(screen.getByTestId("iso")).toHaveTextContent("2024-05-12");
  });

  it("keeps a partial date when the parent echoes the empty value", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByTestId("c");
    await user.click(input);
    await user.keyboard("1205");
    expect(input).toHaveValue("12.05.");
  });

  it("shows a stored ISO value in the configured order and keeps editing it", async () => {
    const user = userEvent.setup();
    render(<Controlled initial="2024-05-12" />);
    const input = screen.getByTestId("c");
    expect(input).toHaveValue("12.05.2024");
    await user.click(input);
    await user.keyboard("{End}{Backspace}5");
    expect(input).toHaveValue("12.05.2025");
    expect(screen.getByTestId("iso")).toHaveTextContent("2025-05-12");
  });

  it("reports an empty value for a date that does not exist", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByTestId("c");
    await user.click(input);
    await user.keyboard("31022024");
    expect(input).toHaveValue("31.02.2024");
    expect(screen.getByTestId("iso")).toHaveTextContent("");
  });

  it("uses the order and separator props", () => {
    render(
      <DateFormat value="2024-05-12" order="mdy" separator="/" onValueChange={() => {}} data-testid="r" />
    );
    expect(screen.getByTestId("r")).toHaveValue("05/12/2024");
  });

  it("forwards the ref to the input", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<DateFormat ref={ref} value="" onValueChange={() => {}} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});

describe("editing a complete date", () => {
  it("shifts digits on Backspace in the middle and restores the date on retype", async () => {
    const user = userEvent.setup();
    render(<HookField />);
    const input = screen.getByTestId("d") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("12052024");
    input.setSelectionRange(5, 5);
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("12.02.024");
    await user.keyboard("5");
    expect(input).toHaveValue("12.05.2024");
  });

  it("does not pad a field emptied in the middle of a controlled date", async () => {
    const user = userEvent.setup();
    render(<Controlled initial="2024-05-12" />);
    const input = screen.getByTestId("c") as HTMLInputElement;
    await user.click(input);
    input.setSelectionRange(2, 2);
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("10.52.024");
    expect(screen.getByTestId("iso")).toHaveTextContent("");
    await user.keyboard("2");
    expect(input).toHaveValue("12.05.2024");
  });

  it("puts the caret at the end after pasting a date that gets padded", async () => {
    const user = userEvent.setup();
    render(<HookField />);
    const input = screen.getByTestId("d") as HTMLInputElement;
    await user.click(input);
    await user.paste("1.5.2024");
    expect(input).toHaveValue("01.05.2024");
    expect(input.selectionStart).toBe(10);
  });
});

describe("DateFormat props changes", () => {
  it("shows the new layout when order and separator change", () => {
    const { rerender } = render(
      <DateFormat value="2024-05-12" onValueChange={() => {}} data-testid="p" />
    );
    expect(screen.getByTestId("p")).toHaveValue("12.05.2024");
    rerender(
      <DateFormat value="2024-05-12" order="mdy" separator="/" onValueChange={() => {}} data-testid="p" />
    );
    expect(screen.getByTestId("p")).toHaveValue("05/12/2024");
  });

  it("re-lays out an emitted value when the order changes", async () => {
    const user = userEvent.setup();
    function Switch() {
      const [v, setV] = React.useState("");
      const [order, setOrder] = React.useState<"dmy" | "mdy">("dmy");
      return (
        <>
          <DateFormat value={v} order={order} onValueChange={(vals) => setV(vals.value)} data-testid="s" />
          <button onClick={() => setOrder("mdy")}>mdy</button>
        </>
      );
    }
    render(<Switch />);
    const input = screen.getByTestId("s");
    await user.click(input);
    await user.keyboard("12052024");
    await user.click(screen.getByText("mdy"));
    expect(input).toHaveValue("05.12.2024");
  });

  it("clears the field when the parent resets after showing another value", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<DateFormat value="" onValueChange={() => {}} data-testid="z" />);
    const input = screen.getByTestId("z");
    await user.click(input);
    await user.keyboard("1205");
    expect(input).toHaveValue("12.05.");
    rerender(<DateFormat value="2024-06-01" onValueChange={() => {}} data-testid="z" />);
    expect(input).toHaveValue("01.06.2024");
    rerender(<DateFormat value="" onValueChange={() => {}} data-testid="z" />);
    expect(input).toHaveValue("");
  });
});

describe("deleting next to a separator in the middle of a date", () => {
  it("removes the day digit before the separator on Backspace in the hook", async () => {
    const user = userEvent.setup();
    render(<HookField />);
    const input = screen.getByTestId("d") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("12052024");
    input.setSelectionRange(3, 3);
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("10.52.024");
    await user.keyboard("2");
    expect(input).toHaveValue("12.05.2024");
  });

  it("removes the day digit before the separator on Backspace in the component", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByTestId("c") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("12052024");
    input.setSelectionRange(3, 3);
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("10.52.024");
    await user.keyboard("2");
    expect(input).toHaveValue("12.05.2024");
    expect(screen.getByTestId("iso")).toHaveTextContent("2024-05-12");
  });

  it("works with a multi-character separator", async () => {
    const user = userEvent.setup();
    render(<HookField order="mdy" separator=" / " />);
    const input = screen.getByTestId("d") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("05122024");
    expect(input).toHaveValue("05 / 12 / 2024");
    input.setSelectionRange(5, 5);
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("01 / 22 / 024");
  });
});

function Stored(props: UseDateFormatOptions & { onValueChange: (values: DateFormatValues) => void }) {
  const { onValueChange, ...options } = props;
  const [v, setV] = React.useState("");
  return (
    <DateFormat
      {...options}
      value={v}
      onValueChange={(vals) => {
        onValueChange(vals);
        setV(vals.value);
      }}
      data-testid="o"
    />
  );
}

describe("option changes report the reformatted date", () => {
  it("calls onValueChange once when the component re-lays out a typed date", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<Stored onValueChange={onValueChange} />);
    const input = screen.getByTestId("o");
    await user.click(input);
    await user.keyboard("12052024");
    const calls = onValueChange.mock.calls.length;
    rerender(<Stored order="ymd" separator="-" onValueChange={onValueChange} />);
    expect(input).toHaveValue("2024-05-12");
    expect(onValueChange).toHaveBeenCalledTimes(calls + 1);
    expect(onValueChange.mock.calls.at(-1)?.[0]).toMatchObject({
      value: "2024-05-12",
      formattedValue: "2024-05-12",
    });
  });

  it("reformats the hook's input from the ISO value and calls onValueChange once", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<HookField onValueChange={onValueChange} />);
    const input = screen.getByTestId("d");
    await user.click(input);
    await user.keyboard("12052024");
    const calls = onValueChange.mock.calls.length;
    rerender(<HookField order="ymd" separator="-" onValueChange={onValueChange} />);
    expect(input).toHaveValue("2024-05-12");
    expect(onValueChange).toHaveBeenCalledTimes(calls + 1);
    expect(onValueChange.mock.calls.at(-1)?.[0]).toMatchObject({
      value: "2024-05-12",
      formattedValue: "2024-05-12",
    });
  });

  it("emits nothing when the order changes on an empty field", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Stored onValueChange={onValueChange} />);
    rerender(<Stored order="ymd" onValueChange={onValueChange} />);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("emits nothing when the order changes on an empty hook field", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<HookField onValueChange={onValueChange} />);
    rerender(<HookField order="ymd" onValueChange={onValueChange} />);
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

function DefaultField(props: UseDateFormatOptions & { defaultValue?: string }) {
  const { defaultValue, ...options } = props;
  const ref = useDateFormat(options);
  return <input ref={ref} defaultValue={defaultValue} data-testid="dv" />;
}

describe("useDateFormat option changes read the shown date", () => {
  it("re-lays out a date that came from defaultValue", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <DefaultField defaultValue="12.05.2024" onValueChange={onValueChange} />
    );
    const input = screen.getByTestId("dv");
    rerender(<DefaultField defaultValue="12.05.2024" order="mdy" onValueChange={onValueChange} />);
    expect(input).toHaveValue("05.12.2024");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0][0]).toMatchObject({ value: "2024-05-12" });
  });

  it("re-lays out a date written from outside instead of the last typed one", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<HookField />);
    const input = screen.getByTestId("d") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("12052024");
    input.value = "01.01.2030";
    rerender(<HookField order="ymd" separator="-" />);
    expect(input).toHaveValue("2030-01-01");
  });
});

describe("DateFormat uncontrolled and defaultValue", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows defaultValue formatted without reporting it and stays editable", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<DateFormat defaultValue="2024-05-12" onValueChange={onValueChange} data-testid="u" />);
    const input = screen.getByTestId("u");
    expect(input).toHaveValue("12.05.2024");
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(input);
    await user.keyboard("{Backspace}4");
    expect(input).toHaveValue("12.05.2024");
    expect(onValueChange.mock.calls.at(-1)?.[0]).toMatchObject({ formattedValue: "12.05.2024" });
    expect(error).not.toHaveBeenCalled();
  });

  it("lets value win over defaultValue without a warning", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<DateFormat value="2023-01-02" defaultValue="2024-05-12" onValueChange={() => {}} data-testid="u" />);
    expect(screen.getByTestId("u")).toHaveValue("02.01.2023");
    expect(error).not.toHaveBeenCalled();
  });
});

describe("DateFormat without value", () => {
  it("keeps a complete date and reports its ISO value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DateFormat onValueChange={onValueChange} data-testid="u" />);
    const input = screen.getByTestId("u");
    await user.click(input);
    await user.keyboard("12052024");
    expect(input).toHaveValue("12.05.2024");
    expect(onValueChange.mock.calls.at(-1)?.[0]).toMatchObject({ value: "2024-05-12" });
  });

  it("re-lays out defaultValue and reports once when order changes before any edit", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <DateFormat defaultValue="2024-05-12" onValueChange={onValueChange} data-testid="u" />
    );
    expect(screen.getByTestId("u")).toHaveValue("12.05.2024");
    rerender(
      <DateFormat defaultValue="2024-05-12" order="mdy" onValueChange={onValueChange} data-testid="u" />
    );
    expect(screen.getByTestId("u")).toHaveValue("05.12.2024");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0][0]).toMatchObject({
      value: "2024-05-12",
      formattedValue: "05.12.2024",
    });
  });

  it("re-reads a typed date in the old order when order changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<DateFormat onValueChange={onValueChange} data-testid="u" />);
    const input = screen.getByTestId("u");
    await user.click(input);
    await user.keyboard("12052024");
    onValueChange.mockClear();
    rerender(<DateFormat order="mdy" onValueChange={onValueChange} data-testid="u" />);
    expect(input).toHaveValue("05.12.2024");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0][0]).toMatchObject({
      value: "2024-05-12",
      formattedValue: "05.12.2024",
    });
  });

  it("keeps the typed date through two order changes in a row", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<DateFormat order="mdy" onValueChange={onValueChange} data-testid="u" />);
    const input = screen.getByTestId("u");
    await user.click(input);
    await user.keyboard("05122024");
    rerender(<DateFormat order="ymd" onValueChange={onValueChange} data-testid="u" />);
    expect(input).toHaveValue("2024.05.12");
    expect(onValueChange.mock.calls.at(-1)?.[0]).toMatchObject({ value: "2024-05-12" });
  });

  it("keeps defaultValue through dmy to mdy to dmy before any edit", () => {
    const { rerender } = render(<DateFormat defaultValue="2024-05-12" data-testid="u" />);
    rerender(<DateFormat defaultValue="2024-05-12" order="mdy" data-testid="u" />);
    rerender(<DateFormat defaultValue="2024-05-12" order="dmy" data-testid="u" />);
    expect(screen.getByTestId("u")).toHaveValue("12.05.2024");
  });
});
