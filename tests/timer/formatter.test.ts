import { describe, it, expect } from "vitest";
import { formatMs, formatDelta } from "@/lib/timer/formatter";

describe("formatMs", () => {
  it("formats zero correctly", () => {
    expect(formatMs(0)).toBe("00:00:00.00");
  });

  it("formats centiseconds correctly", () => {
    expect(formatMs(10)).toBe("00:00:00.01");
    expect(formatMs(990)).toBe("00:00:00.99");
  });

  it("formats seconds correctly", () => {
    expect(formatMs(1_000)).toBe("00:00:01.00");
    expect(formatMs(9_990)).toBe("00:00:09.99");
  });

  it("formats minutes correctly", () => {
    expect(formatMs(60_000)).toBe("00:01:00.00");
    expect(formatMs(90_000)).toBe("00:01:30.00");
  });

  it("formats hours correctly", () => {
    expect(formatMs(3_600_000)).toBe("01:00:00.00");
    expect(formatMs(3_661_230)).toBe("01:01:01.23");
  });

  it("pads all fields to two digits", () => {
    // 1h 1m 1s 1cs
    expect(formatMs(3_661_010)).toBe("01:01:01.01");
  });

  it("handles values larger than 99 hours without truncating", () => {
    // 100 hours
    expect(formatMs(360_000_000)).toBe("100:00:00.00");
  });
});

describe("formatDelta", () => {
  it("returns em dash for null", () => {
    expect(formatDelta(null)).toBe("—");
  });

  it("returns em dash for undefined", () => {
    expect(formatDelta(undefined)).toBe("—");
  });

  it("formats negative delta as ahead (minus sign)", () => {
    expect(formatDelta(-1_000)).toBe("-00:00:01.00");
    expect(formatDelta(-61_230)).toBe("-00:01:01.23");
  });

  it("formats positive delta as behind (plus sign)", () => {
    expect(formatDelta(1_000)).toBe("+00:00:01.00");
    expect(formatDelta(61_000)).toBe("+00:01:01.00");
  });

  it("formats zero delta with plus sign", () => {
    expect(formatDelta(0)).toBe("+00:00:00.00");
  });
});
