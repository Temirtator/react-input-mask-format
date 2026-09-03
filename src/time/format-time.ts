import type { TimeFormatOptions } from "./types";

export interface TimeParts {
  hours: string;
  minutes: string;
}

export function tokenizeTime(raw: string | number, _separator: string): TimeParts {
  const digits = String(raw ?? "").replace(/\D/g, "").slice(0, 4);
  let hours = digits.slice(0, 2);
  let minutes = digits.slice(2, 4);
  if (hours.length === 2) {
    hours = String(Math.min(parseInt(hours, 10), 23)).padStart(2, "0");
  }
  if (minutes.length === 2) {
    minutes = String(Math.min(parseInt(minutes, 10), 59)).padStart(2, "0");
  }
  return { hours, minutes };
}

export function buildFormatted(parts: TimeParts, separator: string): string {
  const { hours, minutes } = parts;
  if (hours === "") return "";
  if (hours.length < 2) return hours;
  if (minutes === "") return hours + separator;
  return hours + separator + minutes;
}

export function formatTime(input: string | number, options?: TimeFormatOptions): string {
  const separator = options?.separator ?? ":";
  return buildFormatted(tokenizeTime(input, separator), separator);
}
