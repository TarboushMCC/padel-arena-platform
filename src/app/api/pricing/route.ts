import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const pricingRules = await prisma.pricingRule.findMany({
    where: { isActive: true },
    include: { appliesToCourt: true },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }]
  });

  return NextResponse.json({ pricing_rules: pricingRules });
}
