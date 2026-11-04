const CYRILLIC_TO_LATIN: Record<string, string> = {
  "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M", "Н": "H",
  "О": "O", "Р": "P", "С": "C", "Т": "T", "Х": "X", "У": "Y", "І": "I"
};

export function toLatinLookalike(char: string): string {
  const upper = char.toUpperCase();
  return CYRILLIC_TO_LATIN[upper] ?? upper;
}
