import bcrypt from "bcryptjs";
import { Prisma, PrismaClient, DayType, EventStatus } from "@prisma/client";

const prisma = new PrismaClient();

function day(base: Date, shift: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + shift);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@padelarena.com" },
    update: {
      fullName: "Platform Admin",
      passwordHash: adminPasswordHash,
      role: "admin",
      isActive: true
    },
    create: {
      fullName: "Platform Admin",
      email: "admin@padelarena.com",
      phone: "+971500000000",
      passwordHash: adminPasswordHash,
      role: "admin"
    }
  });

  const courtsData = [
    {
      name: "Court 1",
      slug: "court-1",
      courtType: "Panoramic",
      locationType: "indoor" as const,
      description: "Premium indoor panoramic court with anti-glare lighting.",
      imageUrl: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e"
    },
    {
      name: "Court 2",
      slug: "court-2",
      courtType: "Competition",
      locationType: "indoor" as const,
      description: "Competition-grade indoor court for league matches and training.",
      imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b"
    },
    {
      name: "Court 3",
      slug: "court-3",
      courtType: "Outdoor",
      locationType: "outdoor" as const,
      description: "Outdoor court with evening lighting and shaded spectator zone.",
      imageUrl: "https://images.unsplash.com/photo-1543357480-c60d400e2ef9"
    }
  ];

  const courts = [];
  for (const court of courtsData) {
    const upserted = await prisma.court.upsert({
      where: { slug: court.slug },
      update: court,
      create: court
    });
    courts.push(upserted);
  }

  const hours = [
    { dayOfWeek: 0, openTime: "08:00", closeTime: "23:00", isClosed: false },
    { dayOfWeek: 1, openTime: "06:00", closeTime: "23:30", isClosed: false },
    { dayOfWeek: 2, openTime: "06:00", closeTime: "23:30", isClosed: false },
    { dayOfWeek: 3, openTime: "06:00", closeTime: "23:30", isClosed: false },
    { dayOfWeek: 4, openTime: "06:00", closeTime: "23:30", isClosed: false },
    { dayOfWeek: 5, openTime: "06:00", closeTime: "23:59", isClosed: false },
    { dayOfWeek: 6, openTime: "06:00", closeTime: "23:59", isClosed: false }
  ];

  for (const row of hours) {
    await prisma.operatingHours.upsert({
      where: { dayOfWeek: row.dayOfWeek },
      update: row,
      create: row
    });
  }

  await prisma.pricingRule.deleteMany({});

  await prisma.pricingRule.createMany({
    data: [
      {
        name: "Weekday Base 60",
        dayType: DayType.weekday,
        durationMinutes: 60,
        basePrice: 220,
        currency: "AED",
        priority: 10
      },
      {
        name: "Weekday Base 90",
        dayType: DayType.weekday,
        durationMinutes: 90,
        basePrice: 300,
        currency: "AED",
        priority: 11
      },
      {
        name: "Weekday Base 120",
        dayType: DayType.weekday,
        durationMinutes: 120,
        basePrice: 380,
        currency: "AED",
        priority: 12
      },
      {
        name: "Weekend Base 60",
        dayType: DayType.weekend,
        durationMinutes: 60,
        basePrice: 260,
        currency: "AED",
        priority: 20
      },
      {
        name: "Weekend Base 90",
        dayType: DayType.weekend,
        durationMinutes: 90,
        basePrice: 350,
        currency: "AED",
        priority: 21
      },
      {
        name: "Weekend Base 120",
        dayType: DayType.weekend,
        durationMinutes: 120,
        basePrice: 430,
        currency: "AED",
        priority: 22
      },
      {
        name: "Court 1 Weekday 90",
        appliesToCourtId: courts[0]?.id,
        dayType: DayType.weekday,
        durationMinutes: 90,
        basePrice: 320,
        currency: "AED",
        priority: 25
      },
      {
        name: "Court 1 Weekend 90",
        appliesToCourtId: courts[0]?.id,
        dayType: DayType.weekend,
        durationMinutes: 90,
        basePrice: 370,
        currency: "AED",
        priority: 26
      }
    ]
  });

  await prisma.event.deleteMany({});

  const now = new Date();
  await prisma.event.createMany({
    data: [
      {
        title: "Friday Social Mixer",
        slug: "friday-social-mixer",
        description: "Friendly round-robin event open to all levels.",
        coverImageUrl: "https://images.unsplash.com/photo-1504439904031-93ded9f93e4e",
        eventDate: day(now, 5),
        startTime: "19:00",
        endTime: "22:00",
        status: EventStatus.upcoming,
        locationNote: "Main courts"
      },
      {
        title: "Junior Development Clinic",
        slug: "junior-development-clinic",
        description: "Coached junior clinic focused on technique and match IQ.",
        coverImageUrl: "https://images.unsplash.com/photo-1474511320723-9a56873867b5",
        eventDate: day(now, 12),
        startTime: "16:00",
        endTime: "18:00",
        status: EventStatus.upcoming,
        locationNote: "Court 2"
      },
      {
        title: "March Club Championship",
        slug: "march-club-championship",
        description: "Monthly club tournament finals highlights.",
        coverImageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978",
        eventDate: day(now, -20),
        startTime: "18:00",
        endTime: "22:00",
        status: EventStatus.completed,
        locationNote: "Center court"
      }
    ]
  });

  await prisma.faqItem.deleteMany({});
  await prisma.faqItem.createMany({
    data: [
      {
        question: "How do I book a court?",
        answer: "Use the Booking page, select date/time, review the price, and confirm your booking.",
        category: "Booking",
        displayOrder: 1,
        isPublished: true
      },
      {
        question: "Can I cancel or reschedule?",
        answer: "Yes, if your booking start time is outside the configured cancellation window.",
        category: "Cancellation",
        displayOrder: 2,
        isPublished: true
      },
      {
        question: "Do you provide rackets and balls?",
        answer: "Yes. Equipment rental is available and can be added at the venue.",
        category: "Equipment",
        displayOrder: 3,
        isPublished: true
      }
    ]
  });

  const siteSettings: Record<string, unknown> = {
    arena_name: "Skymark GT",
    address: "Al Raha, Abu Dhabi, UAE",
    phone: "+971 50 123 4567",
    email: "hello@skymarkgt.com",
    whatsapp_url: "https://wa.me/971501234567",
    cancellation_hours_limit: 6,
    booking_hold_minutes: 10,
    payment_mode: "stripe",
    timezone: "Asia/Dubai",
    currency: "AED",
    guest_checkout_enabled: true,
    slot_interval_minutes: 30,
    allowed_durations: [60, 90, 120],
    opening_notice: "Open daily in Abu Dhabi with extended evening sessions.",
    home_content: {
      hero: {
        headline: "Skymark GT: Abu Dhabi's Modern Padel Experience",
        subheadline: "Professional courts, energetic community, and fast online booking.",
        primaryCta: "Book a Court",
        secondaryCta: "View Pricing",
        imageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e"
      },
      whyChooseUs: [
        "Premium courts",
        "Easy online booking",
        "Great location",
        "Parking",
        "High-quality lighting",
        "Active events community"
      ],
      facilitiesPreview: ["Courts", "Lounge", "Showers", "Parking", "Equipment rental"]
    },
    about_content: {
      intro: "Skymark GT was built to make world-class padel accessible to everyone.",
      story: "From first-timers to competitive players, our mission is to create a home for the padel community.",
      mission: "Deliver premium play experiences and a welcoming sports culture.",
      differentiators: [
        "Tournament-standard courts",
        "Seamless digital booking",
        "Experienced coaching network",
        "Community-driven events"
      ]
    },
    social_links: {
      instagram: "https://instagram.com",
      tiktok: "https://tiktok.com",
      youtube: "https://youtube.com"
    },
    map_embed_url: "https://maps.google.com"
  };

  for (const [key, value] of Object.entries(siteSettings)) {
    const jsonValue = value as Prisma.InputJsonValue;
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: jsonValue },
      create: { key, value: jsonValue }
    });
  }

  console.log(`Seed complete. Admin user: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
