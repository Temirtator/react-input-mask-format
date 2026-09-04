// @vitest-environment node
import React from "react";
import { describe, it, expect } from "vitest";
import ReactDOMServer from "react-dom/server";
import InputMask from "../../src/index";
import { TimeFormat } from "../../src/time/time-format";

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
