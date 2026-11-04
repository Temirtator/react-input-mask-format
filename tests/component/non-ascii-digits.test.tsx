import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { useMask } from "../../src/index";
import { kzPhone } from "../../src/presets";
import { NumberFormat, formatNumber, parseNumber } from "../../src/number";
import { DateFormat, formatDate } from "../../src/date";
import { formatTime } from "../../src/time";
import { formatCardNumber, detectCardBrand, formatCardCvc } from "../../src/card";
import { toAsciiDigits } from "../../src/utils/ascii-digits";

const arabic = "٠١٢٣٤٥٦٧٨٩";
const persian = "۰۱۲۳۴۵۶۷۸۹";
const fullWidth = "０１２３４５６７８９";

describe("toAsciiDigits", () => {
  it.each([arabic, persian, fullWidth])("maps %s to 0-9 and keeps the length", digits => {
    expect(toAsciiDigits(digits)).toBe("0123456789");
    expect(toAsciiDigits(`+${digits}-`)).toBe("+0123456789-");
  });

  it("leaves other characters alone", () => {
    expect(toAsciiDigits("12 ab АБ ٫ ¹")).toBe("12 ab АБ ٫ ¹");
  });
});

describe("formatters read Arabic-Indic, Persian and full-width digits", () => {
  it("number", () => {
    expect(formatNumber("١٢٣٤٫", { thousandSeparator: "," })).toBe("1,234.");
    expect(formatNumber("۱۲۳۴.۵", { thousandSeparator: "," })).toBe("1,234.5");
    expect(parseNumber("１２３４", {}).floatValue).toBe(1234);
  });

  it("date, time and card", () => {
    expect(formatDate("１２０５２０２４")).toBe("12.05.2024");
    expect(formatTime("٠٩٣٠")).toBe("09:30");
    expect(detectCardBrand("٤١١١")).toBe("visa");
    expect(formatCardNumber("٤١١١١١١١١١١١١١١١")).toBe("4111 1111 1111 1111");
    expect(formatCardCvc("１２３")).toBe("123");
  });
});

describe("fields accept them", () => {
  function Hook() {
    const ref = useMask({ mask: "99/99/9999" });
    return <input ref={ref} data-testid="hook" />;
  }

  it("as a value or typed", async () => {
    render(
      <>
        <InputMask {...kzPhone} value="٧٠١١٢٣٤٥٦٧" onChange={() => {}} data-testid="phone" />
        <InputMask mask="99/99/9999" data-testid="mask" />
        <Hook />
        <NumberFormat thousandSeparator="," data-testid="number" />
        <DateFormat data-testid="date" />
      </>
    );
    expect(screen.getByTestId("phone")).toHaveValue("+7 (701) 123-45-67");
    await userEvent.type(screen.getByTestId("mask"), "１２０５");
    expect(screen.getByTestId("mask")).toHaveValue("12/05/____");
    await userEvent.type(screen.getByTestId("hook"), "۱۲");
    expect(screen.getByTestId("hook")).toHaveValue("12/__/____");
    await userEvent.type(screen.getByTestId("number"), "١٢٣٤");
    expect(screen.getByTestId("number")).toHaveValue("1,234");
    await userEvent.type(screen.getByTestId("date"), "１２");
    expect(screen.getByTestId("date")).toHaveValue("12.");
  });
});
