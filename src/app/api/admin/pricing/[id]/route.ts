import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { sanitizeText } from "@/lib/sanitize";

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json();
  const rule = await prisma.pricingRule.update({
    where: { id: context.params.id },
    data: {
      name: sanitizeText(body.name),
      appliesToCourtId: body.applies_to_court_id || null,
      dayType: body.day_type,
      startTime: body.start_time || null,
      endTime: body.end_time || null,
      durationMinutes: body.duration_minutes ? Number(body.duration_minutes) : null,
      basePrice: Number(body.base_price),
      currency: sanitizeText(body.currency || "AED"),
      isActive: body.is_active,
      priority: Number(body.priority || 0)
    }
  });

  return NextResponse.json({ pricing_rule: rule });
}

export async function DELETE(_: NextRequest, context: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  await prisma.pricingRule.delete({ where: { id: context.params.id } });
  return NextResponse.json({ success: true });
}
