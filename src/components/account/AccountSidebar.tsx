import Link from "next/link";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/bookings", label: "My Bookings" },
  { href: "/account/profile", label: "Profile" }
];

export function AccountSidebar() {
  return (
    <aside className="card">
      <h3>My Account</h3>
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
