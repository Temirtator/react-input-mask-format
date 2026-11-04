import React from "react";
import { describe, it, expect, vi, afterEach, type MockInstance } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { useMask } from "../../src/index";
import { NumberFormat } from "../../src/number";
import { DateFormat } from "../../src/date";

let consoleError: MockInstance<typeof console.error> | undefined;

function silenceConsole() {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  return consoleError;
}

afterEach(() => {
  consoleError?.mockRestore();
  consoleError = undefined;
});

function messages(spy: MockInstance<typeof console.error>): string[] {
  return spy.mock.calls.map(call => String(call[0]));
}

describe("input types without a text selection", () => {
  it("InputMask with type=number does not throw and warns once", async () => {
    const spy = silenceConsole();
    render(<InputMask mask="999" type="number" data-testid="field" />);
    await userEvent.type(screen.getByTestId("field"), "12");
    const warnings = messages(spy).filter(text => text.includes('type="number"'));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("has no text selection");
  });

  it("InputMask with type=email does not throw", async () => {
    silenceConsole();
    render(<InputMask mask="aaa" type="email" data-testid="field" />);
    await userEvent.type(screen.getByTestId("field"), "ab");
    expect(screen.getByTestId("field")).toBeInTheDocument();
  });

  it("NumberFormat with type=number keeps the tree mounted", async () => {
    silenceConsole();
    render(
      <div data-testid="tree">
        <NumberFormat type="number" data-testid="field" />
      </div>
    );
    await userEvent.type(screen.getByTestId("field"), "12");
    expect(screen.getByTestId("tree")).toBeInTheDocument();
  });

  it("DateFormat with type=number keeps the tree mounted", async () => {
    silenceConsole();
    render(<DateFormat type="number" data-testid="field" />);
    await userEvent.type(screen.getByTestId("field"), "12");
    expect(screen.getByTestId("field")).toBeInTheDocument();
  });
});

describe("a number as the value", () => {
  it("formats a numeric value like its string", () => {
    render(<InputMask mask="999-999" value={123456 as unknown as string} onChange={() => {}} data-testid="field" />);
    expect(screen.getByTestId("field")).toHaveValue("123-456");
  });

  it("formats 0 like \"0\" and passes a string to beforeMaskedStateChange", () => {
    const seen: unknown[] = [];
    render(
      <>
        <InputMask mask="+7 (999) 999" value={0 as unknown as string} onChange={() => {}} data-testid="field" />
        <InputMask
          mask="9999"
          value={0 as unknown as string}
          onChange={() => {}}
          beforeMaskedStateChange={({ nextState }) => {
            seen.push(nextState.value);
            return nextState;
          }}
          data-testid="other"
        />
        <InputMask mask="9999" defaultValue={0 as unknown as string} data-testid="uncontrolled" />
      </>
    );
    expect(screen.getByTestId("field")).toHaveValue("+7 (0__) ___");
    expect(screen.getByTestId("other")).toHaveValue("0___");
    expect(seen.every(value => typeof value === "string")).toBe(true);
    expect(screen.getByTestId("uncontrolled")).toHaveValue("0___");
  });
});

describe("maskPlaceholder of the wrong length", () => {
  function Hook() {
    const ref = useMask({ mask: "99-99", maskPlaceholder: "ab" });
    return <input ref={ref} />;
  }

  it("useMask throws the same error as InputMask", () => {
    silenceConsole();
    expect(() => render(<Hook />)).toThrow(/maskPlaceholder should either be a single character/);
    expect(() => render(<InputMask mask="99-99" maskPlaceholder="ab" />)).toThrow(
      /maskPlaceholder should either be a single character/
    );
  });
});

describe("a custom child that does not forward its ref", () => {
  type PlainProps = Pick<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onFocus" | "onBlur">;

  function Plain({ value, onChange, onFocus, onBlur }: PlainProps) {
    return <input value={value} onChange={onChange} onFocus={onFocus} onBlur={onBlur} />;
  }

  it("throws an error that names the cause", () => {
    silenceConsole();
    expect(() =>
      render(
        <InputMask mask="99/99">
          <Plain />
        </InputMask>
      )
    ).toThrow(/must forward its ref to the input element/);
  });
});

describe("a mask without editable positions", () => {
  it("warns once", () => {
    const spy = silenceConsole();
    const { rerender } = render(<InputMask mask="+7" />);
    rerender(<InputMask mask="+7" />);
    const warnings = messages(spy).filter(text => text.includes("no editable positions"));
    expect(warnings).toHaveLength(1);
  });

  it("does not warn for a mask with slots", () => {
    const spy = silenceConsole();
    render(<InputMask mask="+7 999" />);
    expect(messages(spy).filter(text => text.includes("no editable positions"))).toEqual([]);
  });
});
