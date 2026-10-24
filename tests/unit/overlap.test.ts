import { describe, expect, test } from "vitest";
import { rangesOverlap } from "@/lib/time";

describe("slot overlap", () => {
  test("detects overlapping ranges", () => {
    expect(rangesOverlap("18:00", "19:30", "19:00", "20:00")).toBe(true);
  });

  test("detects non-overlapping ranges", () => {
    expect(rangesOverlap("18:00", "19:00", "19:00", "20:00")).toBe(false);
  });
});
