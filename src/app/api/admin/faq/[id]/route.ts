import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { sanitizeText } from "@/lib/sanitize";

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json();
  const item = await prisma.faqItem.update({
    where: { id: context.params.id },
    data: {
      question: sanitizeText(body.question),
      answer: sanitizeText(body.answer),
      category: sanitizeText(body.category || "General"),
      displayOrder: Number(body.display_order || 0),
      isPublished: body.is_published
    }
  });

  return NextResponse.json({ faq_item: item });
}

export async function DELETE(_: NextRequest, context: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  await prisma.faqItem.delete({ where: { id: context.params.id } });
  return NextResponse.json({ success: true });
}
