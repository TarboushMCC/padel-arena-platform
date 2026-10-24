import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { choosePricingRule, computeBookingPrice } from "@/lib/pricing";
import { makeBookingReference } from "@/lib/refs";
import { getSetting } from "@/lib/settings";
import { addMinutesToTime, durationBetween, parseTimeToMinutes, rangesOverlap, toDateOnly } from "@/lib/time";

type AvailabilitySlot = {
  courtId: string;
  courtName: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  currency: string;
};

type AvailabilityResult = {
  date: string;
  durationMinutes: number;
  slots: AvailabilitySlot[];
};

export async function getAvailability(params: {
  date: string;
  durationMinutes: number;
  courtType?: string;
  locationType?: "indoor" | "outdoor";
  startTime?: string;
}): Promise<AvailabilityResult> {
  const requestedDate = toDateOnly(new Date(params.date));
  const today = toDateOnly(new Date());
  if (requestedDate < today) {
    throw new Error("Date cannot be in the past");
  }

  const dayOfWeek = requestedDate.getDay();
  const hours = await prisma.operatingHours.findUnique({ where: { dayOfWeek } });
  if (!hours || hours.isClosed) {
    return { date: params.date, durationMinutes: params.durationMinutes, slots: [] };
  }

  const courts = await prisma.court.findMany({
    where: {
      status: "active",
      courtType: params.courtType || undefined,
      locationType: params.locationType || undefined
    },
    orderBy: { name: "asc" }
  });

  const bookings = await prisma.booking.findMany({
    where: {
      bookingDate: requestedDate,
      status: { in: [BookingStatus.pending, BookingStatus.confirmed] }
    }
  });

  const activeHolds = await prisma.bookingHold.findMany({
    where: {
      bookingDate: requestedDate,
      expiresAt: { gt: new Date() }
    }
  });

  const blockedSlots = await prisma.blockedSlot.findMany({
    where: { bookingDate: requestedDate }
  });

  const rules = await prisma.pricingRule.findMany({ where: { isActive: true } });
  const interval = Number(await getSetting("slot_interval_minutes", 30));

  const openMinutes = parseTimeToMinutes(hours.openTime);
  let closeMinutes = parseTimeToMinutes(hours.closeTime);
  if (closeMinutes <= openMinutes) {
    closeMinutes = 24 * 60;
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = requestedDate.getTime() === today.getTime();

  const slots: AvailabilitySlot[] = [];

  for (const court of courts) {
    for (let start = openMinutes; start + params.durationMinutes <= closeMinutes; start += interval) {
      const startHour = Math.floor(start / 60)
        .toString()
        .padStart(2, "0");
      const startMinute = (start % 60).toString().padStart(2, "0");
      const startTime = `${startHour}:${startMinute}`;
      const endTime = addMinutesToTime(startTime, params.durationMinutes);

      if (params.startTime && params.startTime !== startTime) continue;
      if (isToday && parseTimeToMinutes(startTime) <= nowMinutes) continue;

      const overlapsBooking = bookings.some(
        (booking) => booking.courtId === court.id && rangesOverlap(startTime, endTime, booking.startTime, booking.endTime)
      );
      if (overlapsBooking) continue;

      const overlapsHold = activeHolds.some(
        (hold) => hold.courtId === court.id && rangesOverlap(startTime, endTime, hold.startTime, hold.endTime)
      );
      if (overlapsHold) continue;

      const overlapsBlocked = blockedSlots.some(
        (blocked) => blocked.courtId === court.id && rangesOverlap(startTime, endTime, blocked.startTime, blocked.endTime)
      );
      if (overlapsBlocked) continue;

      const rule = choosePricingRule(rules, {
        courtId: court.id,
        bookingDate: requestedDate,
        startTime,
        durationMinutes: params.durationMinutes
      });
      const price = computeBookingPrice(rule);

      slots.push({
        courtId: court.id,
        courtName: court.name,
        startTime,
        endTime,
        totalPrice: price.totalPrice,
        currency: price.currency
      });
    }
  }

  return {
    date: params.date,
    durationMinutes: params.durationMinutes,
    slots
  };
}

export async function createHold(params: {
  courtId: string;
  bookingDate: string;
  startTime: string;
  durationMinutes: number;
  userId?: string;
  sessionToken?: string;
}) {
  const availability = await getAvailability({
    date: params.bookingDate,
    durationMinutes: params.durationMinutes,
    startTime: params.startTime
  });

  const slot = availability.slots.find((item) => item.courtId === params.courtId && item.startTime === params.startTime);
  if (!slot) {
    throw new Error("Selected slot is no longer available");
  }

  const holdMinutes = Number(await getSetting("booking_hold_minutes", 10));
  const expiresAt = new Date(Date.now() + holdMinutes * 60_000);

  const hold = await prisma.bookingHold.create({
    data: {
      courtId: params.courtId,
      bookingDate: toDateOnly(new Date(params.bookingDate)),
      startTime: params.startTime,
      endTime: slot.endTime,
      userId: params.userId,
      sessionToken: params.sessionToken,
      expiresAt
    }
  });

  return {
    hold,
    summary: {
      courtId: params.courtId,
      startTime: params.startTime,
      endTime: slot.endTime,
      totalPrice: slot.totalPrice,
      currency: slot.currency
    }
  };
}

export async function canCancel(bookingDate: Date, startTime: string) {
  const hoursLimit = Number(await getSetting("cancellation_hours_limit", 6));
  const start = new Date(bookingDate);
  const [hour, minute] = startTime.split(":").map(Number);
  start.setHours(hour, minute, 0, 0);
  const diffHours = (start.getTime() - Date.now()) / 36e5;
  return diffHours >= hoursLimit;
}

export async function finalizeBooking(params: {
  holdId: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
  paymentMode: "stripe" | "venue";
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const hold = await tx.bookingHold.findUnique({ where: { id: params.holdId } });
    if (!hold) {
      throw new Error("Hold not found");
    }

    if (hold.expiresAt <= new Date()) {
      throw new Error("Hold expired");
    }

    const overlapsBooking = await tx.booking.findFirst({
      where: {
        courtId: hold.courtId,
        bookingDate: hold.bookingDate,
        status: { in: [BookingStatus.pending, BookingStatus.confirmed] },
        OR: [
          {
            startTime: { lt: hold.endTime },
            endTime: { gt: hold.startTime }
          }
        ]
      }
    });

    if (overlapsBooking) {
      throw new Error("Slot unavailable");
    }

    const overlapsBlocked = await tx.blockedSlot.findFirst({
      where: {
        courtId: hold.courtId,
        bookingDate: hold.bookingDate,
        startTime: { lt: hold.endTime },
        endTime: { gt: hold.startTime }
      }
    });

    if (overlapsBlocked) {
      throw new Error("Slot blocked");
    }

    const rules = await tx.pricingRule.findMany({ where: { isActive: true } });
    const durationMinutes = durationBetween(hold.startTime, hold.endTime);
    const rule = choosePricingRule(rules, {
      courtId: hold.courtId,
      bookingDate: hold.bookingDate,
      startTime: hold.startTime,
      durationMinutes
    });
    const price = computeBookingPrice(rule);

    let reference = makeBookingReference();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await tx.booking.findUnique({ where: { bookingReference: reference } });
      if (!exists) break;
      reference = makeBookingReference();
      attempts += 1;
    }

    const booking = await tx.booking.create({
      data: {
        bookingReference: reference,
        userId: params.userId,
        guestName: params.userId ? null : params.fullName,
        guestEmail: params.userId ? null : params.email,
        guestPhone: params.userId ? null : params.phone,
        courtId: hold.courtId,
        bookingDate: hold.bookingDate,
        startTime: hold.startTime,
        endTime: hold.endTime,
        durationMinutes,
        status: params.paymentMode === "stripe" ? "pending" : "confirmed",
        paymentStatus: params.paymentMode === "stripe" ? "unpaid" : "unpaid",
        totalPrice: new Prisma.Decimal(price.totalPrice),
        notes: params.notes,
        stripeSessionId: params.stripeSessionId,
        stripePaymentIntentId: params.stripePaymentIntentId
      }
    });

    await tx.bookingHold.delete({ where: { id: hold.id } });

    return booking;
  });
}
