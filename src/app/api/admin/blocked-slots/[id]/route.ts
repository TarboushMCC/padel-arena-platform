import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function DELETE(_: NextRequest, context: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  await prisma.blockedSlot.delete({ where: { id: context.params.id } });
  return NextResponse.json({ success: true });
}
