import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputMask, { useMask } from "../../src/index";

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

function Component({ defaultValue }: { defaultValue?: string }) {
  return (
    <form data-testid="form">
      <InputMask mask="99/99/9999" defaultValue={defaultValue} data-testid="field" />
    </form>
  );
}

function Hook({ defaultValue }: { defaultValue?: string }) {
  const ref = useMask({ mask: "99/99/9999" });
  return (
    <form data-testid="form">
      <input ref={ref} defaultValue={defaultValue} data-testid="field" />
    </form>
  );
}

describe.each([
  ["InputMask", Component],
  ["useMask", Hook]
] as const)("%s", (_name, Field) => {
  it("form reset brings back the formatted default value", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="12122020" />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(input.value).toBe("12/12/2020");
    await user.click(input);
    input.setSelectionRange(10, 10);
    await user.keyboard("{Backspace}{Backspace}");
    expect(input.value).toBe("12/12/20__");
    await user.tab();
    form.reset();
    await nextFrame();
    expect(input.value).toBe("12/12/2020");
    await user.click(input);
    await nextFrame();
    expect(input.selectionStart).toBe(10);
    await user.keyboard("{Backspace}");
    expect(input.value).toBe("12/12/202_");
  });

  it("puts the caret at the end of a full value written without an event", async () => {
    const user = userEvent.setup();
    render(<Field />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    input.value = "12345678";
    await user.click(input);
    await nextFrame();
    expect(input.value).toBe("12/34/5678");
    expect([input.selectionStart, input.selectionEnd]).toEqual([10, 10]);
    await user.keyboard("{Backspace}");
    expect(input.value).toBe("12/34/567_");
  });
});

describe.each([
  ["InputMask", Component],
  ["useMask", Hook]
] as const)("%s after a write without an event", (_name, Field) => {
  it("keeps a value restored by form reset through focus and blur", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="12122020" />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    const form = screen.getByTestId("form") as HTMLFormElement;
    await user.click(input);
    input.setSelectionRange(0, input.value.length);
    await nextFrame();
    await user.keyboard("{Backspace}");
    await user.tab();
    form.reset();
    await nextFrame();
    expect(input.value).toBe("12/12/2020");
    await user.click(input);
    await nextFrame();
    await user.tab();
    expect(input.value).toBe("12/12/2020");
  });

  it("edits a value restored by form reset in place", async () => {
    const user = userEvent.setup();
    render(<Field defaultValue="12122020" />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    const form = screen.getByTestId("form") as HTMLFormElement;
    await user.click(input);
    input.setSelectionRange(10, 10);
    await nextFrame();
    await user.keyboard("{Backspace}{Backspace}");
    await user.tab();
    form.reset();
    await nextFrame();
    await user.click(input);
    await nextFrame();
    input.setSelectionRange(3, 5);
    await nextFrame();
    await user.keyboard("0");
    expect(input.value).toBe("12/0_/2020");
  });

  it("keeps a formatted value a form library wrote into an empty field", async () => {
    const user = userEvent.setup();
    render(<Field />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    input.value = "01/02/2003";
    await user.click(input);
    await nextFrame();
    await user.tab();
    expect(input.value).toBe("01/02/2003");
  });
});

describe("form reset details", () => {
  it("InputMask keeps the defaultValue of a custom child", () => {
    render(
      <InputMask mask="99/99/9999">
        <input defaultValue="12122020" data-testid="child" />
      </InputMask>
    );
    expect(screen.getByTestId("child")).toHaveValue("12/12/2020");
  });

  it.each([
    ["InputMask", () => <form data-testid="form"><InputMask mask="99/99" alwaysShowMask data-testid="field" /></form>],
    ["useMask", () => {
      function F() {
        const ref = useMask({ mask: "99/99", alwaysShowMask: true });
        return <form data-testid="form"><input ref={ref} data-testid="field" /></form>;
      }
      return <F />;
    }]
  ])("%s shows the template after a reset with alwaysShowMask", async (_name, make) => {
    const user = userEvent.setup();
    render(make());
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    await nextFrame();
    await user.keyboard("12");
    await user.tab();
    (screen.getByTestId("form") as HTMLFormElement).reset();
    await nextFrame();
    expect(input.value).toBe("__/__");
  });

  it("useMask follows the form attribute", async () => {
    const user = userEvent.setup();
    function F({ form }: { form: string }) {
      const ref = useMask({ mask: "99/99/9999" });
      return (
        <>
          <form id="fa" data-testid="fa" />
          <form id="fb" data-testid="fb" />
          <input ref={ref} form={form} defaultValue="12122020" data-testid="field" />
        </>
      );
    }
    const { rerender } = render(<F form="fa" />);
    rerender(<F form="fb" />);
    const input = screen.getByTestId("field") as HTMLInputElement;
    await user.click(input);
    input.setSelectionRange(10, 10);
    await nextFrame();
    await user.keyboard("{Backspace}");
    (screen.getByTestId("fb") as HTMLFormElement).reset();
    await nextFrame();
    expect(input.value).toBe("12/12/2020");
  });

  it("useMask binds a remounted input with the current options", () => {
    function F({ mask }: { mask: string }) {
      const ref = useMask({ mask });
      return <input key={mask} ref={ref} defaultValue="123456" data-testid="field" />;
    }
    const { rerender } = render(<F mask="99/99" />);
    rerender(<F mask="999-999" />);
    expect(screen.getByTestId("field")).toHaveValue("123-456");
  });
});

