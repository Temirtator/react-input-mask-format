import { describe, it, expect } from "vitest";
import { defaultFormatChars, extendedFormatChars } from "../../src/constants";

describe("extendedFormatChars", () => {
  it("keeps the default tokens unchanged", () => {
    expect(extendedFormatChars["9"].test("5")).toBe(true);
    expect(extendedFormatChars["a"].test("x")).toBe(true);
    expect(extendedFormatChars["*"].test("Z")).toBe(true);
    // default map is NOT mutated
    expect(defaultFormatChars["A"]).toBeUndefined();
  });
  it("adds A (uppercase Latin)", () => {
    expect(extendedFormatChars["A"].test("Q")).toBe(true);
    expect(extendedFormatChars["A"].test("q")).toBe(false);
  });
  it("adds Я (Cyrillic incl. Kazakh letters)", () => {
    expect(extendedFormatChars["Я"].test("Ж")).toBe(true);
    expect(extendedFormatChars["Я"].test("Ә")).toBe(true);
    expect(extendedFormatChars["Я"].test("і")).toBe(true);
    expect(extendedFormatChars["Я"].test("5")).toBe(false);
  });
  it("adds # (hex digit)", () => {
    expect(extendedFormatChars["#"].test("f")).toBe(true);
    expect(extendedFormatChars["#"].test("F")).toBe(true);
    expect(extendedFormatChars["#"].test("g")).toBe(false);
  });
});
