import { describe, it, expect, vi } from "vitest";
import { resolveTransform } from "../../src/utils/transform";

describe("resolveTransform", () => {
  it("returns undefined for undefined", () => {
    expect(resolveTransform(undefined)).toBeUndefined();
  });
  it("maps 'uppercase' to an upper-casing fn", () => {
    expect(resolveTransform("uppercase")!("a", 0)).toBe("A");
  });
  it("maps 'lowercase' to a lower-casing fn", () => {
    expect(resolveTransform("lowercase")!("A", 0)).toBe("a");
  });
  it("passes a function through", () => {
    const fn = (c: string) => c + "!";
    expect(resolveTransform(fn)).toBe(fn);
  });
  it("warns and returns undefined for an invalid string value", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(resolveTransform("weird" as never)).toBeUndefined();
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
