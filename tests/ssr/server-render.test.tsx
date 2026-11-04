// @vitest-environment node
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ReactDOMServer from "react-dom/server";
import InputMask, { useMask } from "../../src/index";
import { NumberFormat } from "../../src/number/number-format";
import { TimeFormat } from "../../src/time/time-format";
import { DateFormat } from "../../src/date/date-format";
import { CardNumberFormat } from "../../src/card/card-number-format";
import { CardExpiryFormat } from "../../src/card/card-expiry-format";
import { CardCvcFormat } from "../../src/card/card-cvc-format";

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  const calls = consoleError.mock.calls;
  consoleError.mockRestore();
  expect(calls).toEqual([]);
});

function MaskHook() {
  const ref = useMask({ mask: "99/99/9999" });
  return <input ref={ref} defaultValue="12345678" />;
}

describe("server render", () => {
  it("renders to string with formatted value", () => {
    const html = ReactDOMServer.renderToString(
      <InputMask mask="99/99/9999" value="12345678" onChange={() => {}} />
    );
    expect(typeof html).toBe("string");
    expect(html).toContain("12/34/5678");
  });
});

describe("server render — time", () => {
  it("renders TimeFormat to a string with the formatted value", () => {
    const html = ReactDOMServer.renderToString(
      <TimeFormat value="09:05" onValueChange={() => {}} />
    );
    expect(typeof html).toBe("string");
    expect(html).toContain("09:05");
  });
});

describe("server render — date", () => {
  it("renders DateFormat with an ISO value in the configured order", () => {
    const html = ReactDOMServer.renderToString(
      <DateFormat value="2024-05-12" onValueChange={() => {}} />
    );
    expect(html).toContain("12.05.2024");
  });
});

describe("server render — card", () => {
  it("renders CardNumberFormat with the digits grouped", () => {
    const html = ReactDOMServer.renderToString(
      <CardNumberFormat value="4111111111111111" onValueChange={() => {}} />
    );
    expect(html).toContain("4111 1111 1111 1111");
    expect(html).toContain('autoComplete="cc-number"');
  });

  it("renders CardExpiryFormat with the stored value", () => {
    const html = ReactDOMServer.renderToString(
      <CardExpiryFormat value="12/26" onValueChange={() => {}} />
    );
    expect(html).toContain("12/26");
  });

  it("renders CardCvcFormat cut to the brand's length", () => {
    const html = ReactDOMServer.renderToString(
      <CardCvcFormat value="1234" brand="visa" onValueChange={() => {}} />
    );
    expect(html).toContain('value="123"');
  });
});

describe("server render — number and hook", () => {
  it("renders NumberFormat with the formatted value", () => {
    const html = ReactDOMServer.renderToString(<NumberFormat value="1234.5" thousandSeparator="," />);
    expect(html).toContain("1,234.5");
  });

  it("renders an input bound with useMask", () => {
    const html = ReactDOMServer.renderToString(<MaskHook />);
    expect(html).toContain("12345678");
  });
});
