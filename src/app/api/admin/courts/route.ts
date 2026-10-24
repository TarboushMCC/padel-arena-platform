import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { sanitizeNullableText, sanitizeText } from "@/lib/sanitize";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const courts = await prisma.court.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ courts });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json();

  const court = await prisma.court.create({
    data: {
      name: sanitizeText(body.name),
      slug: sanitizeText(body.slug),
      courtType: sanitizeText(body.court_type),
      locationType: body.location_type,
      description: sanitizeText(body.description),
      imageUrl: sanitizeNullableText(body.image_url),
      status: body.status || "active"
    }
  });

  return NextResponse.json({ court });
}
