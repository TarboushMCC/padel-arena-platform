import { describe, expect, test } from "vitest";
import { makeBookingReference } from "@/lib/refs";

describe("booking reference", () => {
  test("returns prefixed reference", () => {
    const ref = makeBookingReference(new Date("2026-03-12"));
    expect(ref.startsWith("PA-")).toBe(true);
    expect(ref.length).toBeGreaterThan(10);
  });
});
