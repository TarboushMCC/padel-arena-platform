import { DayType, PricingRule } from "@prisma/client";
import { isWeekend, parseTimeToMinutes } from "@/lib/time";

function matchesDayType(rule: PricingRule, bookingDate: Date) {
  const weekend = isWeekend(bookingDate);
  if (rule.dayType === DayType.any) return true;
  if (rule.dayType === DayType.weekend) return weekend;
  return !weekend;
}

function matchesTimeWindow(rule: PricingRule, startTime: string) {
  if (!rule.startTime || !rule.endTime) return true;
  const start = parseTimeToMinutes(startTime);
  const windowStart = parseTimeToMinutes(rule.startTime);
  const windowEnd = parseTimeToMinutes(rule.endTime);
  return start >= windowStart && start < windowEnd;
}

function matchesDuration(rule: PricingRule, durationMinutes: number) {
  if (!rule.durationMinutes) return true;
  return rule.durationMinutes === durationMinutes;
}

function compareRules(a: PricingRule, b: PricingRule): number {
  if (a.priority !== b.priority) {
    return b.priority - a.priority;
  }

  const aCourtSpecific = a.appliesToCourtId ? 1 : 0;
  const bCourtSpecific = b.appliesToCourtId ? 1 : 0;
  if (aCourtSpecific !== bCourtSpecific) {
    return bCourtSpecific - aCourtSpecific;
  }

  return b.updatedAt.getTime() - a.updatedAt.getTime();
}

export function choosePricingRule(
  rules: PricingRule[],
  options: {
    courtId: string;
    bookingDate: Date;
    startTime: string;
    durationMinutes: number;
  }
): PricingRule | null {
  const filtered = rules.filter((rule) => {
    if (!rule.isActive) return false;
    if (rule.appliesToCourtId && rule.appliesToCourtId !== options.courtId) return false;
    if (!matchesDayType(rule, options.bookingDate)) return false;
    if (!matchesTimeWindow(rule, options.startTime)) return false;
    if (!matchesDuration(rule, options.durationMinutes)) return false;
    return true;
  });

  if (!filtered.length) return null;

  filtered.sort(compareRules);
  return filtered[0] ?? null;
}

export function computeBookingPrice(rule: PricingRule | null): { totalPrice: number; currency: string } {
  if (!rule) {
    return { totalPrice: 0, currency: "AED" };
  }

  return {
    totalPrice: Number(rule.basePrice),
    currency: rule.currency
  };
}
