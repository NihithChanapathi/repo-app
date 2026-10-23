import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDate, formatPrice, timeAgo } from "./format";

describe("formatPrice", () => {
  it.each([
    [0, "Free"],
    [1000, "$10"],
    [1250, "$12.50"],
    [99, "$0.99"],
    [5, "$0.05"],
    [100000, "$1000"],
  ])("formats %i cents as %s", (cents, expected) => {
    expect(formatPrice(cents)).toBe(expected);
  });
});

describe("timeAgo", () => {
  const NOW = new Date("2026-10-23T12:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const ago = (seconds: number) => new Date(NOW.getTime() - seconds * 1000).toISOString();

  it.each([
    [0, "just now"],
    [59, "just now"],
    [60, "1m ago"],
    [59 * 60, "59m ago"],
    [60 * 60, "1h ago"],
    [23 * 3600, "23h ago"],
    [24 * 3600, "1d ago"],
    [29 * 86400, "29d ago"],
  ])("%i seconds ago reads %s", (seconds, expected) => {
    expect(timeAgo(ago(seconds))).toBe(expected);
  });

  it("switches to a calendar date after 30 days", () => {
    expect(timeAgo("2026-09-08T12:00:00Z")).toBe("9/8/2026");
  });
});

describe("formatDate", () => {
  it("formats a date-only string without shifting the day", () => {
    expect(formatDate("2026-10-05")).toBe("Oct 5, 2026");
  });

  it("returns an empty string for null", () => {
    expect(formatDate(null)).toBe("");
  });
});
