import { prisma } from "@/lib/prisma";
import { PricingManager } from "@/components/admin/PricingManager";

export default async function AdminPricingPage() {
  const [rules, courts] = await Promise.all([
    prisma.pricingRule.findMany({
      include: { appliesToCourt: true },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }]
    }),
    prisma.court.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <PricingManager
      initialRules={rules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        appliesToCourtId: rule.appliesToCourtId,
        appliesToCourt: rule.appliesToCourt
          ? { id: rule.appliesToCourt.id, name: rule.appliesToCourt.name }
          : null,
        dayType: rule.dayType,
        startTime: rule.startTime,
        endTime: rule.endTime,
        durationMinutes: rule.durationMinutes,
        basePrice: Number(rule.basePrice),
        currency: rule.currency,
        isActive: rule.isActive,
        priority: rule.priority
      }))}
      courts={courts.map((court) => ({ id: court.id, name: court.name }))}
    />
  );
}
