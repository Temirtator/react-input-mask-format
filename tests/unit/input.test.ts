import { describe, it, expect } from "vitest";
import { setInputSelection, getInputSelection } from "../../src/utils/input";

describe("input utils", () => {
  it("set/getInputSelection roundtrip", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.value = "12/34";
    input.focus();
    setInputSelection(input, 1, 3);
    expect(getInputSelection(input)).toEqual({ start: 1, end: 3, length: 2 });
    setInputSelection(input, 2); // end defaults to start
    expect(getInputSelection(input)).toEqual({ start: 2, end: 2, length: 0 });
  });
});
