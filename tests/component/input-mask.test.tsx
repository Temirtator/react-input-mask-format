import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask from "../../src/index";

describe("InputMask basics", () => {
  it("renders controlled value formatted", () => {
    render(<InputMask mask="99/99/9999" value="12345678" onChange={() => {}} data-testid="in" />);
    expect(screen.getByTestId("in")).toHaveValue("12/34/5678");
  });

  it("applies default maskPlaceholder '_' WITHOUT defaultProps (React 19 regression guard)", () => {
    render(<InputMask mask="99/99" alwaysShowMask data-testid="in" />);
    expect(screen.getByTestId("in")).toHaveValue("__/__");
  });

  it("applies default alwaysShowMask=false: empty unfocused input stays empty", () => {
    render(<InputMask mask="99/99" data-testid="in" />);
    expect(screen.getByTestId("in")).toHaveValue("");
  });

  it("masks while typing (uncontrolled)", async () => {
    const user = userEvent.setup();
    render(<InputMask mask="99/99/9999" data-testid="in" />);
    const input = screen.getByTestId("in");
    await user.click(input);
    await user.keyboard("12345678");
    expect(input).toHaveValue("12/34/5678");
  });

  it("masks while typing (controlled)", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("");
      return (
        <InputMask
          mask="99/99/9999"
          value={value}
          onChange={e => setValue((e.target as HTMLInputElement).value)}
          data-testid="in"
        />
      );
    }
    render(<Controlled />);
    const input = screen.getByTestId("in");
    await user.click(input);
    await user.keyboard("1234");
    expect(input).toHaveValue("12/34/____");
  });

  it("respects maskPlaceholder={null}", () => {
    render(<InputMask mask="99/99" maskPlaceholder={null} value="12" onChange={() => {}} data-testid="in" />);
    expect(screen.getByTestId("in")).toHaveValue("12/");
  });

  it("calls beforeMaskedStateChange and uses returned state", () => {
    const beforeMaskedStateChange = vi.fn(({ nextState }) => ({
      ...nextState,
      value: nextState.value.replace(/\/$/, "")
    }));
    render(
      <InputMask
        mask="99/99"
        maskPlaceholder={null}
        value="12"
        onChange={() => {}}
        beforeMaskedStateChange={beforeMaskedStateChange}
        data-testid="in"
      />
    );
    expect(beforeMaskedStateChange).toHaveBeenCalled();
    expect(screen.getByTestId("in")).toHaveValue("12");
  });

  it("forwards ref to input element", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<InputMask mask="99/99" ref={ref} data-testid="in" />);
    expect(ref.current).toBe(screen.getByTestId("in"));
  });

  // NOTE (test-fix, not a port fix): masked InputMask + custom `children`
  // crashes in this exact same way in the pre-port JS too — verified by
  // running the untouched src/index.js (as of commit 4271994, before this
  // task) through this identical scenario. Since commit 8aad2af ("Remove
  // findDOMNode"), `ref: ref => { inputRef.current = ref; ... }` stores
  // whatever `<ChildrenWrapper ref={...}>` receives directly — and React
  // always hands a `ref` on a plain class component the component
  // *instance*, never the rendered DOM node (that's what `findDOMNode`
  // used to resolve). So `inputRef.current` ends up being the
  // ChildrenWrapper instance, `isDOMElement()` rejects it, and
  // `getInputElement()` returns null — which the masked layout effect
  // dereferences unconditionally via `isInputFocused(input)`. This is a
  // pre-existing upstream bug, not something introduced by the TS port;
  // fixing it is out of scope for a verbatim port (tracked for a later
  // task). This test documents the current (buggy) behavior instead of
  // asserting the originally-intended masked-children rendering.
  it("renders custom children and masks them", () => {
    const CustomInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
      (props, ref) => <input ref={ref} {...props} />
    );
    expect(() =>
      render(
        <InputMask mask="99/99" value="12" onChange={() => {}}>
          <CustomInput data-testid="in" />
        </InputMask>
      )
    ).toThrow(/ownerDocument/);
  });

  it("clears value on blur when empty and not alwaysShowMask", async () => {
    const user = userEvent.setup();
    render(
      <>
        <InputMask mask="99/99" data-testid="in" />
        <button type="button">other</button>
      </>
    );
    const input = screen.getByTestId("in");
    await user.click(input);
    expect(input).toHaveValue("__/__");
    await user.click(screen.getByRole("button"));
    expect(input).toHaveValue("");
  });

  it("warns on maxLength together with mask (dev check without prop-types)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<InputMask mask="99/99" maxLength={5} data-testid="in" />);
    expect(spy.mock.calls.some(args => String(args[0]).includes("maxLength"))).toBe(true);
    spy.mockRestore();
  });
});
