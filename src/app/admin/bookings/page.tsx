import { prisma } from "@/lib/prisma";
import { BookingsManager } from "@/components/admin/BookingsManager";

export default async function AdminBookingsPage() {
  const pageSize = 20;

  const [total, bookings, courts] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.findMany({
      include: { court: true, user: true },
      orderBy: [{ bookingDate: "desc" }, { startTime: "desc" }],
      take: pageSize
    }),
    prisma.court.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <BookingsManager
      initialBookings={bookings.map((item) => ({
        id: item.id,
        bookingReference: item.bookingReference,
        bookingDate: item.bookingDate.toISOString().slice(0, 10),
        startTime: item.startTime,
        endTime: item.endTime,
        durationMinutes: item.durationMinutes,
        status: item.status,
        paymentStatus: item.paymentStatus,
        notes: item.notes,
        totalPrice: Number(item.totalPrice),
        courtId: item.court.id,
        courtName: item.court.name,
        customerName: item.user?.fullName || item.guestName || "Guest",
        customerEmail: item.user?.email || item.guestEmail || "-"
      }))}
      courts={courts.map((court) => ({ id: court.id, name: court.name }))}
      initialPagination={{
        page: 1,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }}
    />
  );
}
