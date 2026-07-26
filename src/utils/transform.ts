import type { Transform } from "../types";

export function resolveTransform(
  transform: Transform | undefined
): ((char: string, position: number) => string) | undefined {
  if (!transform) {
    return undefined;
  }
  if (transform === "uppercase") {
    return char => char.toUpperCase();
  }
  if (transform === "lowercase") {
    return char => char.toLowerCase();
  }
  if (typeof transform === "function") {
    return transform;
  }
  if (process.env.NODE_ENV !== "production") {
    console.error(
      `react-input-mask-format: invalid transform "${String(
        transform
      )}", expected "uppercase" | "lowercase" | (char, position) => char`
    );
  }
  return undefined;
}
