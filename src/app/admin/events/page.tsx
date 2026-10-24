import { prisma } from "@/lib/prisma";
import { EventsManager } from "@/components/admin/EventsManager";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({ orderBy: [{ eventDate: "asc" }, { startTime: "asc" }] });

  return (
    <EventsManager
      initialEvents={events.map((event) => ({
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        coverImageUrl: event.coverImageUrl,
        eventDate: event.eventDate.toISOString().slice(0, 10),
        startTime: event.startTime,
        endTime: event.endTime,
        status: event.status,
        locationNote: event.locationNote
      }))}
    />
  );
}
