import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/courts", label: "Courts" },
  { href: "/pricing", label: "Pricing" },
  { href: "/events", label: "Events" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" }
];

export async function Header() {
  const session = await getServerSession(authOptions);
  const accountHref = session?.user?.role === "admin" ? "/admin" : "/account";

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">SG</span>
          <span>Skymark GT</span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link href="/booking" className="btn btn-primary">
            Book Now
          </Link>
          {session?.user ? (
            <Link href={accountHref} className="btn btn-ghost">
              Account
            </Link>
          ) : (
            <Link href="/login" className="btn btn-ghost">
              Login
            </Link>
          )}
        </div>
      </div>
      <div className="mobile-book-now-wrap">
        <Link href="/booking" className="mobile-book-now">
          Book Now
        </Link>
      </div>
    </header>
  );
}
