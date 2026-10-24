import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function GET(_: NextRequest, context: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth.error || !auth.session) {
    return auth.error;
  }

  const booking = await prisma.booking.findUnique({
    where: { id: context.params.id },
    include: { court: true, user: true }
  });

  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (auth.session.user.role !== "admin" && booking.userId !== auth.session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ booking });
}
