import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const body = await request.json();
  const bookingId = body.booking_id as string;

  if (!bookingId) {
    return NextResponse.json({ error: "booking_id is required" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "aed",
          unit_amount: Math.round(Number(booking.totalPrice) * 100),
          product_data: {
            name: `Padel Booking ${booking.bookingReference}`
          }
        }
      }
    ],
    success_url: `${process.env.NEXTAUTH_URL}/booking/success?reference=${booking.bookingReference}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/booking?reference=${booking.bookingReference}`,
    metadata: {
      booking_id: booking.id,
      booking_reference: booking.bookingReference
    }
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripeSessionId: session.id }
  });

  return NextResponse.json({ url: session.url });
}
