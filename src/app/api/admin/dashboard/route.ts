import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const [bookingsToday, bookingsWeek, revenueTodayAgg, upcomingEvents, contactUnread, activeCourts] = await Promise.all([
    prisma.booking.count({ where: { bookingDate: { gte: todayStart, lte: todayEnd } } }),
    prisma.booking.count({ where: { bookingDate: { gte: weekStart, lte: weekEnd } } }),
    prisma.booking.aggregate({
      where: {
        bookingDate: { gte: todayStart, lte: todayEnd },
        paymentStatus: { in: ["paid", "partial"] }
      },
      _sum: { totalPrice: true }
    }),
    prisma.event.count({ where: { status: "upcoming", eventDate: { gte: todayStart } } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.court.count({ where: { status: "active" } })
  ]);

  return NextResponse.json({
    total_bookings_today: bookingsToday,
    total_bookings_week: bookingsWeek,
    revenue_today: Number(revenueTodayAgg._sum.totalPrice || 0),
    upcoming_events_count: upcomingEvents,
    contact_inquiries_count: contactUnread,
    active_courts_count: activeCourts
  });
}
