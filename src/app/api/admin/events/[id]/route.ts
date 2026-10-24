import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { sanitizeNullableText, sanitizeText } from "@/lib/sanitize";

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json();
  const event = await prisma.event.update({
    where: { id: context.params.id },
    data: {
      title: sanitizeText(body.title),
      slug: sanitizeText(body.slug),
      description: sanitizeText(body.description),
      coverImageUrl: sanitizeNullableText(body.cover_image_url),
      eventDate: new Date(body.event_date),
      startTime: sanitizeText(body.start_time),
      endTime: sanitizeText(body.end_time),
      status: body.status,
      locationNote: sanitizeNullableText(body.location_note)
    }
  });

  return NextResponse.json({ event });
}

export async function DELETE(_: NextRequest, context: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  await prisma.event.delete({ where: { id: context.params.id } });
  return NextResponse.json({ success: true });
}
