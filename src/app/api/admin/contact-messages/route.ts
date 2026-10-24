import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const messages = await prisma.contactMessage.findMany({
    where: {
      createdAt: date ? { gte: new Date(date) } : undefined
    },
    orderBy: [{ createdAt: "desc" }]
  });

  return NextResponse.json({ messages });
}
