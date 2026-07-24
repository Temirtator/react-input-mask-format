import type { FormatChars } from "./types";

export const CONTROLLED_PROPS = [
  "disabled",
  "onBlur",
  "onChange",
  "onFocus",
  "onMouseDown",
  "readOnly",
  "value"
] as const;

export const defaultFormatChars: FormatChars = {
  "9": /[0-9]/,
  a: /[A-Za-z]/,
  "*": /[A-Za-z0-9]/
};

export const extendedFormatChars: FormatChars = {
  ...defaultFormatChars,
  A: /[A-Z]/,
  "Я": /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/,
  "#": /[0-9A-Fa-f]/
};
