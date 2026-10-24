import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function PricingPage() {
  const rules = await prisma.pricingRule.findMany({
    where: { isActive: true },
    include: { appliesToCourt: true },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }]
  });

  return (
    <div className="page container">
      <section className="hero">
        <h1>Pricing</h1>
        <p>Clear rates by day, duration, and court scope. Updated directly from admin pricing rules.</p>
      </section>

      <section style={{ marginTop: "2rem" }} className="table-wrap card">
        <h2>Active Pricing Rules</h2>
        <table>
          <thead>
            <tr>
              <th>Rule</th>
              <th>Court</th>
              <th>Day Type</th>
              <th>Time Window</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td>{rule.name}</td>
                <td>{rule.appliesToCourt?.name || "Global"}</td>
                <td>{rule.dayType}</td>
                <td>{rule.startTime && rule.endTime ? `${rule.startTime} - ${rule.endTime}` : "Any"}</td>
                <td>{rule.durationMinutes ? `${rule.durationMinutes} mins` : "Any"}</td>
                <td>
                  {Number(rule.basePrice)} {rule.currency}
                </td>
                <td>{rule.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: "2rem" }} className="card">
        <h2>Policy Notes</h2>
        <ul>
          <li>Pricing is applied deterministically by priority.</li>
          <li>Court-specific rules can override global rates when priority is higher.</li>
          <li>Existing confirmed bookings keep their stored total price even after rule changes.</li>
        </ul>
        <Link href="/booking" className="btn btn-primary">
          Book with these rates
        </Link>
      </section>
    </div>
  );
}
