import { findLastIndex, repeat } from "./helpers";
import parseMask, { ParsedMaskOptions } from "./parse-mask";
import type { FormatChars, InputState, Selection } from "../types";

export default class MaskUtils {
  maskOptions: ParsedMaskOptions;
  transform?: (char: string, position: number) => string;

  constructor(options: {
    mask?: string | Array<string | RegExp> | null;
    maskPlaceholder?: string | null;
    formatChars?: FormatChars;
    transform?: (char: string, position: number) => string;
  }) {
    this.maskOptions = parseMask(options);
    this.transform = options.transform;
  }

  isCharacterAllowedAtPosition = (character: string, position: number): boolean => {
    const { maskPlaceholder } = this.maskOptions;

    if (this.isCharacterFillingPosition(character, position)) {
      return true;
    }

    if (!maskPlaceholder) {
      return false;
    }

    return maskPlaceholder[position] === character;
  };

  isCharacterFillingPosition = (character: string, position: number): boolean => {
    const { mask } = this.maskOptions;

    if (!character || position >= mask!.length) {
      return false;
    }

    if (!this.isPositionEditable(position)) {
      return mask![position] === character;
    }

    const charRule = mask![position];
    return new RegExp(charRule).test(character);
  };

  isPositionEditable = (position: number): boolean => {
    const { mask, permanents } = this.maskOptions;
    return position < mask!.length && permanents.indexOf(position) === -1;
  };

  isValueEmpty = (value: string): boolean => {
    return value.split("").every((character, position) => {
      return (
        !this.isPositionEditable(position) ||
        !this.isCharacterFillingPosition(character, position)
      );
    });
  };

  isValueFilled = (value: string): boolean => {
    return (
      this.getFilledLength(value) === this.maskOptions.lastEditablePosition! + 1
    );
  };

  getDefaultSelectionForValue = (value: string): Selection => {
    const filledLength = this.getFilledLength(value);
    const cursorPosition = this.getRightEditablePosition(filledLength);
    return { start: cursorPosition, end: cursorPosition };
  };

  getFilledLength = (value: string): number => {
    const characters = value.split("");
    const lastFilledIndex = findLastIndex(characters, (character, position) => {
      return (
        this.isPositionEditable(position) &&
        this.isCharacterFillingPosition(character, position)
      );
    });
    return lastFilledIndex + 1;
  };

  getStringFillingLengthAtPosition = (string: string, position: number): number => {
    const characters = string.split("");
    const insertedValue = characters.reduce((value, character) => {
      return this.insertCharacterAtPosition(value, character, value.length);
    }, repeat(" ", position));

    return insertedValue.length - position;
  };

  getLeftEditablePosition = (position: number): number | null => {
    for (let i = position; i >= 0; i--) {
      if (this.isPositionEditable(i)) {
        return i;
      }
    }
    return null;
  };

  getRightEditablePosition = (position: number): number | null => {
    const { mask } = this.maskOptions;
    for (let i = position; i < mask!.length; i++) {
      if (this.isPositionEditable(i)) {
        return i;
      }
    }
    return null;
  };

  // Number of editable positions from `position` to the end of the mask
  countEditablePositionsFrom = (position: number): number => {
    const { mask } = this.maskOptions;
    let count = 0;
    for (let i = position; i < mask!.length; i++) {
      if (this.isPositionEditable(i)) {
        count++;
      }
    }
    return count;
  };

  // Indices of characters in `string` that could fill some editable position
  // (`transform` must be pure: it may be called for several positions)
  getFillingCharacterIndices = (string: string): number[] => {
    const { mask } = this.maskOptions;
    const indices: number[] = [];
    for (let i = 0; i < string.length; i++) {
      for (let position = 0; position < mask!.length; position++) {
        if (!this.isPositionEditable(position)) {
          continue;
        }
        const character = this.transform
          ? this.transform(string[i], position)
          : string[i];
        if (this.isCharacterFillingPosition(character, position)) {
          indices.push(i);
          break;
        }
      }
    }
    return indices;
  };

  // A mask that starts with fixed letters/digits (e.g. "+998 (", "KZ")
  hasSignificantPrefix = (): boolean => {
    const { prefix } = this.maskOptions;
    return !!prefix && /[0-9A-Za-z]/.test(prefix);
  };

  // Text entered at or inside the prefix (position <= prefix length) of a prefixed mask that has more filling characters
  // than the mask has slots carries its own country/trunk prefix
  // ("+998 90 123 45 67", "8 912 …", "0555 …"): keep only the last characters that fit.
  // Replacing text from inside a significant prefix (e.g. select all + paste) inserts after the
  // prefix, unless the user is typing the prefix itself (first char equals the prefix char there,
  // case-insensitively after transform) or the text fills nothing after the prefix.
  shouldInsertAfterPrefix = (string: string, position: number, wasTrimmed: boolean): boolean => {
    const { prefix } = this.maskOptions;
    if (!string || !this.hasSignificantPrefix() || position >= prefix!.length) {
      return false;
    }
    if (!wasTrimmed) {
      const first = this.transform ? this.transform(string[0], position) : string[0];
      if (first.toUpperCase() === prefix![position].toUpperCase()) {
        return false; // the user is typing the prefix itself
      }
    }
    // redirect only if the text actually fills something after the prefix
    return this.getStringFillingLengthAtPosition(string, prefix!.length) > 0;
  };

  trimOverflowingPrefix = (string: string, position: number): string => {
    const { prefix } = this.maskOptions;
    if (!this.hasSignificantPrefix() || position > prefix!.length) {
      return string;
    }
    const slots = this.countEditablePositionsFrom(prefix!.length);
    const indices = this.getFillingCharacterIndices(string);
    if (indices.length <= slots) {
      return string;
    }
    return string.slice(indices[indices.length - slots]);
  };

  // A raw value that does not start with the mask prefix and holds at least as many
  // filling characters as the mask has slots ("901234567", "+998901234567",
  // "89123456789") is placed after the prefix, keeping its last characters.
  normalizeUnprefixedValue = (value: string): string | null => {
    const { prefix } = this.maskOptions;
    if (!this.hasSignificantPrefix() || !value || value.startsWith(prefix!)) {
      return null;
    }
    const slots = this.countEditablePositionsFrom(prefix!.length);
    const indices = this.getFillingCharacterIndices(value);
    if (indices.length < slots) {
      return null;
    }
    return value.slice(indices[indices.length - slots]);
  };

  formatValue = (value: string): string => {
    const { maskPlaceholder, mask, prefix } = this.maskOptions;
    const unprefixed = this.normalizeUnprefixedValue(value);
    const start = unprefixed === null ? 0 : prefix!.length;
    if (unprefixed !== null) {
      value = unprefixed;
    }

    if (!maskPlaceholder) {
      value = this.insertStringAtPosition(start ? prefix! : "", value, start);

      while (
        value.length < mask!.length &&
        !this.isPositionEditable(value.length)
      ) {
        value += mask![value.length];
      }

      return value;
    }

    return this.insertStringAtPosition(maskPlaceholder, value, start);
  };

  clearRange = (value: string, start: number, len: number): string => {
    if (!len) {
      return value;
    }

    const end = start + len;
    const { maskPlaceholder, mask } = this.maskOptions;

    const clearedValue = value
      .split("")
      .map((character, i) => {
        const isEditable = this.isPositionEditable(i);

        if (!maskPlaceholder && i >= end && !isEditable) {
          return "";
        }
        if (i < start || i >= end) {
          return character;
        }
        if (!isEditable) {
          return mask![i];
        }
        if (maskPlaceholder) {
          return maskPlaceholder[i];
        }
        return "";
      })
      .join("");

    return this.formatValue(clearedValue);
  };

  insertCharacterAtPosition = (value: string, character: string, position: number): string => {
    const { mask, maskPlaceholder } = this.maskOptions;
    if (position >= mask!.length) {
      return value;
    }

    const transformedCharacter =
      this.transform && this.isPositionEditable(position)
        ? this.transform(character, position)
        : character;

    const isAllowed = this.isCharacterAllowedAtPosition(transformedCharacter, position);
    const isEditable = this.isPositionEditable(position);
    const nextEditablePosition = this.getRightEditablePosition(position);
    const isNextPlaceholder =
      maskPlaceholder && nextEditablePosition
        ? transformedCharacter === maskPlaceholder[nextEditablePosition]
        : null;
    const valueBefore = value.slice(0, position);

    if (isAllowed || !isEditable) {
      const insertedCharacter = isAllowed ? transformedCharacter : mask![position];
      value = valueBefore + insertedCharacter;
    }

    if (!isAllowed && !isEditable && !isNextPlaceholder) {
      value = this.insertCharacterAtPosition(value, character, position + 1);
    }

    return value;
  };

  insertStringAtPosition = (value: string, string: string, position: number): string => {
    const { mask, maskPlaceholder } = this.maskOptions;
    if (!string || position >= mask!.length) {
      return value;
    }

    const characters = string.split("");
    const isFixedLength = this.isValueFilled(value) || !!maskPlaceholder;
    const valueAfter = value.slice(position);

    value = characters.reduce((value, character) => {
      return this.insertCharacterAtPosition(value, character, value.length);
    }, value.slice(0, position));

    if (isFixedLength) {
      value += valueAfter.slice(value.length - position);
    } else if (this.isValueFilled(value)) {
      value += mask!.slice(value.length).join("");
    } else {
      const editableCharactersAfter = valueAfter
        .split("")
        .filter((character, i) => {
          return this.isPositionEditable(position + i);
        });
      value = editableCharactersAfter.reduce((value, character) => {
        const nextEditablePosition = this.getRightEditablePosition(
          value.length
        );
        if (nextEditablePosition === null) {
          return value;
        }

        if (!this.isPositionEditable(value.length)) {
          value += mask!.slice(value.length, nextEditablePosition).join("");
        }

        return this.insertCharacterAtPosition(value, character, value.length);
      }, value);
    }

    return value;
  };

  processChange = (currentState: InputState, previousState: InputState): InputState & { enteredString: string } => {
    const { mask, prefix, lastEditablePosition } = this.maskOptions;
    const { value, selection } = currentState;
    const previousValue = previousState.value;
    const previousSelection = previousState.selection;
    let newValue = value;
    let enteredString = "";
    let formattedEnteredStringLength = 0;
    let removedLength = 0;
    let insertAfterPrefix = false;
    let cursorPosition = Math.min(previousSelection.start!, selection.start!);

    if (selection.end! > previousSelection.start!) {
      const raw = newValue.slice(previousSelection.start!, selection.end!);
      enteredString = this.trimOverflowingPrefix(raw, cursorPosition);
      insertAfterPrefix = this.shouldInsertAfterPrefix(
        enteredString,
        cursorPosition,
        enteredString !== raw
      );
      formattedEnteredStringLength = this.getStringFillingLengthAtPosition(
        enteredString,
        insertAfterPrefix ? prefix!.length : cursorPosition
      );
      if (!formattedEnteredStringLength) {
        removedLength = 0;
      } else {
        removedLength = previousSelection.length!;
      }
    } else if (newValue.length < previousValue.length) {
      removedLength = previousValue.length - newValue.length;
    }

    newValue = previousValue;

    if (removedLength) {
      if (removedLength === 1 && !previousSelection.length) {
        const deleteFromRight = previousSelection.start === selection.start;
        cursorPosition = (deleteFromRight
          ? this.getRightEditablePosition(selection.start!)
          : this.getLeftEditablePosition(selection.start!))!;
      }
      newValue = this.clearRange(newValue, cursorPosition, removedLength);
    }

    if (insertAfterPrefix) {
      cursorPosition = prefix!.length;
    }

    newValue = this.insertStringAtPosition(
      newValue,
      enteredString,
      cursorPosition
    );

    cursorPosition += formattedEnteredStringLength;
    if (cursorPosition >= mask!.length) {
      cursorPosition = mask!.length;
    } else if (
      cursorPosition < prefix!.length &&
      !formattedEnteredStringLength
    ) {
      cursorPosition = prefix!.length;
    } else if (
      cursorPosition >= prefix!.length &&
      cursorPosition < lastEditablePosition! &&
      formattedEnteredStringLength
    ) {
      cursorPosition = this.getRightEditablePosition(cursorPosition)!;
    }

    newValue = this.formatValue(newValue);

    return {
      value: newValue,
      enteredString,
      selection: { start: cursorPosition, end: cursorPosition }
    };
  };
}
