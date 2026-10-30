import type React from "react";
import type { DateFormatOptions, DateFormatValues } from "./types";
import { formatDate } from "./format-date";
import { parseDateEdit } from "./parse-date";
import { useDigitFormat } from "../utils/digit-format";
import type { DigitFormatKind } from "../utils/digit-format";

export interface UseDateFormatOptions extends DateFormatOptions {
  onValueChange?: (values: DateFormatValues) => void;
}

export const dateKind: DigitFormatKind<DateFormatOptions, DateFormatValues> = {
  separator: (options) => options.separator ?? ".",
  format: formatDate,
  parse: parseDateEdit,
};

export function useDateFormat(
  options: UseDateFormatOptions
): React.RefCallback<HTMLInputElement> {
  return useDigitFormat(dateKind, options);
}
