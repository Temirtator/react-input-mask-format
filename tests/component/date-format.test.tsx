import React from "react";
import { describe, it, expect, vi } from "vitest";
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
