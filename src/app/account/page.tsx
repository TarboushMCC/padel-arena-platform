import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AccountOverviewPage() {
  const session = await getServerSession(authOptions);
  const bookings = await prisma.booking.findMany({
    where: { userId: session!.user.id },
    include: { court: true },
    orderBy: [{ bookingDate: "asc" }, { startTime: "asc" }],
    take: 5
  });

  return (
    <>
      <article className="card">
        <h2>Account Overview</h2>
        <p>
          <strong>Name:</strong> {session?.user.name}
        </p>
        <p>
          <strong>Email:</strong> {session?.user.email}
        </p>
        <p>
          <strong>Phone:</strong> {session?.user.phone}
        </p>
      </article>

      <article className="card">
        <h2>Upcoming Bookings</h2>
        {bookings.length ? (
          <div className="grid" style={{ gap: "0.65rem" }}>
            {bookings.map((booking) => (
              <div key={booking.id} className="card">
                <strong>{booking.bookingReference}</strong>
                <p>
                  {booking.court.name} - {booking.bookingDate.toISOString().split("T")[0]} {booking.startTime} - {booking.endTime}
                </p>
                <p>Status: {booking.status}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No upcoming bookings yet.</p>
        )}
      </article>
    </>
  );
}
