import Link from "next/link";
import { prisma } from "@/lib/prisma";

const amenities = ["Seating area", "Lockers", "Showers", "Parking", "Pro shop", "Lounge"];

export default async function CourtsPage() {
  const courts = await prisma.court.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" }
  });

  return (
    <div className="page container">
      <section className="hero">
        <h1>Courts & Facilities</h1>
        <p>Explore our courts and venue amenities before booking your next session.</p>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Courts Overview</h2>
        <div className="grid grid-3">
          {courts.map((court) => (
            <article key={court.id} className="card">
              <h3>{court.name}</h3>
              <p>
                {court.courtType} / {court.locationType}
              </p>
              <p>{court.description}</p>
              <div className="actions">
                <Link href={`/booking?court_type=${encodeURIComponent(court.courtType)}`} className="btn btn-primary">
                  Book this court type
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Facilities List</h2>
        <div className="grid grid-3">
          {amenities.map((item) => (
            <article key={item} className="card">
              <h3>{item}</h3>
              <p>Included in your venue experience.</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Gallery</h2>
        <div className="grid grid-3">
          {["Courts", "Lobby", "Events", "Night sessions", "Lounge", "Community matches"].map((item) => (
            <article className="card" key={item}>
              <h3>{item}</h3>
              <p>Gallery lightbox slot (replace with uploaded images)</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: "2rem" }} className="hero">
        <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "2rem" }}>Ready to play?</h2>
        <p>Choose your preferred court and lock your slot in seconds.</p>
        <Link href="/booking" className="btn btn-primary">
          Book Now
        </Link>
      </section>
    </div>
  );
}
