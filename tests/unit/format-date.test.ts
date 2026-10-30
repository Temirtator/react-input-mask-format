import { describe, it, expect } from "vitest";
import { formatDate } from "../../src/date/format-date";
import type { DateFormatOptions } from "../../src/date/types";

const mdy: DateFormatOptions = { order: "mdy", separator: "/" };
const ymd: DateFormatOptions = { order: "ymd", separator: "-" };

describe("formatDate", () => {
  it.each<[string | number, DateFormatOptions | undefined, string]>([
    ["", undefined, ""],
    ["1", undefined, "1"],
    ["12", undefined, "12."],
    ["1205", undefined, "12.05."],
    ["12052024", undefined, "12.05.2024"],
    ["120520245", undefined, "12.05.2024"],
    ["45", undefined, "31."],
    ["00", undefined, "01."],
    ["1219", undefined, "12.12."],
    ["1200", undefined, "12.01."],
    ["1.", undefined, "1"],
    ["2024-05-12", undefined, "12.05.2024"],
    ["1.5.2024", undefined, "01.05.2024"],
    ["12.5.2024", undefined, "12.05.2024"],
    ["2024-05", undefined, "20.12.05"],
    ["2024-05-12T10:00:00Z", undefined, "12.05.2024"],
    ["12.05.2024 10:00", undefined, "12.05.2024"],
    ["12/05/2024", undefined, "12.05.2024"],
    ["1.2024.5", undefined, "12.02.45"],
    [12052024, undefined, "12.05.2024"],
    ["05122024", mdy, "05/12/2024"],
    ["5/12/2024", mdy, "05/12/2024"],
    ["2024-05-12", mdy, "05/12/2024"],
    ["13", mdy, "12/"],
    ["2024", ymd, "2024-"],
    ["202405", ymd, "2024-05-"],
    ["2024-05-12", ymd, "2024-05-12"],
    ["2024.05.1", ymd, "2024-05-1"],
    ["12.05.2024", ymd, "2024-05-12"],
    ["20241399", ymd, "2024-12-31"],
    ["12052024", { separator: " / " }, "12 / 05 / 2024"],
  ])("%j with %j → %j", (input, options, expected) => {
    expect(formatDate(input, options)).toBe(expected);
  });
});
