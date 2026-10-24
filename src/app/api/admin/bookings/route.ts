import { NextRequest, NextResponse } from "next/server";
import { BookingStatus, Prisma } from "@prisma/client";
import { addMinutesToTime, rangesOverlap } from "@/lib/time";
import { choosePricingRule, computeBookingPrice } from "@/lib/pricing";
import { makeBookingReference } from "@/lib/refs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { sanitizeNullableText, sanitizeText } from "@/lib/sanitize";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");
  const courtId = searchParams.get("court_id");
  const search = searchParams.get("search");
  const parsedPage = Number(searchParams.get("page") || "1");
  const parsedPageSize = Number(searchParams.get("page_size") || "20");
  const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
  const pageSize = Number.isFinite(parsedPageSize)
    ? Math.min(100, Math.max(5, parsedPageSize))
    : 20;

  const where: Prisma.BookingWhereInput = {};

  if (date) where.bookingDate = new Date(date);
  if (status) where.status = status as BookingStatus;
  if (courtId) where.courtId = courtId;

  if (search) {
    where.OR = [
      { bookingReference: { contains: search, mode: "insensitive" } },
      { guestName: { contains: search, mode: "insensitive" } },
      { guestEmail: { contains: search, mode: "insensitive" } },
      { user: { is: { fullName: { contains: search, mode: "insensitive" } } } },
      { user: { is: { email: { contains: search, mode: "insensitive" } } } }
    ];
  }

  const [total, bookings] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: { court: true, user: true },
      orderBy: [{ bookingDate: "desc" }, { startTime: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    bookings,
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: totalPages
    }
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }

  const body = await request.json();

  const bookingDate = new Date(body.booking_date);
  const duration = Number(body.duration_minutes || 60);
  const startTime = sanitizeText(body.start_time);
  const endTime = addMinutesToTime(startTime, duration);

  const overlaps = await prisma.booking.findMany({
    where: {
      courtId: body.court_id,
      bookingDate,
      status: { in: ["pending", "confirmed"] }
    }
  });

  const hasOverlap = overlaps.some((item) => rangesOverlap(startTime, endTime, item.startTime, item.endTime));
  if (hasOverlap) {
    return NextResponse.json({ error: "Overlapping booking exists" }, { status: 400 });
  }

  const blocked = await prisma.blockedSlot.findFirst({
    where: {
      courtId: body.court_id,
      bookingDate,
      startTime: { lt: endTime },
      endTime: { gt: startTime }
    }
  });

  if (blocked) {
    return NextResponse.json({ error: "Slot is blocked" }, { status: 400 });
  }

  const rules = await prisma.pricingRule.findMany({ where: { isActive: true } });
  const rule = choosePricingRule(rules, {
    courtId: body.court_id,
    bookingDate,
    startTime,
    durationMinutes: duration
  });
  const price = computeBookingPrice(rule);

  const booking = await prisma.booking.create({
    data: {
      bookingReference: makeBookingReference(),
      courtId: body.court_id,
      bookingDate,
      startTime,
      endTime,
      durationMinutes: duration,
      status: body.status || "confirmed",
      paymentStatus: body.payment_status || "unpaid",
      totalPrice: new Prisma.Decimal(price.totalPrice),
      guestName: sanitizeNullableText(body.full_name),
      guestEmail: sanitizeNullableText(body.email),
      guestPhone: sanitizeNullableText(body.phone),
      notes: sanitizeNullableText(body.notes)
    }
  });

  return NextResponse.json({ booking });
}

