import { describe, it, expect } from "vitest";
import { parseDate, parseDateEdit, daysInMonth } from "../../src/date/parse-date";
import { isSingleKeystroke } from "../../src/date/format-date";

describe("parseDate", () => {
  it("has no value or parts when empty", () => {
    expect(parseDate("")).toEqual({
      value: "",
      formattedValue: "",
      day: undefined,
      month: undefined,
      year: undefined,
    });
  });

  it("returns the ISO value and the parts of a complete date", () => {
    expect(parseDate("12.05.2024")).toEqual({
      value: "2024-05-12",
      formattedValue: "12.05.2024",
      day: 12,
      month: 5,
      year: 2024,
    });
  });

  it("defines the complete parts of a partial date", () => {
    expect(parseDate("12.05.")).toEqual({
      value: "",
      formattedValue: "12.05.",
      day: 12,
      month: 5,
      year: undefined,
    });
    expect(parseDate("1")).toEqual({
      value: "",
      formattedValue: "1",
      day: undefined,
      month: undefined,
      year: undefined,
    });
  });

  it("uses ISO for the value whatever the order and separator", () => {
    expect(parseDate("05/12/2024", { order: "mdy", separator: "/" }).value).toBe("2024-05-12");
    expect(parseDate("2024 05 12", { order: "ymd", separator: " " }).value).toBe("2024-05-12");
  });

  it.each([
    ["29.02.2024", "2024-02-29"],
    ["29.02.2000", "2000-02-29"],
    ["29.02.2023", ""],
    ["29.02.1900", ""],
    ["31.04.2024", ""],
    ["30.04.2024", "2024-04-30"],
    ["31.12.0000", "0000-12-31"],
  ])("%s → value %j", (input, value) => {
    expect(parseDate(input).value).toBe(value);
  });

  it("keeps the parts of a date that does not exist", () => {
    expect(parseDate("31.02.2024")).toMatchObject({ day: 31, month: 2, year: 2024, value: "" });
  });
});

describe("daysInMonth", () => {
  it.each([
    [2024, 2, 29],
    [2023, 2, 28],
    [1900, 2, 28],
    [2000, 2, 29],
    [2024, 4, 30],
    [2024, 12, 31],
  ])("%i-%i → %i", (year, month, days) => {
    expect(daysInMonth(year, month)).toBe(days);
  });
});

describe("parseDateEdit", () => {
  it.each<[string, string, number, string, string]>([
    ["1.05.2024", "12.05.2024", 1, "10.52.024", ""],
    ["120.52.024", "10.52.024", 2, "12.05.2024", "2024-05-12"],
    ["12.0.2024", "12.05.2024", 3, "12.02.024", ""],
    ["12.052.024", "12.02.024", 4, "12.05.2024", "2024-05-12"],
    ["4", "", 1, "4", ""],
    ["45", "4", 2, "31.", ""],
    ["12.05.2024", "", 8, "12.05.2024", "2024-05-12"],
    ["1.5.2024", "", 6, "01.05.2024", "2024-05-01"],
    ["1.5.2024", "12.05.2024", 6, "01.05.2024", "2024-05-01"],
  ])("%j after %j with %i digits before the caret → %j", (raw, previous, digits, formatted, value) => {
    const values = parseDateEdit(raw, {}, previous, digits);
    expect(values.formattedValue).toBe(formatted);
    expect(values.value).toBe(value);
  });
});

describe("isSingleKeystroke", () => {
  it.each<[string, string, boolean]>([
    ["", "1", true],
    ["12.", "12.0", true],
    ["12.05.2024", "12.0.2024", true],
    ["12.05.2024", "12.7.2024", true],
    ["12.05.2024", "12.2024", true],
    ["", "2024-05-12", false],
    ["12.05.2024", "2024-05-12", false],
    ["12.05.2024", "1.5.2024", false],
  ])("%j → %j: %j", (previous, raw, expected) => {
    expect(isSingleKeystroke(previous, raw)).toBe(expected);
  });
});
