import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);

  const where = {
    status: status ? (status as "upcoming" | "completed" | "cancelled") : undefined
  };

  const [items, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: [{ eventDate: "asc" }, { startTime: "asc" }],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.event.count({ where })
  ]);

  return NextResponse.json({ page, limit, total, items });
}
