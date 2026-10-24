import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/booking";
import { availabilitySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const parsed = availabilitySchema.safeParse({
    date: searchParams.get("date"),
    duration_minutes: searchParams.get("duration_minutes"),
    court_type: searchParams.get("court_type") || undefined,
    location_type: searchParams.get("location_type") || undefined,
    start_time: searchParams.get("start_time") || undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const availability = await getAvailability({
      date: parsed.data.date,
      durationMinutes: parsed.data.duration_minutes,
      courtType: parsed.data.court_type,
      locationType: parsed.data.location_type,
      startTime: parsed.data.start_time
    });

    return NextResponse.json(availability);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
