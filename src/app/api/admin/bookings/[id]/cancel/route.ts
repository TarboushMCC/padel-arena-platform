import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function POST(_: NextRequest, context: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const booking = await prisma.booking.update({
    where: { id: context.params.id },
    data: { status: "cancelled" }
  });

  return NextResponse.json({ booking });
}
