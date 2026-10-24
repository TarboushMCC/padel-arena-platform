import { NextResponse } from "next/server";
import { getPublicSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await getPublicSettings();
  const openingHours = await prisma.operatingHours.findMany({ orderBy: { dayOfWeek: "asc" } });

  return NextResponse.json({
    ...settings,
    opening_hours: openingHours
  });
}
