// @vitest-environment node
import React from "react";
import { describe, it, expect } from "vitest";
import ReactDOMServer from "react-dom/server";
import InputMask from "../../src/index";
import { TimeFormat } from "../../src/time/time-format";
import { DateFormat } from "../../src/date/date-format";
import { CardNumberFormat } from "../../src/card/card-number-format";
import { CardExpiryFormat } from "../../src/card/card-expiry-format";

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
});
