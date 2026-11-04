import { isSingleKeystroke } from "../utils/digit-format";

export interface CardExpiryOptions {
  separator?: string;
}

export interface CardExpiryValues {
  value: string;
  formattedValue: string;
  complete: boolean;
  month: number | undefined;
  year: number | undefined;
}

function layout(
  raw: string | number,
  options: CardExpiryOptions | undefined,
  keystrokeDigits?: number
): CardExpiryValues {
  const groups = String(raw ?? "").match(/\d+/g) || [];
  const [first = "", second = ""] = groups;
  const digits = (
    keystrokeDigits === undefined &&
    groups.length === 2 &&
    first.length <= 2 &&
    (second.length === 2 || second.length === 4)
      ? first.padStart(2, "0") + second.slice(-2)
      : groups.join("")
  ).slice(0, 4);
  let month = digits.slice(0, 2);
  const year = digits.slice(2);
  if (month.length === 2 && (keystrokeDigits === undefined || keystrokeDigits === 2)) {
    month = String(Math.min(Math.max(+month, 1), 12)).padStart(2, "0");
  }
  const monthNumber = month.length === 2 ? +month : 0;
  const valid = monthNumber >= 1 && monthNumber <= 12;
  return {
    value: valid && year.length === 2 ? `${month}/${year}` : "",
    formattedValue: month.length < 2 ? month : month + (options?.separator ?? "/") + year,
    complete: month.length === 2 && year.length === 2,
    month: valid ? monthNumber : undefined,
    year: year.length === 2 ? 2000 + +year : undefined,
  };
}

export function parseCardExpiry(formatted: string, options?: CardExpiryOptions): CardExpiryValues {
  return layout(formatted, options);
}

export function parseCardExpiryEdit(
  raw: string,
  options: CardExpiryOptions,
  previous: string,
  digitsBefore: number
): CardExpiryValues {
  return layout(raw, options, isSingleKeystroke(previous, raw) ? digitsBefore : undefined);
}

export function formatCardExpiry(input: string | number, options?: CardExpiryOptions): string {
  return layout(input, options).formattedValue;
}

export function isCardExpired(month: number, year: number, now = new Date()): boolean {
  return year * 12 + month < now.getFullYear() * 12 + now.getMonth() + 1;
}
