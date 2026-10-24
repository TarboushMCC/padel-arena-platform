import { prisma } from "@/lib/prisma";

export default async function AdminOverviewPage() {
  const [bookingsToday, bookingsWeek, upcomingEvents, unreadMessages, activeCourts, revenueToday] = await Promise.all([
    prisma.booking.count({
      where: {
        bookingDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    }),
    prisma.booking.count({
      where: {
        bookingDate: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7))
        }
      }
    }),
    prisma.event.count({ where: { status: "upcoming", eventDate: { gte: new Date() } } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.court.count({ where: { status: "active" } }),
    prisma.booking.aggregate({
      where: {
        bookingDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999))
        },
        paymentStatus: { in: ["paid", "partial"] }
      },
      _sum: { totalPrice: true }
    })
  ]);

  const cards = [
    { label: "Total bookings today", value: bookingsToday },
    { label: "Total bookings this week", value: bookingsWeek },
    { label: "Revenue today", value: Number(revenueToday._sum.totalPrice || 0) },
    { label: "Upcoming events", value: upcomingEvents },
    { label: "Contact inquiries", value: unreadMessages },
    { label: "Active courts", value: activeCourts }
  ];

  return (
    <article className="card">
      <h2>Dashboard Overview</h2>
      <div className="grid grid-3">
        {cards.map((card) => (
          <div key={card.label} className="card">
            <h3>{card.label}</h3>
            <p className="badge">{card.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
