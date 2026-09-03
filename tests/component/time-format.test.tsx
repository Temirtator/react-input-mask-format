import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTimeFormat } from "../../src/time/use-time-format";
import type { UseTimeFormatOptions } from "../../src/time/use-time-format";
import type { TimeFormatValues } from "../../src/time/types";
import { TimeFormat } from "../../src/time/time-format";

function HookField(opts: UseTimeFormatOptions) {
  const ref = useTimeFormat(opts);
  return <input ref={ref} data-testid="t" />;
}

describe("useTimeFormat", () => {
  it("inserts the separator and clamps while typing on a raw input", async () => {
    const user = userEvent.setup();
    render(<HookField />);
    const input = screen.getByTestId("t");
    await user.click(input);
    await user.keyboard("2999");
    expect(input).toHaveValue("23:59");
  });

  it("emits onValueChange with the value contract", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<HookField onValueChange={onValueChange} />);
    const input = screen.getByTestId("t");
    await user.click(input);
    await user.keyboard("0815");
    const last = onValueChange.mock.calls.at(-1)?.[0] as TimeFormatValues;
    expect(last).toEqual({
      value: "08:15",
      formattedValue: "08:15",
      hours: 8,
      minutes: 15,
    });
  });

  it("deletes the preceding hour digit when backspacing over the separator", async () => {
    const user = userEvent.setup();
    render(<HookField />);
    const input = screen.getByTestId("t");
    await user.click(input);
    await user.keyboard("22");
    expect(input).toHaveValue("22:");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("2");
  });

  it("steps backward through the mask with repeated backspaces", async () => {
    const user = userEvent.setup();
    render(<HookField />);
    const input = screen.getByTestId("t");
    await user.click(input);
    await user.keyboard("223");
    expect(input).toHaveValue("22:3");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("22:");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("2");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("");
  });
});

function Controlled() {
  const [v, setV] = React.useState("");
  return <TimeFormat value={v} onValueChange={(vals) => setV(vals.value)} data-testid="c" />;
}

describe("TimeFormat", () => {
  it("formats and clamps a controlled input while typing", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByTestId("c");
    await user.click(input);
    await user.keyboard("2999");
    expect(input).toHaveValue("23:59");
  });

  it("keeps the in-progress hours-only value when the parent echoes empty", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByTestId("c");
    await user.click(input);
    await user.keyboard("22");
    expect(input).toHaveValue("22:");
  });

  it("renders a plain controlled value with no handler", () => {
    render(<TimeFormat value="09:05" onValueChange={() => {}} data-testid="r" />);
    expect(screen.getByTestId("r")).toHaveValue("09:05");
  });

  it("deletes the preceding hour digit when backspacing over the separator", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByTestId("c");
    await user.click(input);
    await user.keyboard("22");
    expect(input).toHaveValue("22:");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("2");
  });

  it("steps backward through the mask with repeated backspaces", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByTestId("c");
    await user.click(input);
    await user.keyboard("223");
    expect(input).toHaveValue("22:3");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("22:");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("2");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("");
  });
});
