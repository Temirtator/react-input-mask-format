import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask from "../../src/index";

describe("StrictMode", () => {
  it("renders controlled formatted value under StrictMode without console errors", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <React.StrictMode>
        <InputMask mask="99/99/9999" value="12345678" onChange={() => {}} data-testid="in" />
      </React.StrictMode>
    );
    expect(screen.getByTestId("in")).toHaveValue("12/34/5678");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("typing works in controlled input under StrictMode", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("");
      return (
        <InputMask
          mask="99/99"
          value={value}
          onChange={e => setValue((e.target as HTMLInputElement).value)}
          data-testid="in"
        />
      );
    }
    render(
      <React.StrictMode>
        <Controlled />
      </React.StrictMode>
    );
    const input = screen.getByTestId("in");
    await user.click(input);
    await user.keyboard("1234");
    expect(input).toHaveValue("12/34");
  });
});
