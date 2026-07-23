// @vitest-environment node
import React from "react";
import { describe, it, expect } from "vitest";
import ReactDOMServer from "react-dom/server";
import InputMask from "../../src/index";

describe("server render", () => {
  it("renders to string with formatted value", () => {
    const html = ReactDOMServer.renderToString(
      <InputMask mask="99/99/9999" value="12345678" onChange={() => {}} />
    );
    expect(typeof html).toBe("string");
    expect(html).toContain("12/34/5678");
  });
});
