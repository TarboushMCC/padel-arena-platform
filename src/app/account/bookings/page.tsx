import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BookingsManager } from "@/components/account/BookingsManager";

export default async function AccountBookingsPage() {
  const session = await getServerSession(authOptions);

  const bookings = await prisma.booking.findMany({
    where: { userId: session!.user.id },
    include: { court: true },
    orderBy: [{ bookingDate: "desc" }, { startTime: "desc" }]
  });

  const payload = bookings.map((booking) => ({
    id: booking.id,
    bookingReference: booking.bookingReference,
    courtName: booking.court.name,
    bookingDate: booking.bookingDate.toISOString().split("T")[0],
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status
  }));

  return <BookingsManager bookings={payload} />;
}
