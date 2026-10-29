import { describe, it, expect } from "vitest";
import { validateMaskPlaceholder } from "../../src/validate-props";
import type { InputMaskProps } from "../../src/types";

const validate = (mask: InputMaskProps["mask"], maskPlaceholder: string | null) => () =>
  validateMaskPlaceholder({ mask, maskPlaceholder } as InputMaskProps);

describe("validateMaskPlaceholder", () => {
  it.each<[string, InputMaskProps["mask"], string | null]>([
    ["single character", "99-99", "_"],
    ["null placeholder", "99-99", null],
    ["full placeholder", "99-99", "__-__"],
    ["full placeholder for an escaped mask", "\\99", "9_"],
    ["full placeholder for an escaped prefix", "+\\9\\98 (99) 999-99-99", "+998 (__) ___-__-__"],
    ["full placeholder for an array mask", ["+", "7", /\d/], "+7_"]
  ])("accepts %s", (_name, mask, maskPlaceholder) => {
    expect(validate(mask, maskPlaceholder)).not.toThrow();
  });

  it.each<[string, InputMaskProps["mask"], string]>([
    ["placeholder shorter than the mask", "99-99", "__"],
    ["placeholder counting the escape characters", "\\99", "9__"],
    ["placeholder longer than an array mask", ["+", "7", /\d/], "+7__"]
  ])("rejects %s", (_name, mask, maskPlaceholder) => {
    expect(validate(mask, maskPlaceholder)).toThrow(/maskPlaceholder should either be a single character/);
  });
});
