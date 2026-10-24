import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { sanitizeNullableText, sanitizeText } from "@/lib/sanitize";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const events = await prisma.event.findMany({
    orderBy: [{ eventDate: "asc" }, { startTime: "asc" }]
  });

  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json();
  const event = await prisma.event.create({
    data: {
      title: sanitizeText(body.title),
      slug: sanitizeText(body.slug),
      description: sanitizeText(body.description),
      coverImageUrl: sanitizeNullableText(body.cover_image_url),
      eventDate: new Date(body.event_date),
      startTime: sanitizeText(body.start_time),
      endTime: sanitizeText(body.end_time),
      status: body.status || "upcoming",
      locationNote: sanitizeNullableText(body.location_note)
    }
  });

  return NextResponse.json({ event });
}
