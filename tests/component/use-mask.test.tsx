import React, { useEffect, useRef } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MaskUtils from "../../src/utils/mask";
import { createMaskController } from "../../src/bind-mask";
import { useMask } from "../../src/use-mask";
import type { UseMaskOptions } from "../../src/types";

// Minimal harness: bind a controller to a raw input (the hook comes in Task 3)
function Harness({ mask, onChange }: { mask: string; onChange?: (v: string) => void }) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const controller = createMaskController({
      maskUtils: new MaskUtils({ mask, maskPlaceholder: "_" }),
      maskPlaceholder: "_",
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

function HookField(opts: UseMaskOptions) {
  const ref = useMask(opts);
  return <input ref={ref} data-testid="hook" />;
}

describe("useMask hook", () => {
  it("masks a raw input via ref callback", async () => {
    const user = userEvent.setup();
    render(<HookField mask="99/99/9999" />);
    const input = screen.getByTestId("hook");
    await user.click(input);
    await user.keyboard("12345678");
    expect(input).toHaveValue("12/34/5678");
  });

  it("applies transform to typed characters", async () => {
    const user = userEvent.setup();
    render(<HookField mask="aaaa" transform="uppercase" />);
    const input = screen.getByTestId("hook");
    await user.click(input);
    await user.keyboard("abcd");
    expect(input).toHaveValue("ABCD");
  });

  it("accepts RegExp formatChars", async () => {
    const user = userEvent.setup();
    render(<HookField mask="AAA" formatChars={{ A: /[A-Z]/ }} transform="uppercase" />);
    const input = screen.getByTestId("hook");
    await user.click(input);
    await user.keyboard("abc");
    expect(input).toHaveValue("ABC");
  });
});

describe("useMask public export", () => {
  it("is exported from the package entry", async () => {
    const mod = await import("../../src/index");
    expect(typeof mod.useMask).toBe("function");
  });
});

describe("useMask caret on focus", () => {
  it("formats and places the caret on focusin, after Firefox's select-all on keyboard focus", () => {
    render(<HookField mask="+7 (999) 999-99-99" />);
    const input = screen.getByTestId("hook") as HTMLInputElement;
    input.addEventListener("focus", () => input.setSelectionRange(0, input.value.length));
    input.focus();
    expect(input.value).toBe("+7 (___) ___-__-__");
    expect([input.selectionStart, input.selectionEnd]).toEqual([4, 4]);
  });
});
