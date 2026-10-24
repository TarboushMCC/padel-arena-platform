import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json();

  const booking = await prisma.booking.update({
    where: { id: context.params.id },
    data: {
      status: body.status,
      paymentStatus: body.payment_status,
      notes: body.notes
    }
  });

  return NextResponse.json({ booking });
}
