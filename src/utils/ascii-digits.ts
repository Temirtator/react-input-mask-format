export function toAsciiDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹０-９]/g, digit => String(digit.charCodeAt(0) & 15));
}
