// @vitest-environment happy-dom
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { useMask } from "../../src/index";
import { kzPhone } from "../../src/presets";
import { useNumberFormat } from "../../src/number";
import { useDateFormat } from "../../src/date";

function MaskHook() {
  const ref = useMask({ mask: "99/99/9999" });
  return <input ref={ref} data-testid="field" />;
}

function NumberHook() {
  const ref = useNumberFormat({ thousandSeparator: "," });
  return <input ref={ref} data-testid="field" />;
}

function DateHook() {
  const ref = useDateFormat({});
  return <input ref={ref} data-testid="field" />;
}

describe("happy-dom", () => {
  it.each<[string, React.ReactElement, string, string]>([
    ["useMask", <MaskHook />, "12052024", "12/05/2024"],
    ["InputMask with a preset", <InputMask {...kzPhone} data-testid="field" />, "011234567", "+7 (701) 123-45-67"],
    ["useNumberFormat", <NumberHook />, "1234567", "1,234,567"],
    ["useDateFormat", <DateHook />, "12052024", "12.05.2024"]
  ])("%s formats typed text", async (_name, element, keys, expected) => {
    render(element);
    await userEvent.type(screen.getByTestId("field"), keys);
    expect(screen.getByTestId("field")).toHaveValue(expected);
  });
});
