import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import * as ReactDOM from "react-dom";
import { renderToString } from "react-dom/server";
import { act } from "@testing-library/react";
import InputMask, { useMask } from "../../src/index";
import { kzPhone } from "../../src/presets";
import { NumberFormat } from "../../src/number/number-format";
import { DateFormat } from "../../src/date/date-format";
import { TimeFormat } from "../../src/time/time-format";
import { CardNumberFormat } from "../../src/card/card-number-format";
import { CardExpiryFormat } from "../../src/card/card-expiry-format";
import { CardCvcFormat } from "../../src/card/card-cvc-format";

type LegacyDom = { hydrate(element: React.ReactElement, container: Element): void };

async function hydrate(element: React.ReactElement): Promise<{ values: string[]; errors: unknown[][] }> {
  const container = document.createElement("div");
  container.innerHTML = renderToString(element);
  document.body.appendChild(container);
  const serverValues = Array.from(container.querySelectorAll("input"), input => input.value);
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    if (React.version.startsWith("17")) {
      await act(async () => {
        (ReactDOM as unknown as LegacyDom).hydrate(element, container);
      });
    } else {
      const client = "react-dom/client";
      const { hydrateRoot } = (await import(client)) as typeof import("react-dom/client");
      await act(async () => {
        hydrateRoot(container, element);
      });
    }
    const values = Array.from(container.querySelectorAll("input"), input => input.value);
    expect(values).toEqual(serverValues);
    return { values, errors: spy.mock.calls };
  } finally {
    spy.mockRestore();
    container.remove();
  }
}

function MaskHook() {
  const ref = useMask({ mask: "99/99/9999" });
  return <input ref={ref} defaultValue="12/34/5678" />;
}

describe("hydration", () => {
  it.each<[string, React.ReactElement, string]>([
    ["controlled InputMask", <InputMask mask="99/99/9999" value="12345678" onChange={() => {}} />, "12/34/5678"],
    ["uncontrolled InputMask", <InputMask mask="99/99" defaultValue="1234" />, "12/34"],
    ["InputMask with alwaysShowMask", <InputMask {...kzPhone} alwaysShowMask />, "+7 (7__) ___-__-__"],
    ["useMask", <MaskHook />, "12/34/5678"],
    ["NumberFormat", <NumberFormat value="1234.5" thousandSeparator="," />, "1,234.5"],
    ["DateFormat", <DateFormat value="2024-05-12" onValueChange={() => {}} />, "12.05.2024"],
    ["TimeFormat", <TimeFormat defaultValue="09:05" />, "09:05"],
    ["CardNumberFormat", <CardNumberFormat value="4111111111111111" onValueChange={() => {}} />, "4111 1111 1111 1111"],
    ["CardExpiryFormat", <CardExpiryFormat defaultValue="12/26" />, "12/26"],
    ["CardCvcFormat", <CardCvcFormat value="123" onValueChange={() => {}} />, "123"]
  ])("%s hydrates without errors", async (_name, element, expected) => {
    const { values, errors } = await hydrate(element);
    expect(values).toEqual([expected]);
    expect(errors).toEqual([]);
  });
});
