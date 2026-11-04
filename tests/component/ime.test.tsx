import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { useMask } from "../../src/index";
import { kzPhone } from "../../src/presets";
import { NumberFormat, useNumberFormat } from "../../src/number";
import { DateFormat, useDateFormat } from "../../src/date";

type Order = "chrome" | "firefox";

function setValue(el: HTMLInputElement, value: string): void {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, value);
}

function compose(el: HTMLInputElement, steps: string[], commit: string, order: Order): void {
  const at = el.selectionStart ?? el.value.length;
  let length = 0;
  const write = (text: string) => {
    setValue(el, el.value.slice(0, at) + text + el.value.slice(at + length));
    length = text.length;
    el.setSelectionRange(at + text.length, at + text.length);
  };
  act(() => {
    fireEvent.compositionStart(el, { data: "" });
  });
  for (const text of steps) {
    act(() => {
      write(text);
      fireEvent.input(el, { isComposing: true, inputType: "insertCompositionText", data: text });
    });
  }
  act(() => {
    write(commit);
    if (order === "chrome") {
      fireEvent.input(el, { isComposing: true, inputType: "insertCompositionText", data: commit });
      fireEvent.compositionEnd(el, { data: commit });
    } else {
      fireEvent.compositionEnd(el, { data: commit });
      fireEvent.input(el, { isComposing: false, inputType: "insertCompositionText", data: commit });
    }
  });
}

function field(): HTMLInputElement {
  return screen.getByTestId("field") as HTMLInputElement;
}

async function focusField(): Promise<void> {
  await userEvent.click(field());
  await act(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
}

function Controlled({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <InputMask
      {...kzPhone}
      value={value}
      onChange={e => {
        onChange(e.target.value);
        setValue(e.target.value);
      }}
      data-testid="field"
    />
  );
}

function MaskHook({ onChange }: { onChange: (value: string) => void }) {
  const ref = useMask({ mask: "99/99/9999" });
  return <input ref={ref} onChange={e => onChange(e.target.value)} data-testid="field" />;
}

function NumberHook({ onChange }: { onChange: (value: string) => void }) {
  const ref = useNumberFormat({ thousandSeparator: "," });
  return <input ref={ref} onChange={e => onChange(e.target.value)} data-testid="field" />;
}

function DateHook({ onChange }: { onChange: (value: string) => void }) {
  const ref = useDateFormat({});
  return <input ref={ref} onChange={e => onChange(e.target.value)} data-testid="field" />;
}

const cases: [string, (onChange: (value: string) => void) => React.ReactElement, string[], string, string][] = [
  ["uncontrolled InputMask", onChange => <InputMask mask="99/99/9999" onChange={e => onChange(e.target.value)} data-testid="field" />, ["1", "12"], "123", "12/3_/____"],
  ["controlled InputMask with a preset", onChange => <Controlled onChange={onChange} />, ["0", "01"], "012", "+7 (701) 2__-__-__"],
  ["InputMask with transform", onChange => <InputMask mask="aaaa" transform="uppercase" onChange={e => onChange(e.target.value)} data-testid="field" />, ["k", "kz", "kzb"], "kzbn", "KZBN"],
  ["useMask", onChange => <MaskHook onChange={onChange} />, ["1", "12"], "123", "12/3_/____"],
  ["NumberFormat", onChange => <NumberFormat thousandSeparator="," onChange={e => onChange(e.target.value)} data-testid="field" />, ["1", "12"], "1234", "1,234"],
  ["useNumberFormat", onChange => <NumberHook onChange={onChange} />, ["1", "12"], "1234", "1,234"],
  ["DateFormat", onChange => <DateFormat onChange={e => onChange(e.target.value)} data-testid="field" />, ["1", "12"], "123", "12.3"],
  ["useDateFormat", onChange => <DateHook onChange={onChange} />, ["1", "12"], "123", "12.3"]
];

describe.each<Order>(["chrome", "firefox"])("IME composition, %s event order", order => {
  it.each(cases)("%s masks the committed text once", async (_name, element, steps, commit, expected) => {
    const onChange = vi.fn();
    render(element(onChange));
    await focusField();
    onChange.mockClear();
    compose(field(), steps, commit, order);
    expect(field()).toHaveValue(expected);
    if (_name.startsWith("use")) {
      expect(onChange.mock.calls.at(-1)).toEqual([expected]);
      expect(onChange.mock.calls.filter(call => call[0] === expected)).toHaveLength(1);
    } else {
      expect(onChange.mock.calls).toEqual([[expected]]);
    }
  });
});

describe("IME composition", () => {
  it("keeps the composed text untouched until it is committed", async () => {
    render(<InputMask mask="99/99/9999" data-testid="field" />);
    await focusField();
    const el = field();
    act(() => {
      fireEvent.compositionStart(el, { data: "" });
      setValue(el, "12" + el.value);
      el.setSelectionRange(2, 2);
      fireEvent.input(el, { isComposing: true, inputType: "insertCompositionText", data: "12" });
    });
    expect(el.value.startsWith("12__/")).toBe(true);
  });

  it("typing after a composition still works", async () => {
    render(<InputMask mask="99/99/9999" data-testid="field" />);
    await focusField();
    compose(field(), ["1"], "12", "chrome");
    await userEvent.keyboard("3");
    expect(field()).toHaveValue("12/3_/____");
  });
});
