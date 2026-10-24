import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { addMinutesToTime } from "@/lib/time";

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json();
  const duration = Number(body.new_duration || 60);
  const startTime = body.new_start_time;

  const booking = await prisma.booking.update({
    where: { id: context.params.id },
    data: {
      bookingDate: new Date(body.new_date),
      startTime,
      endTime: addMinutesToTime(startTime, duration),
      durationMinutes: duration
    }
  });

  return NextResponse.json({ booking });
}
