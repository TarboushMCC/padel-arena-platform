import { prisma } from "@/lib/prisma";

export default async function FaqPage() {
  const items = await prisma.faqItem.findMany({
    where: { isPublished: true },
    orderBy: [{ category: "asc" }, { displayOrder: "asc" }]
  });

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const category = item.category || "General";
    acc[category] = acc[category] || [];
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <div className="page container">
      <section className="hero">
        <h1>FAQ</h1>
        <p>Common questions about booking, cancellation, equipment, and venue policies.</p>
      </section>

      <section style={{ marginTop: "2rem" }} className="accordion grid" aria-label="Frequently asked questions">
        {Object.entries(grouped).map(([category, list]) => (
          <article key={category} className="card">
            <h2>{category}</h2>
            <div className="grid" style={{ gap: "0.6rem" }}>
              {list.map((item) => (
                <details key={item.id}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
