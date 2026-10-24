import { NextRequest, NextResponse } from "next/server";
import { canCancel } from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function POST(_: NextRequest, context: { params: { id: string } }) {
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
      return NextResponse.json({ error: "Cancellation window exceeded" }, { status: 400 });
    }
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "cancelled" }
  });

  return NextResponse.json({ booking: updated });
}
