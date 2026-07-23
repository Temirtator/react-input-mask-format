import { describe, it, expect } from "vitest";
import MaskUtils from "../../src/utils/mask";

const date = () => new MaskUtils({ mask: "99/99/9999", maskPlaceholder: "_" });

describe("MaskUtils.formatValue", () => {
  it("formats partial value with placeholder", () => {
    expect(date().formatValue("12")).toBe("12/__/____");
  });

  it("formats full value inserting permanents", () => {
    expect(date().formatValue("12345678")).toBe("12/34/5678");
  });

  it("formats with null placeholder up to next editable position", () => {
    const utils = new MaskUtils({ mask: "99/99", maskPlaceholder: null });
    expect(utils.formatValue("12")).toBe("12/");
  });
});

describe("MaskUtils value state checks", () => {
  it("isValueEmpty / isValueFilled", () => {
    const utils = date();
    expect(utils.isValueEmpty("__/__/____")).toBe(true);
    expect(utils.isValueEmpty("1_/__/____")).toBe(false);
    expect(utils.isValueFilled("12/34/5678")).toBe(true);
    expect(utils.isValueFilled("12/34/567_")).toBe(false);
  });

  it("getDefaultSelectionForValue points to first empty editable position", () => {
    expect(date().getDefaultSelectionForValue("12/__/____")).toEqual({ start: 3, end: 3 });
  });
});

describe("MaskUtils.processChange", () => {
  const empty = { value: "__/__/____", selection: { start: 0, end: 0, length: 0 } };

  it("handles typing a character", () => {
    const result = date().processChange(
      { value: "1__/__/____", selection: { start: 1, end: 1 } },
      empty
    );
    expect(result.value).toBe("1_/__/____");
    expect(result.selection).toEqual({ start: 1, end: 1 });
    expect(result.enteredString).toBe("1");
  });

  it("skips permanent character on typing past it", () => {
    const result = date().processChange(
      { value: "123/__/____", selection: { start: 3, end: 3 } },
      { value: "12/__/____", selection: { start: 2, end: 2, length: 0 } }
    );
    expect(result.value).toBe("12/3_/____");
    expect(result.selection).toEqual({ start: 4, end: 4 });
  });

  it("handles backspace (single char delete)", () => {
    const result = date().processChange(
      { value: "1/__/____", selection: { start: 1, end: 1 } },
      { value: "12/__/____", selection: { start: 2, end: 2, length: 0 } }
    );
    expect(result.value).toBe("1_/__/____");
    expect(result.selection).toEqual({ start: 1, end: 1 });
  });

  it("handles paste of full string", () => {
    const result = date().processChange(
      { value: "12345678__/__/____", selection: { start: 8, end: 8 } },
      empty
    );
    expect(result.value).toBe("12/34/5678");
  });
});
