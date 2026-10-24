import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function PUT(_: NextRequest, context: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const message = await prisma.contactMessage.update({
    where: { id: context.params.id },
    data: { isRead: true }
  });

  return NextResponse.json({ message });
}
