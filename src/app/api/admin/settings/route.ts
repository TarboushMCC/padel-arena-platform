import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

const ALLOWED_KEYS = new Set([
  "arena_name",
  "address",
  "phone",
  "email",
  "whatsapp_url",
  "cancellation_hours_limit",
  "booking_hold_minutes",
  "payment_mode",
  "opening_notice",
  "guest_checkout_enabled",
  "slot_interval_minutes",
  "allowed_durations",
  "home_content",
  "about_content",
  "social_links",
  "map_embed_url",
  "timezone",
  "currency"
]);

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const settings = await prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json();
  const updates = Array.isArray(body?.settings) ? body.settings : [];

  for (const item of updates) {
    if (!item?.key || !ALLOWED_KEYS.has(item.key)) continue;
    await prisma.siteSetting.upsert({
      where: { key: item.key },
      update: { value: item.value },
      create: { key: item.key, value: item.value }
    });
  }

  const settings = await prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ settings });
}
