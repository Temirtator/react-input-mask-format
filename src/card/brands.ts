import type { CardBrand } from "./types";
import { toAsciiDigits } from "../utils/ascii-digits";

export interface CardBrandInfo {
  brand: CardBrand;
  ranges: [string, string][];
  lengths: number[];
  gaps: number[];
  cvc: 3 | 4;
  luhn: boolean;
}

export const DEFAULT_GAPS = [4, 4, 4, 4, 3];

const UP_TO_19 = [16, 17, 18, 19];

function brand(
  name: CardBrand,
  ranges: [string, string][],
  lengths: number[],
  gaps = DEFAULT_GAPS,
  cvc: 3 | 4 = 3,
  luhn = true
): CardBrandInfo {
  return { brand: name, ranges, lengths, gaps, cvc, luhn };
}

export const CARD_BRANDS: CardBrandInfo[] = [
  brand("visa", [["4", "4"]], [13, 16, 19]),
  brand("mastercard", [["51", "55"], ["2221", "2720"]], [16]),
  brand("amex", [["34", "34"], ["37", "37"]], [15], [4, 6, 5], 4),
  brand("diners", [["300", "305"], ["36", "36"], ["38", "39"]], [14, 15, ...UP_TO_19], [4, 6, 4]),
  brand("discover", [["6011", "6011"], ["644", "659"]], UP_TO_19),
  brand("unionpay", [["62", "62"], ["81", "81"]], UP_TO_19, DEFAULT_GAPS, 3, false),
  brand("jcb", [["3528", "3589"]], UP_TO_19),
  brand(
    "maestro",
    [["50", "50"], ["5600", "5613"], ["5615", "5899"], ["63", "63"], ["67", "67"]],
    [12, 13, 14, 15, ...UP_TO_19]
  ),
  brand("mir", [["2200", "2204"]], UP_TO_19),
  brand("uzcard", [["8600", "8600"], ["5614", "5614"]], [16]),
  brand("humo", [["9860", "9860"]], [16]),
  brand("belkart", [["9112", "9112"]], [16]),
  brand("elcart", [["9417", "9417"]], [16]),
];

function compatible(digits: string, [lo, hi]: [string, string]): boolean {
  const n = Math.min(digits.length, lo.length);
  const head = digits.slice(0, n);
  return lo.slice(0, n) <= head && head <= hi.slice(0, n);
}

export function cardBrandInfo(digits: string): CardBrandInfo | undefined {
  const matches = CARD_BRANDS.filter((info) =>
    info.ranges.some((range) => compatible(digits, range))
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function detectCardBrand(value: string): CardBrand | undefined {
  return cardBrandInfo(toAsciiDigits(String(value ?? "")).replace(/\D/g, ""))?.brand;
}
