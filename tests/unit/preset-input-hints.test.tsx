import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import InputMask from "../../src/index";
import * as presets from "../../src/presets";
import type { MaskPreset } from "../../src/presets";

const tokens: Record<string, RegExp> = { "9": /[0-9]/, a: /[A-Za-z]/, "*": /[A-Za-z0-9]/ };
const nonDigits = "abcxyzABCXYZабвАБВ+-_ ";

function slots(preset: MaskPreset): RegExp[] {
  const chars: Record<string, RegExp | string> = { ...tokens, ...preset.formatChars };
  if (typeof preset.mask !== "string") return preset.mask.filter((part): part is RegExp => part instanceof RegExp);
  const found: RegExp[] = [];
  let escaped = false;
  for (const character of preset.mask) {
    if (!escaped && character === "\\") {
      escaped = true;
      continue;
    }
    const token = chars[character];
    if (!escaped && token) found.push(typeof token === "string" ? new RegExp(token) : token);
    escaped = false;
  }
  return found;
}

function acceptsOnlyDigits(preset: MaskPreset): boolean {
  return slots(preset).every(slot => ![...nonDigits].some(character => new RegExp(slot.source).test(character)));
}

const all = Object.entries(presets).filter(
  (entry): entry is [string, MaskPreset] => typeof entry[1] === "object" && entry[1] !== null && "mask" in entry[1]
);

describe("preset input hints", () => {
  it.each(all)("%s sets inputMode for the keypad it needs", (name, preset) => {
    if (name.endsWith("Phone")) {
      expect(preset).toMatchObject({ inputMode: "tel", autoComplete: "tel" });
    } else if (acceptsOnlyDigits(preset)) {
      expect(preset.inputMode).toBe("numeric");
    } else {
      expect(preset.inputMode).toBeUndefined();
    }
  });

  it("postal codes and the card number get autofill hints", () => {
    for (const [name, preset] of all) {
      if (name.endsWith("Postal")) expect(preset.autoComplete).toBe("postal-code");
    }
    expect(presets.card.autoComplete).toBe("cc-number");
  });

  it("reaches the input through InputMask, and explicit props win", () => {
    render(
      <>
        <InputMask {...presets.kzPhone} data-testid="phone" />
        <InputMask {...presets.kzIin} inputMode="text" data-testid="iin" />
      </>
    );
    expect(screen.getByTestId("phone")).toHaveAttribute("inputmode", "tel");
    expect(screen.getByTestId("phone")).toHaveAttribute("autocomplete", "tel");
    expect(screen.getByTestId("iin")).toHaveAttribute("inputmode", "text");
  });
});
