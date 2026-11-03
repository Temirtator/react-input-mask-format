import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateFormat } from "../../src/date/date-format";
import { TimeFormat } from "../../src/time/time-format";
import { CardNumberFormat } from "../../src/card/card-number-format";

describe("form reset on digit inputs", () => {
  it.each([
    ["DateFormat", <DateFormat defaultValue="2024-05-12" data-testid="field" />, "12.05.2024"],
    ["TimeFormat", <TimeFormat defaultValue="1430" data-testid="field" />, "14:30"],
    ["CardNumberFormat", <CardNumberFormat defaultValue="4111111111111111" data-testid="field" />, "4111 1111 1111 1111"],
    ["DateFormat without defaultValue", <DateFormat data-testid="field" />, ""]
  ])("%s goes back to its defaultValue", async (_name, field, expected) => {
    const user = userEvent.setup();
    render(<form data-testid="form">{field}</form>);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await user.keyboard("{Backspace}{Backspace}1");
    expect(input.value).not.toBe(expected);
    (screen.getByTestId("form") as HTMLFormElement).reset();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(input.value).toBe(expected);
  });

  it("leaves a controlled field to its value", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form">
        <DateFormat value="2024-05-12" onValueChange={() => {}} data-testid="field" />
      </form>
    );
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    (screen.getByTestId("form") as HTMLFormElement).reset();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(input.value).toBe("12.05.2024");
  });
});
