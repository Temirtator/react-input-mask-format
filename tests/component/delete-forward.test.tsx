import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { useMask } from "../../src/index";

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

type Props = { maskPlaceholder?: string | null };

function Component(props: Props) {
  return <InputMask mask="99/99/9999" defaultValue="12345678" {...props} data-testid="field" />;
}

function Hook(props: Props) {
  const ref = useMask({ mask: "99/99/9999", ...props });
  return <input ref={ref} defaultValue="12345678" data-testid="field" />;
}

const shown = (input: HTMLInputElement) =>
  `${input.value.slice(0, input.selectionStart!)}|${input.value.slice(input.selectionStart!)}`;

describe.each([
  ["InputMask", Component],
  ["useMask", Hook]
] as const)("Delete: %s", (_name, Field) => {
  async function deleteFrom(props: Props, caret: number, times: number) {
    const user = userEvent.setup();
    render(<Field {...props} />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await nextFrame();
    input.setSelectionRange(caret, caret);
    await nextFrame();
    const steps: string[] = [];
    for (let i = 0; i < times; i++) {
      await user.keyboard("{Delete}");
      steps.push(shown(input));
    }
    return steps;
  }

  it("walks forward through a full value", async () => {
    expect(await deleteFrom({}, 0, 3)).toEqual(["_|2/34/5678", "__|/34/5678", "__/_|4/5678"]);
  });

  it("walks forward from the middle", async () => {
    expect(await deleteFrom({}, 3, 2)).toEqual(["12/_|4/5678", "12/__|/5678"]);
  });

  it("shifts characters left without a placeholder", async () => {
    expect(await deleteFrom({ maskPlaceholder: null }, 0, 2)).toEqual(["|23/45/678", "|34/56/78"]);
  });
});
