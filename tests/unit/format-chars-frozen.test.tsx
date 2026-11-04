import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { defaultFormatChars, extendedFormatChars } from "../../src/index";
import { kzIban } from "../../src/presets";

describe("shared format chars", () => {
  it("are frozen, so one module cannot change every mask in the app", () => {
    expect(Object.isFrozen(defaultFormatChars)).toBe(true);
    expect(Object.isFrozen(extendedFormatChars)).toBe(true);
    expect(() => {
      (defaultFormatChars as Record<string, RegExp>).Z = /[0-9]/;
    }).toThrow(TypeError);
  });

  it("can still be spread into a map of your own", async () => {
    const formatChars = { ...defaultFormatChars, "#": /[0-9A-F]/ };
    render(
      <>
        <InputMask mask="##-99" formatChars={formatChars} data-testid="field" />
        <InputMask {...kzIban} data-testid="iban" />
      </>
    );
    await userEvent.type(screen.getByTestId("field"), "AF12");
    expect(screen.getByTestId("field")).toHaveValue("AF-12");
    await userEvent.type(screen.getByTestId("iban"), "12");
    expect(screen.getByTestId("iban")).toHaveValue("KZ12 ____ ____ ____ ____");
  });
});
