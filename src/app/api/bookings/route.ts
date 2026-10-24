import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { finalizeBooking } from "@/lib/booking";
import { sendEmail } from "@/lib/email";
import { getSetting } from "@/lib/settings";
import { stripe } from "@/lib/stripe";
import { bookingSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const paymentModeConfig = (await getSetting("payment_mode", "stripe")) as "stripe" | "venue";
  const guestCheckoutSetting = await getSetting<boolean | string>("guest_checkout_enabled", true);
  const guestCheckoutEnabled = guestCheckoutSetting === true || guestCheckoutSetting === "true";
  const session = await getServerSession(authOptions);

  if (!session?.user?.id && !guestCheckoutEnabled) {
    return NextResponse.json({ error: "Guest checkout is disabled" }, { status: 403 });
  }

  const mode = parsed.data.payment_mode === "venue" ? "venue" : paymentModeConfig;

  try {
    const booking = await finalizeBooking({
      holdId: parsed.data.hold_id,
      userId: session?.user?.id,
      fullName: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      notes: parsed.data.notes,
      paymentMode: mode
    });

    let checkoutUrl: string | null = null;

    if (mode === "stripe" && stripe) {
      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "aed",
              unit_amount: Math.round(Number(booking.totalPrice) * 100),
              product_data: {
                name: `Padel Court Booking ${booking.bookingReference}`
              }
            }
          }
        ],
        success_url: `${process.env.NEXTAUTH_URL}/booking/success?reference=${booking.bookingReference}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/booking?booking=${booking.id}`,
        metadata: {
          booking_id: booking.id,
          booking_reference: booking.bookingReference
        }
      });

      checkoutUrl = checkout.url;
    }

    await sendEmail({
      to: parsed.data.email,
      subject: `Booking Confirmation ${booking.bookingReference}`,
      text: `Your booking ${booking.bookingReference} was created successfully.`
    });

    return NextResponse.json({
      booking_confirmation: booking,
      booking_reference: booking.bookingReference,
      checkout_url: checkoutUrl
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
