import { defaultFormatChars } from "../constants";
import type { Mask } from "../types";

export interface ParsedMaskOptions {
  maskPlaceholder: string | null;
  mask: Array<string | RegExp> | null;
  prefix: string | null;
  lastEditablePosition: number | null;
  permanents: number[];
}

export default function parseMask({
  mask,
  maskPlaceholder
}: {
  mask?: Mask | null;
  maskPlaceholder?: string | null;
}): ParsedMaskOptions {
  const permanents: number[] = [];

  if (!mask) {
    return {
      maskPlaceholder: null,
      mask: null,
      prefix: null,
      lastEditablePosition: null,
      permanents: []
    };
  }

  let parsedMask: Array<string | RegExp>;

  if (typeof mask === "string") {
    let isPermanent = false;
    let parsedMaskString = "";
    mask.split("").forEach(character => {
      if (!isPermanent && character === "\\") {
        isPermanent = true;
      } else {
        if (isPermanent || !defaultFormatChars[character]) {
          permanents.push(parsedMaskString.length);
        }
        parsedMaskString += character;
        isPermanent = false;
      }
    });

    parsedMask = parsedMaskString.split("").map((character, index) => {
      if (permanents.indexOf(index) === -1) {
        return defaultFormatChars[character];
      }
      return character;
    });
  } else {
    mask.forEach((character, index) => {
      if (typeof character === "string") {
        permanents.push(index);
      }
    });
    parsedMask = mask;
  }

  let parsedPlaceholder: string | null = maskPlaceholder ?? null;

  if (parsedPlaceholder) {
    let placeholderChars: Array<string | RegExp>;

    if (parsedPlaceholder.length === 1) {
      placeholderChars = parsedMask.map((character, index) => {
        if (permanents.indexOf(index) !== -1) {
          return character;
        }
        return parsedPlaceholder as string;
      });
    } else {
      placeholderChars = parsedPlaceholder.split("");
    }

    permanents.forEach(position => {
      placeholderChars[position] = parsedMask[position];
    });

    parsedPlaceholder = placeholderChars.join("");
  }

  const prefix = permanents
    .filter((position, index) => position === index)
    .map(position => parsedMask[position])
    .join("");

  let lastEditablePosition = parsedMask.length - 1;
  while (permanents.indexOf(lastEditablePosition) !== -1) {
    lastEditablePosition--;
  }

  return {
    maskPlaceholder: parsedPlaceholder,
    prefix,
    mask: parsedMask,
    lastEditablePosition,
    permanents
  };
}
