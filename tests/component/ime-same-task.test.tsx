import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { NumberFormat } from "../../src/number";
import { DateFormat } from "../../src/date";
import { TimeFormat } from "../../src/time";
import { CardNumberFormat, CardExpiryFormat } from "../../src/card";

function field(): HTMLInputElement {
  return screen.getByTestId("field") as HTMLInputElement;
}

function commitInOneTask(el: HTMLInputElement, text: string): void {
  act(() => {
    el.focus();
    fireEvent.compositionStart(el, { data: "" });
  });
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, text);
    el.setSelectionRange(text.length, text.length);
    fireEvent.compositionEnd(el, { data: text });
    fireEvent.input(el, { isComposing: false, inputType: "insertCompositionText", data: text });
  });
}

describe("compositionend and input in the same task, with no render between them", () => {
  const cases: Array<[string, (spy: (v: { formattedValue: string }) => void) => React.ReactElement, string, string]> = [
    ["DateFormat", spy => <DateFormat onValueChange={spy} data-testid="field" />, "12", "12."],
    ["TimeFormat", spy => <TimeFormat onValueChange={spy} data-testid="field" />, "12", "12:"],
    ["CardNumberFormat", spy => <CardNumberFormat onValueChange={spy} data-testid="field" />, "42424", "4242 4"],
    ["CardExpiryFormat", spy => <CardExpiryFormat onValueChange={spy} data-testid="field" />, "12", "12/"],
    ["NumberFormat", spy => <NumberFormat thousandSeparator onValueChange={spy} data-testid="field" />, "1234", "1,234"]
  ];

  it.each(cases)("%s reports the commit once", (_name, element, text, shown) => {
    const spy = vi.fn();
    render(element(spy));
    commitInOneTask(field(), text);
    expect(field()).toHaveValue(shown);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("still reads a key typed right after the commit", () => {
    const spy = vi.fn();
    render(<DateFormat onValueChange={spy} data-testid="field" />);
    const el = field();
    commitInOneTask(el, "12");
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, "12.3");
      el.setSelectionRange(4, 4);
      fireEvent.input(el, { isComposing: false, inputType: "insertText", data: "3" });
    });
    expect(el).toHaveValue("12.3");
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe("a controlled InputMask disabled while composing", () => {
  it("follows value again once it is enabled", async () => {
    const { default: InputMask } = await import("../../src/index");
    function App({ value, disabled }: { value: string; disabled: boolean }) {
      return <InputMask mask="99-99" value={value} disabled={disabled} onChange={() => {}} data-testid="field" />;
    }
    const { rerender } = render(<App value="" disabled={false} />);
    const el = field();
    act(() => {
      el.focus();
      fireEvent.compositionStart(el, { data: "" });
    });
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, "1");
      fireEvent.input(el, { isComposing: true, inputType: "insertCompositionText", data: "1" });
    });
    rerender(<App value="" disabled />);
    rerender(<App value="" disabled={false} />);
    rerender(<App value="55-55" disabled={false} />);
    expect(el).toHaveValue("55-55");
  });
});
