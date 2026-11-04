export function toAsciiDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹０-９]/g, digit => String(digit.charCodeAt(0) & 15));
}

export function toAsciiNumber(text: string): string {
  return toAsciiDigits(text).replace(/[\u066b\uff0e]/g, ".");
}
