import Link from "next/link";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/courts", label: "Courts" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/faq", label: "FAQ" },
  { href: "/admin/contacts", label: "Contacts" },
  { href: "/admin/settings", label: "Settings" }
];

export function AdminNav() {
  return (
    <aside className="card admin-nav">
      <h3>Admin</h3>
      <nav className="grid" style={{ gap: "0.45rem" }}>
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="btn btn-ghost" style={{ justifyContent: "flex-start" }}>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
