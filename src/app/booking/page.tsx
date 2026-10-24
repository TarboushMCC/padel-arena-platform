import { BookingFlow } from "@/components/booking/BookingFlow";

export default function BookingPage() {
  return (
    <div className="page container">
      <section className="hero">
        <h1>Booking</h1>
        <p>Select your date, compare available slots, and complete booking with transparent pricing.</p>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <BookingFlow />
      </section>
    </div>
  );
}
