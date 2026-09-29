// The 12 Cyrillic letters allowed on Russian plates (ГОСТ Р 50577-2018)
export const RU_PLATE_LETTERS = "АВЕКМНОРСТУХ";

// Latin look-alikes a user may type on an English layout
const LATIN_TO_CYRILLIC: Record<string, string> = {
  A: "А", B: "В", E: "Е", K: "К", M: "М", H: "Н",
  O: "О", P: "Р", C: "С", T: "Т", Y: "У", X: "Х"
};

export function toRuPlateChar(char: string): string {
  const upper = char.toUpperCase();
  return LATIN_TO_CYRILLIC[upper] ?? upper;
}
