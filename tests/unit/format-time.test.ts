import { describe, it, expect } from "vitest";
import { formatTime } from "../../src/time/format-time";

describe("formatTime", () => {
  it("returns empty for empty input", () => {
    expect(formatTime("")).toBe("");
  });
  it("shows a lone first digit unclamped", () => {
    expect(formatTime("9")).toBe("9");
  });
  it("appends the separator once hours are complete", () => {
    expect(formatTime("22")).toBe("22:");
  });
  it("clamps a completed hours pair to 23", () => {
    expect(formatTime("29")).toBe("23:");
    expect(formatTime("99")).toBe("23:");
  });
  it("keeps a partial minute digit unclamped", () => {
    expect(formatTime("223")).toBe("22:3");
  });
  it("clamps a completed minutes pair to 59", () => {
    expect(formatTime("2299")).toBe("22:59");
  });
  it("drops digits past four", () => {
    expect(formatTime("223045")).toBe("22:30");
  });
  it("strips non-digits from the raw input", () => {
    expect(formatTime("22:30")).toBe("22:30");
  });
  it("normalizes a numeric input left-anchored, not as HH:MM", () => {
    expect(formatTime(930)).toBe("23:0");
  });
  it("honors a custom separator", () => {
    expect(formatTime("2230", { separator: "." })).toBe("22.30");
  });
});
