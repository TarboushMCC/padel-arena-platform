import { NextRequest, NextResponse } from "next/server";
import { canCancel, getAvailability } from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { rescheduleSchema } from "@/lib/validation";

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth.error || !auth.session) {
    return auth.error;
  }

  const booking = await prisma.booking.findUnique({ where: { id: context.params.id } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (auth.session.user.role !== "admin" && booking.userId !== auth.session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (auth.session.user.role !== "admin") {
    const allowed = await canCancel(booking.bookingDate, booking.startTime);
    if (!allowed) {
      return NextResponse.json({ error: "Reschedule window exceeded" }, { status: 400 });
    }
  }

  const body = await request.json();
  const parsed = rescheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const availability = await getAvailability({
    date: parsed.data.new_date,
    durationMinutes: parsed.data.new_duration,
    startTime: parsed.data.new_start_time
  });

  const slot = availability.slots.find((item) => item.courtId === booking.courtId);
  if (!slot) {
    return NextResponse.json({ error: "Requested slot unavailable" }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      bookingDate: new Date(parsed.data.new_date),
      startTime: parsed.data.new_start_time,
      endTime: slot.endTime,
      durationMinutes: parsed.data.new_duration
    }
  });

  return NextResponse.json({ booking: updated });
}
