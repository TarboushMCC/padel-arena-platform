import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createHold } from "@/lib/booking";
import { holdSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = holdSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const cookieStore = cookies();
  let token = cookieStore.get("guest_session")?.value;
  if (!token) {
    token = randomUUID();
  }

  try {
    const result = await createHold({
      courtId: parsed.data.court_id,
      bookingDate: parsed.data.booking_date,
      startTime: parsed.data.start_time,
      durationMinutes: parsed.data.duration_minutes,
      userId: session?.user?.id,
      sessionToken: session?.user?.id ? undefined : token
    });

    const response = NextResponse.json({
      hold_id: result.hold.id,
      expires_at: result.hold.expiresAt,
      summary: result.summary
    });

    response.cookies.set("guest_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
