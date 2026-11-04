import { describe, it, expect, vi, afterEach } from "vitest";
import { watchClick } from "../../src/core/click-tracker";

function setup(value: string) {
  const input = document.createElement("input");
  input.value = value;
  document.body.appendChild(input);
  return input;
}

function mouseUp(x: number, y: number) {
  document.dispatchEvent(new MouseEvent("mouseup", { clientX: x, clientY: y }));
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("watchClick", () => {
  it("calls back on a quick click that leaves a caret", () => {
    const input = setup("+7 (777) ___-__-__");
    const onQuickClick = vi.fn();
    watchClick(input, { clientX: 10, clientY: 10 }, onQuickClick);
    input.focus();
    input.setSelectionRange(3, 3);
    mouseUp(12, 10);
    expect(onQuickClick).toHaveBeenCalledTimes(1);
  });

  it("ignores a mouseup when the input did not get focus", () => {
    const input = setup("+7 (777) ___-__-__");
    const onQuickClick = vi.fn();
    watchClick(input, { clientX: 10, clientY: 10 }, onQuickClick);
    mouseUp(10, 10);
    expect(onQuickClick).not.toHaveBeenCalled();
  });

  it("ignores a drag", () => {
    const input = setup("+7 (777) ___-__-__");
    const onQuickClick = vi.fn();
    watchClick(input, { clientX: 10, clientY: 10 }, onQuickClick);
    input.focus();
    input.setSelectionRange(3, 3);
    mouseUp(40, 10);
    expect(onQuickClick).not.toHaveBeenCalled();
  });
});
