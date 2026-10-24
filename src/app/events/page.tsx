import { EmptyState } from "@/components/shared/EmptyState";
import { prisma } from "@/lib/prisma";

export default async function EventsPage() {
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    prisma.event.findMany({
      where: { status: "upcoming", eventDate: { gte: now } },
      orderBy: [{ eventDate: "asc" }, { startTime: "asc" }]
    }),
    prisma.event.findMany({
      where: {
        OR: [{ status: "completed" }, { eventDate: { lt: now } }]
      },
      orderBy: [{ eventDate: "desc" }, { startTime: "desc" }],
      take: 12
    })
  ]);

  return (
    <div className="page container">
      <section className="hero">
        <h1>Tournaments & Events</h1>
        <p>Stay connected with upcoming competitions, socials, and club activities.</p>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Upcoming Events</h2>
        {upcoming.length ? (
          <div className="grid grid-3">
            {upcoming.map((event) => (
              <article key={event.id} className="card">
                <span className="badge">{event.status}</span>
                <h3>{event.title}</h3>
                <p>{event.eventDate.toISOString().split("T")[0]}</p>
                <p>
                  {event.startTime} - {event.endTime}
                </p>
                <p>{event.description}</p>
                {event.locationNote ? <p>Location: {event.locationNote}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No upcoming events" description="Check again soon or contact us for private events." />
        )}
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Past Events</h2>
        <div className="grid grid-3">
          {past.map((event) => (
            <article key={event.id} className="card">
              <span className="badge">{event.status}</span>
              <h3>{event.title}</h3>
              <p>{event.eventDate.toISOString().split("T")[0]}</p>
              <p>{event.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
