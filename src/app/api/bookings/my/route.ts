import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error || !auth.session) {
    return auth.error;
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: auth.session.user.id },
    include: { court: true },
    orderBy: [{ bookingDate: "desc" }, { startTime: "desc" }]
  });

  return NextResponse.json({ bookings });
}
