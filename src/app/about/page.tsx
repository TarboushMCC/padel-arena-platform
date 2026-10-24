import { getSetting } from "@/lib/settings";

export default async function AboutPage() {
  const content = await getSetting<Record<string, any>>("about_content", {});
  const differentiators: string[] = content.differentiators || [];

  return (
    <div className="page container">
      <section className="hero">
        <h1>About Us</h1>
        <p>
          {content.intro ||
            "Skymark GT is built for players who value quality, speed, and a world-class sports atmosphere in Abu Dhabi."}
        </p>
      </section>

      <section style={{ marginTop: "2rem" }} className="grid grid-2">
        <article className="card">
          <h2>Our Story</h2>
          <p>{content.story || "We launched with one goal: create a premium and accessible padel ecosystem."}</p>
        </article>

        <article className="card">
          <h2>Mission & Vision</h2>
          <p>{content.mission || "Build the strongest padel culture in the region with great experiences and systems."}</p>
        </article>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>What makes us different</h2>
        <div className="grid grid-3">
          {(differentiators.length
            ? differentiators
            : ["Premium courts", "Smart booking", "Community events", "Coaching network"]
          ).map((item) => (
            <article className="card" key={item}>
              <h3>{item}</h3>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: "2rem" }} className="card">
        <h2>Team Preview</h2>
        <p>Our operations and coaching staff are focused on smooth sessions, fair play, and high service standards.</p>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Venue Images</h2>
        <div className="grid grid-3">
          {["Courts", "Lobby", "Lounge", "Night Play", "Events", "Training"].map((item) => (
            <div key={item} className="card" style={{ minHeight: 120 }}>
              <strong>{item}</strong>
              <p>Image placeholder (replace with managed content)</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
