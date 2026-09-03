import { describe, it, expect } from "vitest";
import { parseTime, digitsBeforeCaret, resolveCaret } from "../../src/time/parse-time";

describe("parseTime", () => {
  it("has no value or parts when empty", () => {
    expect(parseTime("")).toEqual({
      value: "",
      formattedValue: "",
      hours: undefined,
      minutes: undefined,
    });
  });
  it("defines hours but not value when only hours are complete", () => {
    expect(parseTime("22")).toEqual({
      value: "",
      formattedValue: "22:",
      hours: 22,
      minutes: undefined,
    });
  });
  it("sets the canonical value (always ':') only when complete", () => {
    expect(parseTime("2230")).toEqual({
      value: "22:30",
      formattedValue: "22:30",
      hours: 22,
      minutes: 30,
    });
  });
  it("clamps within the parsed parts", () => {
    expect(parseTime("2999")).toEqual({
      value: "23:59",
      formattedValue: "23:59",
      hours: 23,
      minutes: 59,
    });
  });
  it("keeps canonical value on ':' even with a custom display separator", () => {
    expect(parseTime("22.30", { separator: "." })).toEqual({
      value: "22:30",
      formattedValue: "22.30",
      hours: 22,
      minutes: 30,
    });
  });
});

describe("digitsBeforeCaret", () => {
  it("counts digits left of the caret", () => {
    expect(digitsBeforeCaret("22:30", 3)).toBe(2);
    expect(digitsBeforeCaret("22:30", 5)).toBe(4);
  });
});

describe("resolveCaret", () => {
  it("steps past the separator after completed hours", () => {
    const values = parseTime("22");
    expect(resolveCaret(values, 2)).toBe(3);
  });
  it("lands after the last typed digit mid-minutes", () => {
    const values = parseTime("223");
    expect(resolveCaret(values, 3)).toBe(4);
  });
});
