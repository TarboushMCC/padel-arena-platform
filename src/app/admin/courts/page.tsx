import { prisma } from "@/lib/prisma";
import { CourtsManager } from "@/components/admin/CourtsManager";

export default async function AdminCourtsPage() {
  const [courts, blocked] = await Promise.all([
    prisma.court.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.blockedSlot.findMany({
      include: { court: true },
      orderBy: [{ bookingDate: "desc" }, { startTime: "asc" }]
    })
  ]);

  return (
    <CourtsManager
      initialCourts={courts.map((court) => ({
        id: court.id,
        name: court.name,
        slug: court.slug,
        courtType: court.courtType,
        locationType: court.locationType,
        description: court.description,
        imageUrl: court.imageUrl,
        status: court.status
      }))}
      initialBlockedSlots={blocked.map((slot) => ({
        id: slot.id,
        courtId: slot.courtId,
        courtName: slot.court.name,
        bookingDate: slot.bookingDate.toISOString().slice(0, 10),
        startTime: slot.startTime,
        endTime: slot.endTime,
        reason: slot.reason
      }))}
    />
  );
}
