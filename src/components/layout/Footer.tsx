import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export async function Footer() {
  const settings = await getSettings(["arena_name", "address", "phone", "email", "social_links"]);
  const openingHours = await prisma.operatingHours.findMany({ orderBy: { dayOfWeek: "asc" } });
  const socials = (settings.social_links || {}) as Record<string, string>;

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3>{String(settings.arena_name || "Skymark GT")}</h3>
          <p>{String(settings.address || "")}</p>
          <p>{String(settings.phone || "")}</p>
          <p>{String(settings.email || "")}</p>
        </div>

        <div>
          <h4>Quick Links</h4>
          <ul>
            <li>
              <Link href="/booking">Book Now</Link>
            </li>
            <li>
              <Link href="/pricing">Pricing</Link>
            </li>
            <li>
              <Link href="/events">Events</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Opening Hours</h4>
          <ul>
            {openingHours.map((row) => (
              <li key={row.dayOfWeek}>
                Day {row.dayOfWeek}: {row.isClosed ? "Closed" : `${row.openTime} - ${row.closeTime}`}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Policies</h4>
          <ul>
            <li>
              <Link href="/privacy-policy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/terms">Terms and Conditions</Link>
            </li>
            <li>
              <Link href="/cancellation-policy">Cancellation Policy</Link>
            </li>
          </ul>
          <h4 style={{ marginTop: "0.9rem" }}>Social Links</h4>
          <ul>
            {Object.entries(socials).map(([label, url]) => (
              <li key={label}>
                <a href={url} target="_blank" rel="noreferrer">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
