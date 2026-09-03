import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTimeFormat } from "../../src/time/use-time-format";
import type { UseTimeFormatOptions } from "../../src/time/use-time-format";
import type { TimeFormatValues } from "../../src/time/types";

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
});
