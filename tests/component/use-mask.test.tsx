import React, { useEffect, useRef } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MaskUtils from "../../src/utils/mask";
import { createMaskController } from "../../src/bind-mask";

// Minimal harness: bind a controller to a raw input (the hook comes in Task 3)
function Harness({ mask, onChange }: { mask: string; onChange?: (v: string) => void }) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const controller = createMaskController(new MaskUtils({ mask, maskPlaceholder: "_" }), {
      alwaysShowMask: false
    });
    controller.bind(ref.current!);
    return () => controller.unbind();
  }, [mask]);
  return <input ref={ref} data-testid="in" onChange={e => onChange?.((e.target as HTMLInputElement).value)} />;
}

describe("bind-mask value masking", () => {
  it("masks typed characters on a raw input", async () => {
    const user = userEvent.setup();
    render(<Harness mask="99/99/9999" />);
    const input = screen.getByTestId("in");
    await user.click(input);
    await user.keyboard("12345678");
    expect(input).toHaveValue("12/34/5678");
  });

  it("fires the consumer's onChange with the MASKED value (native-setter bubbles into React)", async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    render(<Harness mask="99/99/9999" onChange={v => seen.push(v)} />);
    const input = screen.getByTestId("in");
    await user.click(input);
    await user.keyboard("12");
    expect(input).toHaveValue("12/__/____");
    expect(seen[seen.length - 1]).toBe("12/__/____");
  });
});

describe("bind-mask focus/blur", () => {
  it("shows the placeholder mask on focus", async () => {
    const user = userEvent.setup();
    render(<Harness mask="99/99" />);
    const input = screen.getByTestId("in");
    await user.click(input);
    expect(input).toHaveValue("__/__");
  });

  it("clears an empty value on blur (alwaysShowMask=false)", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Harness mask="99/99" />
        <button type="button">other</button>
      </>
    );
    const input = screen.getByTestId("in");
    await user.click(input);
    expect(input).toHaveValue("__/__");
    await user.click(screen.getByRole("button"));
    expect(input).toHaveValue("");
  });
});
