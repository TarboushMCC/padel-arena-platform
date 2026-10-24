import { describe, expect, test } from "vitest";
import { choosePricingRule } from "@/lib/pricing";

describe("pricing rule selection", () => {
  test("picks highest priority, then court-specific", () => {
    const bookingDate = new Date("2026-03-14");

    const rules = [
      {
        id: "1",
        name: "global",
        appliesToCourtId: null,
        dayType: "any",
        startTime: null,
        endTime: null,
        durationMinutes: 90,
        basePrice: 200,
        currency: "AED",
        isActive: true,
        priority: 10,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01")
      },
      {
        id: "2",
        name: "court specific",
        appliesToCourtId: "court-a",
        dayType: "any",
        startTime: null,
        endTime: null,
        durationMinutes: 90,
        basePrice: 250,
        currency: "AED",
        isActive: true,
        priority: 10,
        createdAt: new Date("2026-02-01"),
        updatedAt: new Date("2026-02-01")
      }
    ] as any;

    const result = choosePricingRule(rules, {
      courtId: "court-a",
      bookingDate,
      startTime: "18:00",
      durationMinutes: 90
    });

    expect(result?.id).toBe("2");
  });
});
