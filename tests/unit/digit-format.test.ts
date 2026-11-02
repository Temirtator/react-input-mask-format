import { describe, it, expect } from "vitest";
import { deleteAcrossSeparator, isSingleKeystroke } from "../../src/utils/digit-format";

describe("deleteAcrossSeparator", () => {
  it.each([
    ["41111111", "4111 1111", 4, false, { raw: "411 1111", caret: 3 }],
    ["41111111", "4111 1111", 4, true, { raw: "4111 111", caret: 4 }],
    ["05 /12 / 2024", "05 / 12 / 2024", 4, false, { raw: "0 / 12 / 2024", caret: 1 }],
    ["1234", " 1234", 0, false, { raw: "1234", caret: 0 }],
    ["411 1111", "4111 1111", 3, false, { raw: "411 1111", caret: 3 }],
    ["1230", "12:30", 2, true, { raw: "12:0", caret: 2 }],
    ["1234", "1234 ", 4, true, { raw: "1234", caret: 4 }],
  ])("(%j, %j, %i, %s)", (raw, previous, caret, forward, expected) => {
    expect(deleteAcrossSeparator(raw, previous, caret, forward)).toEqual(expected);
  });
});

describe("isSingleKeystroke", () => {
  it("accepts one inserted digit or a pure deletion", () => {
    expect(isSingleKeystroke("12.0", "12.05")).toBe(true);
    expect(isSingleKeystroke("12.05", "12.0")).toBe(true);
    expect(isSingleKeystroke("", "12/2026")).toBe(false);
  });
});
