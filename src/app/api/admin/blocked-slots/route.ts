import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { sanitizeText } from "@/lib/sanitize";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const items = await prisma.blockedSlot.findMany({
    include: { court: true },
    orderBy: [{ bookingDate: "desc" }, { startTime: "asc" }]
  });

  return NextResponse.json({ blocked_slots: items });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error || !auth.session) {
    return auth.error;
  }

  const body = await request.json();
  const item = await prisma.blockedSlot.create({
    data: {
      courtId: body.court_id,
      bookingDate: new Date(body.booking_date),
      startTime: body.start_time,
      endTime: body.end_time,
      reason: sanitizeText(body.reason),
      createdByAdminId: auth.session.user.id
    }
  });

  return NextResponse.json({ blocked_slot: item });
}
