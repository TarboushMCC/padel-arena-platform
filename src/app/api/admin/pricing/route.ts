import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { sanitizeText } from "@/lib/sanitize";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const rules = await prisma.pricingRule.findMany({
    include: { appliesToCourt: true },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }]
  });

  return NextResponse.json({ pricing_rules: rules });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json();
  const rule = await prisma.pricingRule.create({
    data: {
      name: sanitizeText(body.name),
      appliesToCourtId: body.applies_to_court_id || null,
      dayType: body.day_type || "any",
      startTime: body.start_time || null,
      endTime: body.end_time || null,
      durationMinutes: body.duration_minutes ? Number(body.duration_minutes) : null,
      basePrice: Number(body.base_price),
      currency: sanitizeText(body.currency || "AED"),
      isActive: body.is_active !== false,
      priority: Number(body.priority || 0)
    }
  });

  return NextResponse.json({ pricing_rule: rule });
}
