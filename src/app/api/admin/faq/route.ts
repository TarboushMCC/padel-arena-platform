import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { sanitizeText } from "@/lib/sanitize";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const items = await prisma.faqItem.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }]
  });

  return NextResponse.json({ faq_items: items });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json();
  const item = await prisma.faqItem.create({
    data: {
      question: sanitizeText(body.question),
      answer: sanitizeText(body.answer),
      category: sanitizeText(body.category || "General"),
      displayOrder: Number(body.display_order || 0),
      isPublished: body.is_published !== false
    }
  });

  return NextResponse.json({ faq_item: item });
}
