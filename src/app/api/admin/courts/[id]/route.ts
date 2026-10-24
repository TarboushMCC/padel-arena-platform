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

  const court = await prisma.court.update({
    where: { id: context.params.id },
    data: {
      name: sanitizeText(body.name),
      slug: sanitizeText(body.slug),
      courtType: sanitizeText(body.court_type),
      locationType: body.location_type,
      description: sanitizeText(body.description),
      imageUrl: sanitizeNullableText(body.image_url),
      status: body.status
    }
  });

  return NextResponse.json({ court });
}

export async function DELETE(_: NextRequest, context: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const court = await prisma.court.update({
    where: { id: context.params.id },
    data: { status: "inactive" }
  });

  return NextResponse.json({ court });
}
