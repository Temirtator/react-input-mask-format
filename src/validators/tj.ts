import { digitsOnly } from "./shared";

export function isValidTjInn(value: string): boolean {
  return digitsOnly(value).length === 9;
}
