import type React from "react";
import type { TimeFormatOptions, TimeFormatValues } from "./types";
import { formatTime } from "./format-time";
import { parseTime } from "./parse-time";
import { useDigitFormat } from "../utils/digit-format";
import type { DigitFormatKind } from "../utils/digit-format";

export interface UseTimeFormatOptions extends TimeFormatOptions {
  onValueChange?: (values: TimeFormatValues) => void;
}

export const timeKind: DigitFormatKind<TimeFormatOptions, TimeFormatValues> = {
  separator: (options) => options.separator ?? ":",
  format: formatTime,
  parse: parseTime,
};

export function useTimeFormat(
  options: UseTimeFormatOptions
): React.RefCallback<HTMLInputElement> {
  return useDigitFormat(timeKind, options);
}
