import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeNullableText, sanitizeText } from "@/lib/sanitize";
import { contactSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const limiter = checkRateLimit(`contact:${ip}`, 10, 60_000);
  if (!limiter.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const message = await prisma.contactMessage.create({
    data: {
      name: sanitizeText(parsed.data.name),
      email: sanitizeText(parsed.data.email).toLowerCase(),
      phone: sanitizeNullableText(parsed.data.phone),
      subject: sanitizeNullableText(parsed.data.subject),
      message: sanitizeText(parsed.data.message)
    }
  });

  return NextResponse.json({
    success: true,
    message: "Your inquiry has been sent.",
    id: message.id
  });
}
