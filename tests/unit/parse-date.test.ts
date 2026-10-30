import { describe, it, expect } from "vitest";
import { parseDate, daysInMonth } from "../../src/date/parse-date";

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
