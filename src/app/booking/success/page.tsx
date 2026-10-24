import Link from "next/link";

export default function BookingSuccessPage({ searchParams }: { searchParams: { reference?: string } }) {
  return (
    <div className="page container">
      <section className="hero">
        <h1>Booking Confirmed</h1>
        <p>Your booking was created successfully.</p>
      </section>

      <section style={{ marginTop: "2rem" }} className="card">
        <h2>Reference</h2>
        <p className="badge">{searchParams.reference || "Pending reference"}</p>
        <p>You will also receive confirmation by email.</p>
        <div className="actions">
          <Link href="/account/bookings" className="btn btn-primary">
            View My Bookings
          </Link>
          <Link href="/booking" className="btn btn-ghost">
            Book Another Slot
          </Link>
        </div>
      </section>
    </div>
  );
}
