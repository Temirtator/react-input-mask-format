import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { useMask } from "../../src/index";
import { kzPhone } from "../../src/presets";
import type { InputMaskProps, UseMaskOptions } from "../../src/types";
import {
  compareStrictMode,
  frames,
  focus,
  blur,
  selectAll,
  external,
  type,
  paste,
  caret,
  rerender
} from "./strict-mode-harness";
import type { FieldProps, Row } from "./strict-mode-harness";

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

function MaskField({ emit, ...options }: FieldProps) {
  return (
    <InputMask
      {...(options as InputMaskProps)}
      data-testid="field"
      onChange={e => emit((e.target as HTMLInputElement).value)}
    />
  );
}

function MaskControlled({ emit, initial = "", external = "", ...options }: FieldProps) {
  const [value, setValue] = useState(initial as string);
  return (
    <>
      <InputMask
        {...(options as InputMaskProps)}
        value={value}
        data-testid="field"
        onChange={e => {
          emit((e.target as HTMLInputElement).value);
          setValue((e.target as HTMLInputElement).value);
        }}
      />
      <button type="button" onClick={() => setValue(external as string)}>external</button>
    </>
  );
}

function MaskHook({ emit, defaultValue, autoFocus, ...options }: FieldProps) {
  const ref = useMask(options as UseMaskOptions);
  return (
    <input
      ref={ref}
      defaultValue={defaultValue as string | undefined}
      autoFocus={autoFocus as boolean | undefined}
      data-testid="field"
      onChange={e => emit(e.target.value)}
    />
  );
}

const date = { mask: "99/99/9999" };
const phone = { ...kzPhone };
const replaceUnderscores: InputMaskProps["beforeMaskedStateChange"] = ({ nextState }) => ({
  ...nextState,
  value: nextState.value.replace(/_/g, "-")
});

const maskRows: Row[] = [
  ["types key by key", date, [focus, type("12345678")], "12/34/5678"],
  ["Backspace", date, [focus, type("1234"), type("{Backspace}{Backspace}")], "12/__/____"],
  ["Delete in the middle", date, [focus, type("12312024"), caret(3), type("{Delete}")], "12/_1/2024"],
  ["overwrites in the middle", { mask: "9999 9999" }, [focus, type("1234"), caret(2), type("9")], "1294 ____"],
  ["pastes", phone, [focus, paste("+7 701 555 44 33")], "+7 (701) 555-44-33"],
  ["select all + retype", phone, [focus, type("7011234567"), selectAll, type("77779876543")], "+7 (777) 987-65-43"],
  [
    "select all + paste",
    phone,
    [focus, type("7011234567"), selectAll, paste("+7 701 555 44 33")],
    "+7 (701) 555-44-33"
  ],
  ["select all + Backspace", { mask: "99/99" }, [focus, type("1234"), selectAll, type("{Backspace}")], "__/__"],
  ["focus and blur", { mask: "99/99" }, [focus, blur], ""],
  ["alwaysShowMask", { mask: "99/99", alwaysShowMask: true }, [focus, type("1"), blur], "1_/__"],
  ["transform", { mask: "AAA", formatChars: { A: /[A-Z]/ }, transform: "uppercase" }, [focus, type("abc")], "ABC"],
  [
    "beforeMaskedStateChange",
    { mask: "99/99", beforeMaskedStateChange: replaceUnderscores },
    [focus, type("1")],
    "1-/--"
  ],
  ["autoFocus", { ...date, autoFocus: true }, [focus, type("12345678"), selectAll, type("8765")], "87/65/____"]
];

const maskComponentRows: Row[] = [
  ["mask change", { mask: "99/99" }, [focus, type("1234"), rerender({ mask: "99-99-99" })], "12-34-__"]
];

const maskControlledRows: Row[] = [
  ["formats the initial value", { mask: "99/99", initial: "1234" }, [focus, type("{Backspace}")], "12/3_"],
  ["external value change", { mask: "99/99", external: "5678" }, [focus, type("12"), external], "56/78"]
];

const maskUncontrolledRows: Row[] = [
  ["formats defaultValue", { mask: "99/99", defaultValue: "1234" }, [], "12/34"],
  ["edits defaultValue", { mask: "99/99", defaultValue: "1234" }, [focus, type("{Backspace}")], "12/3_"]
];

const maskHookRows: Row[] = [
  [
    "mask change applies to the next edit",
    { mask: "99/99" },
    [focus, type("1234"), rerender({ mask: "99-99-99" }), selectAll, type("123456")],
    "12-34-56"
  ]
];

compareStrictMode([
  ["InputMask", MaskField, [...maskRows, ...maskComponentRows, ...maskUncontrolledRows], frames],
  ["InputMask controlled", MaskControlled, [...maskRows, ...maskComponentRows, ...maskControlledRows], frames],
  ["useMask", MaskHook, [...maskRows, ...maskUncontrolledRows, ...maskHookRows], frames]
]);
