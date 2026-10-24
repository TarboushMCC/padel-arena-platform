import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";

export async function GET() {
  const homeContent = await getSetting("home_content", {} as Record<string, unknown>);
  const pricingPreview = await prisma.pricingRule.findMany({
    where: { isActive: true },
    orderBy: [{ priority: "desc" }],
    take: 6,
    select: {
      id: true,
      name: true,
      basePrice: true,
      currency: true,
      dayType: true,
      durationMinutes: true,
      startTime: true,
      endTime: true
    }
  });

  const events = await prisma.event.findMany({
    where: {
      status: "upcoming",
      eventDate: { gte: new Date() }
    },
    orderBy: [{ eventDate: "asc" }, { startTime: "asc" }],
    take: 3
  });

  const courts = await prisma.court.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
    take: 3
  });

  const faqPreview = await prisma.faqItem.findMany({
    where: { isPublished: true },
    orderBy: { displayOrder: "asc" },
    take: 4
  });

  const contact = {
    arena_name: await getSetting("arena_name", "Skymark GT"),
    address: await getSetting("address", ""),
    phone: await getSetting("phone", ""),
    email: await getSetting("email", ""),
    whatsapp_url: await getSetting("whatsapp_url", ""),
    opening_notice: await getSetting("opening_notice", "")
  };

  return NextResponse.json({
    hero: homeContent,
    facilities_preview: courts,
    pricing_preview: pricingPreview,
    upcoming_events: events,
    faq_preview: faqPreview,
    contact_summary: contact
  });
}
