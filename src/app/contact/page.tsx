import { ContactForm } from "@/components/forms/ContactForm";
import { prisma } from "@/lib/prisma";
import { getPublicSettings } from "@/lib/settings";

export default async function ContactPage() {
  const [settings, hours] = await Promise.all([
    getPublicSettings(),
    prisma.operatingHours.findMany({ orderBy: { dayOfWeek: "asc" } })
  ]);

  return (
    <div className="page container">
      <section className="hero">
        <h1>Contact Us</h1>
        <p>Reach us quickly and get support for bookings, events, or general questions.</p>
      </section>

      <section style={{ marginTop: "2rem" }} className="grid grid-2">
        <article className="card">
          <h2>Contact Information</h2>
          <p>Address: {String(settings.address || "")}</p>
          <p>Phone: {String(settings.phone || "")}</p>
          <p>Email: {String(settings.email || "")}</p>
          <p>
            WhatsApp: <a href={String(settings.whatsapp_url || "#")}>Open chat</a>
          </p>

          <h3>Opening Hours</h3>
          <ul>
            {hours.map((row) => (
              <li key={row.id}>
                Day {row.dayOfWeek}: {row.isClosed ? "Closed" : `${row.openTime} - ${row.closeTime}`}
              </li>
            ))}
          </ul>

          <h3>Map</h3>
          <p>
            <a href={String(settings.map_embed_url || "https://maps.google.com")} target="_blank" rel="noreferrer">
              Open location in maps
            </a>
          </p>
        </article>

        <ContactForm />
      </section>
    </div>
  );
}
