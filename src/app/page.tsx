import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { EmptyState } from "@/components/shared/EmptyState";
import { QuickBookingWidget } from "@/components/sections/QuickBookingWidget";

export default async function HomePage() {
  const [homeContent, events, pricing, courts, socialLinks, address, phone, email, whatsappUrl] = await Promise.all([
    getSetting<Record<string, any>>("home_content", {}),
    prisma.event.findMany({
      where: { status: "upcoming", eventDate: { gte: new Date() } },
      orderBy: [{ eventDate: "asc" }, { startTime: "asc" }],
      take: 3
    }),
    prisma.pricingRule.findMany({
      where: { isActive: true },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 4
    }),
    prisma.court.findMany({ where: { status: "active" }, take: 6, orderBy: { name: "asc" } }),
    getSetting<Record<string, string>>("social_links", {}),
    getSetting<string>("address", "Al Raha, Abu Dhabi, UAE"),
    getSetting<string>("phone", "+971 50 123 4567"),
    getSetting<string>("email", "hello@skymarkgt.com"),
    getSetting<string>("whatsapp_url", "#")
  ]);

  const hero = homeContent.hero || {};
  const whyChooseUs: string[] = homeContent.whyChooseUs || [
    "Premium courts",
    "Easy online booking",
    "Good location",
    "Parking",
    "Lighting",
    "Community events"
  ];
  const facilitiesPreview: string[] = homeContent.facilitiesPreview || ["Courts", "Lounge", "Showers", "Parking", "Rental"];
  const heroMetrics = [
    { label: "Active Courts", value: String(courts.length) },
    { label: "Upcoming Events", value: String(events.length) },
    {
      label: "Rates From",
      value: pricing.length ? `${Number(pricing[0]?.basePrice || 0)} AED` : "Custom"
    }
  ];

  return (
    <div className="page container">
      <section className="hero">
        <h1>{hero.headline || "Skymark GT: Modern Padel in Abu Dhabi"}</h1>
        <p>
          {hero.subheadline ||
            "A premium, design-forward venue experience with seamless booking, high-performance courts, and a vibrant player community."}
        </p>

        <div className="hero-actions">
          <Link href="/booking" className="btn btn-primary">
            {hero.primaryCta || "Book a Court"}
          </Link>
          <Link href="/pricing" className="btn btn-ghost">
            {hero.secondaryCta || "View Pricing"}
          </Link>
        </div>

        <QuickBookingWidget />
        <div className="hero-metrics">
          {heroMetrics.map((metric) => (
            <article key={metric.label} className="metric-card">
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <SectionTitle title="Why Choose Us" subtitle="Built for performance and comfort." />
        <div className="grid grid-3">
          {whyChooseUs.map((benefit) => (
            <article className="card" key={benefit}>
              <h3>{benefit}</h3>
              <p>Professional standards and a frictionless customer experience from first click to final match point.</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <SectionTitle
          title="Facilities Preview"
          subtitle="See what is included at the venue."
          action={
            <Link href="/courts" className="btn btn-ghost">
              Explore Courts
            </Link>
          }
        />
        <div className="grid grid-3">
          {facilitiesPreview.map((item) => (
            <article className="card" key={item}>
              <h3>{item}</h3>
              <p>Premium-grade setup designed for reliable gameplay and a better venue experience.</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <SectionTitle
          title="Pricing Preview"
          subtitle="Clear and transparent rates."
          action={
            <Link href="/pricing" className="btn btn-ghost">
              View Full Pricing
            </Link>
          }
        />
        <div className="grid grid-2">
          {pricing.map((rule) => (
            <article className="card" key={rule.id}>
              <h3>{rule.name}</h3>
              <p>
                {Number(rule.basePrice)} {rule.currency}
              </p>
              <p>
                Day type: <span className="badge">{rule.dayType}</span>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <SectionTitle
          title="Upcoming Events"
          subtitle="Join the community and compete."
          action={
            <Link href="/events" className="btn btn-ghost">
              All Events
            </Link>
          }
        />
        {events.length ? (
          <div className="grid grid-3">
            {events.map((event) => (
              <article className="card" key={event.id}>
                <h3>{event.title}</h3>
                <p>{event.eventDate.toISOString().split("T")[0]}</p>
                <p>
                  {event.startTime} - {event.endTime}
                </p>
                <p>{event.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No upcoming events yet" description="We are preparing the next schedule. Contact us for private matches." />
        )}
      </section>

      <section style={{ marginTop: "2rem" }}>
        <SectionTitle title="Testimonials" subtitle="Trusted by players across all levels." />
        <div className="grid grid-3">
          <article className="card">
            <h3>Best courts in the area</h3>
            <p>Fast booking, quality lighting, and a great post-game lounge.</p>
          </article>
          <article className="card">
            <h3>Professional experience</h3>
            <p>The platform makes planning games easy. We book in seconds.</p>
          </article>
          <article className="card">
            <h3>Always active community</h3>
            <p>Tournaments and social sessions are organized and fun.</p>
          </article>
        </div>
      </section>

      <section style={{ marginTop: "2rem" }} className="grid grid-2">
        <article className="card">
          <h2>Contact & Location</h2>
          <p>Address: {address}</p>
          <p>Phone: {phone}</p>
          <p>Email: {email}</p>
          <div className="actions">
            <Link href="/contact" className="btn btn-primary">
              Contact Us
            </Link>
            <a href={whatsappUrl} className="btn btn-ghost" target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </div>
        </article>

        <article className="card">
          <h2>Community</h2>
          <p>Follow us for updates, tournament launches, and booking openings.</p>
          <div className="actions">
            {Object.entries(socialLinks || {}).map(([key, value]) => (
              <a key={key} href={String(value)} target="_blank" rel="noreferrer" className="btn btn-ghost">
                {key}
              </a>
            ))}
          </div>
        </article>
      </section>

      <section style={{ marginTop: "2rem" }} className="hero">
        <h2 style={{ fontFamily: "var(--font-heading)", margin: 0, fontSize: "2rem" }}>Ready to step on court?</h2>
        <p>Secure your slot now with instant confirmation and flexible session durations.</p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href="/booking">
            Book your court now
          </Link>
        </div>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <SectionTitle title="Courts Snapshot" subtitle="A quick look at available courts" />
        <div className="grid grid-3">
          {courts.map((court) => (
            <article key={court.id} className="card">
              <h3>{court.name}</h3>
              <p>
                {court.courtType} / {court.locationType}
              </p>
              <p>{court.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
