import { describe, it, expect } from "vitest";
import { CARD_BRANDS, cardBrandInfo, detectCardBrand } from "../../src/card/brands";
import { luhn } from "../../src/validators/shared";
import { withLuhn } from "./card-test-numbers";

function shift(edge: string, by: number): string {
  return String(Number(edge) + by).padStart(edge.length, "0");
}

const edges = CARD_BRANDS.flatMap((info) =>
  info.ranges.map(([lo, hi]) => ({ brand: info.brand, lo, hi }))
);

describe("withLuhn", () => {
  it("appends a check digit that passes Luhn", () => {
    expect(withLuhn("411111111111111")).toBe("4111111111111111");
    expect(luhn(withLuhn("986000000000000"))).toBe(true);
  });
});

describe("detectCardBrand range edges", () => {
  it.each(edges)("$lo–$hi → $brand", ({ brand, lo, hi }) => {
    expect(detectCardBrand(lo)).toBe(brand);
    expect(detectCardBrand(hi)).toBe(brand);
    expect(detectCardBrand(shift(lo, -1))).not.toBe(brand);
    expect(detectCardBrand(shift(hi, 1))).not.toBe(brand);
  });
});

describe("detectCardBrand partial input", () => {
  it.each([
    ["4", "visa"],
    ["2", undefined],
    ["22", undefined],
    ["220", "mir"],
    ["222", "mastercard"],
    ["2220", undefined],
    ["6", undefined],
    ["60", "discover"],
    ["62", "unionpay"],
    ["81", "unionpay"],
    ["1", undefined],
    ["", undefined],
    ["3", undefined],
    ["34", "amex"],
    ["35", "jcb"],
    ["352", "jcb"],
    ["3527", undefined],
    ["30", "diners"],
    ["56", undefined],
    ["5614", "uzcard"],
    ["5615", "maestro"],
    ["57", "maestro"],
    ["9", undefined],
    ["98", "humo"],
    ["86", "uzcard"],
    ["4111-11", "visa"],
    ["4111 1111 1111 1111", "visa"],
  ])("%j → %s", (input, brand) => {
    expect(detectCardBrand(input)).toBe(brand);
  });
});

describe("cardBrandInfo", () => {
  it("returns the table row with lengths, gaps, CVC size and the Luhn flag", () => {
    expect(cardBrandInfo("378282246310005")).toMatchObject({
      brand: "amex",
      lengths: [15],
      gaps: [4, 6, 5],
      cvc: 4,
      luhn: true,
    });
    expect(cardBrandInfo("6200")).toMatchObject({ brand: "unionpay", luhn: false });
    expect(cardBrandInfo("0")).toBeUndefined();
  });

  it("lists the thirteen brands of the spec", () => {
    expect(CARD_BRANDS.map((info) => info.brand).sort()).toEqual(
      [
        "amex", "belkart", "diners", "discover", "elcart", "humo", "jcb", "maestro",
        "mastercard", "mir", "unionpay", "uzcard", "visa",
      ]
    );
  });
});
