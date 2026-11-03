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

describe("TimeFormat with a multi-character separator", () => {
  it("steps back over the separator with one Backspace", async () => {
    const user = userEvent.setup();
    render(<HookField separator=" : " />);
    const input = screen.getByTestId("t");
    await user.click(input);
    await user.keyboard("22");
    expect(input).toHaveValue("22 : ");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("2");
  });
});

describe("TimeFormat props changes", () => {
  it("shows the new separator when it changes", () => {
    const { rerender } = render(<TimeFormat value="09:05" onValueChange={() => {}} data-testid="p" />);
    rerender(<TimeFormat value="09:05" separator="." onValueChange={() => {}} data-testid="p" />);
    expect(screen.getByTestId("p")).toHaveValue("09.05");
  });

  it("clears the field when the parent resets after showing another value", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TimeFormat value="" onValueChange={() => {}} data-testid="z" />);
    const input = screen.getByTestId("z");
    await user.click(input);
    await user.keyboard("22");
    expect(input).toHaveValue("22:");
    rerender(<TimeFormat value="09:05" onValueChange={() => {}} data-testid="z" />);
    expect(input).toHaveValue("09:05");
    rerender(<TimeFormat value="" onValueChange={() => {}} data-testid="z" />);
    expect(input).toHaveValue("");
  });
});

describe("deleting next to a separator in the middle of a time", () => {
  it("removes the hour digit before the separator on Backspace in the hook", async () => {
    const user = userEvent.setup();
    render(<HookField />);
    const input = screen.getByTestId("t") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1230");
    input.setSelectionRange(3, 3);
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("13:0");
    expect(input.selectionStart).toBe(1);
  });

  it("removes the hour digit before the separator on Backspace in the component", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByTestId("c") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1230");
    input.setSelectionRange(3, 3);
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("13:0");
    expect(input.selectionStart).toBe(1);
  });

  it("removes the minute digit after the separator on Delete in the hook", async () => {
    const user = userEvent.setup();
    render(<HookField />);
    const input = screen.getByTestId("t") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1230");
    input.setSelectionRange(2, 2);
    await user.keyboard("{Delete}");
    expect(input).toHaveValue("12:0");
  });

  it("removes the minute digit after the separator on Delete in the component", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByTestId("c") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("1230");
    input.setSelectionRange(2, 2);
    await user.keyboard("{Delete}");
    expect(input).toHaveValue("12:0");
  });
});

function Stored(props: UseTimeFormatOptions & { onValueChange: (values: TimeFormatValues) => void }) {
  const { onValueChange, ...options } = props;
  const [v, setV] = React.useState("");
  return (
    <TimeFormat
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

describe("option changes report the reformatted time", () => {
  it("new callback identity emits nothing in the component", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<Stored onValueChange={(v) => onValueChange(v)} />);
    const input = screen.getByTestId("o");
    await user.click(input);
    await user.keyboard("1230");
    const calls = onValueChange.mock.calls.length;
    rerender(<Stored onValueChange={(v) => onValueChange(v)} />);
    expect(input).toHaveValue("12:30");
    expect(onValueChange).toHaveBeenCalledTimes(calls);
  });

  it("new callback identity emits nothing in the hook", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<HookField onValueChange={(v) => onValueChange(v)} />);
    const input = screen.getByTestId("t");
    await user.click(input);
    await user.keyboard("1230");
    const calls = onValueChange.mock.calls.length;
    rerender(<HookField onValueChange={(v) => onValueChange(v)} />);
    expect(input).toHaveValue("12:30");
    expect(onValueChange).toHaveBeenCalledTimes(calls);
  });

  it("calls onValueChange once when the component's separator changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<Stored onValueChange={onValueChange} />);
    const input = screen.getByTestId("o");
    await user.click(input);
    await user.keyboard("1230");
    const calls = onValueChange.mock.calls.length;
    rerender(<Stored separator="." onValueChange={onValueChange} />);
    expect(input).toHaveValue("12.30");
    expect(onValueChange).toHaveBeenCalledTimes(calls + 1);
    expect(onValueChange.mock.calls.at(-1)?.[0]).toEqual({
      value: "12:30",
      formattedValue: "12.30",
      hours: 12,
      minutes: 30,
    });
  });

  it("calls onValueChange once when the hook's separator changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<HookField onValueChange={onValueChange} />);
    const input = screen.getByTestId("t");
    await user.click(input);
    await user.keyboard("1230");
    const calls = onValueChange.mock.calls.length;
    rerender(<HookField separator="." onValueChange={onValueChange} />);
    expect(input).toHaveValue("12.30");
    expect(onValueChange).toHaveBeenCalledTimes(calls + 1);
    expect(onValueChange.mock.calls.at(-1)?.[0]).toMatchObject({ value: "12:30" });
  });
});

describe("TimeFormat uncontrolled and defaultValue", () => {
  it("shows defaultValue formatted without reporting it and stays editable", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<TimeFormat defaultValue="1430" onValueChange={onValueChange} data-testid="u" />);
    const input = screen.getByTestId("u");
    expect(input).toHaveValue("14:30");
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(input);
    await user.keyboard("{Backspace}0");
    expect(input).toHaveValue("14:30");
    expect(onValueChange).toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("lets value win over defaultValue without a warning", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<TimeFormat value="0915" defaultValue="1430" onValueChange={() => {}} data-testid="u" />);
    expect(screen.getByTestId("u")).toHaveValue("09:15");
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});

describe("TimeFormat without value", () => {
  it("keeps a complete time and reports its value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimeFormat onValueChange={onValueChange} data-testid="u" />);
    const input = screen.getByTestId("u");
    await user.click(input);
    await user.keyboard("1430");
    expect(input).toHaveValue("14:30");
    expect(onValueChange.mock.calls.at(-1)?.[0]).toMatchObject({ value: "14:30" });
  });
});
