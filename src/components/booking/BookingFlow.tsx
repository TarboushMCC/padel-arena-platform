"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

type Slot = {
  courtId: string;
  courtName: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  currency: string;
};

export function BookingFlow() {
  const router = useRouter();
  const search = useSearchParams();
  const { data: session } = useSession();

  const [date, setDate] = useState(search.get("date") || "");
  const [duration, setDuration] = useState(search.get("duration") || "90");
  const [startTime, setStartTime] = useState(search.get("time") || "");
  const [courtType, setCourtType] = useState(search.get("court_type") || "");
  const [locationType, setLocationType] = useState("");

  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMode, setPaymentMode] = useState<"stripe" | "venue">("stripe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      setFullName(session.user.name || "");
      setEmail(session.user.email || "");
      setPhone(session.user.phone || "");
    }
  }, [session]);

  const nowDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  async function searchAvailability() {
    setLoading(true);
    setError(null);
    setSelectedSlot(null);
    setHoldId(null);

    const params = new URLSearchParams({
      date,
      duration_minutes: duration
    });

    if (startTime) params.set("start_time", startTime);
    if (courtType) params.set("court_type", courtType);
    if (locationType) params.set("location_type", locationType);

    const res = await fetch(`/api/availability?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setSlots([]);
      setError(data.error || "Could not fetch availability");
      return;
    }

    setSlots(data.slots || []);
  }

  async function selectSlot(slot: Slot) {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/bookings/hold", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        court_id: slot.courtId,
        booking_date: date,
        start_time: slot.startTime,
        duration_minutes: Number(duration)
      })
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Selected slot is no longer available");
      return;
    }

    setSelectedSlot(slot);
    setHoldId(data.hold_id);
    setHoldExpiresAt(data.expires_at);
  }

  async function submitBooking(event: React.FormEvent) {
    event.preventDefault();
    if (!holdId || !selectedSlot) {
      setError("Please select a slot first.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hold_id: holdId,
        full_name: fullName,
        email,
        phone,
        notes,
        payment_mode: paymentMode
      })
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Booking failed");
      return;
    }

    if (data.checkout_url) {
      window.location.href = data.checkout_url;
      return;
    }

    router.push(`/booking/success?reference=${encodeURIComponent(data.booking_reference)}`);
  }

  return (
    <div className="grid" style={{ gap: "1.2rem" }}>
      <section className="card">
        <h2>Search Availability</h2>
        <div className="form-grid">
          <div>
            <label htmlFor="book-date">Date</label>
            <input id="book-date" type="date" min={nowDate} value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          <div>
            <label htmlFor="book-duration">Duration</label>
            <select id="book-duration" value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option value="60">60 mins</option>
              <option value="90">90 mins</option>
              <option value="120">120 mins</option>
            </select>
          </div>

          <div>
            <label htmlFor="book-start-time">Preferred Start Time</label>
            <input id="book-start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>

          <div>
            <label htmlFor="book-court-type">Court Type</label>
            <input id="book-court-type" value={courtType} onChange={(e) => setCourtType(e.target.value)} placeholder="Any" />
          </div>

          <div>
            <label htmlFor="book-location">Indoor / Outdoor</label>
            <select id="book-location" value={locationType} onChange={(e) => setLocationType(e.target.value)}>
              <option value="">Any</option>
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
            </select>
          </div>

          <div className="actions full">
            <button className="btn btn-primary" onClick={searchAvailability} disabled={loading || !date} type="button">
              {loading ? "Loading..." : "Search Slots"}
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Availability Results</h2>
        {slots.length ? (
          <div className="grid grid-3">
            {slots.map((slot) => (
              <button
                key={`${slot.courtId}-${slot.startTime}`}
                className="card"
                type="button"
                onClick={() => selectSlot(slot)}
                style={{ textAlign: "left", cursor: "pointer" }}
              >
                <strong>{slot.courtName}</strong>
                <p>
                  {slot.startTime} - {slot.endTime}
                </p>
                <p>
                  {slot.totalPrice} {slot.currency}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <p>No slots found yet. Use filters and search.</p>
        )}
      </section>

      <section className="card">
        <h2>Booking Summary</h2>
        {selectedSlot ? (
          <>
            <p>
              <strong>Court:</strong> {selectedSlot.courtName}
            </p>
            <p>
              <strong>Date:</strong> {date}
            </p>
            <p>
              <strong>Time:</strong> {selectedSlot.startTime} - {selectedSlot.endTime}
            </p>
            <p>
              <strong>Duration:</strong> {duration} mins
            </p>
            <p>
              <strong>Total:</strong> {selectedSlot.totalPrice} {selectedSlot.currency}
            </p>
            {holdExpiresAt ? <p className="badge">Hold expires at: {new Date(holdExpiresAt).toLocaleTimeString()}</p> : null}
          </>
        ) : (
          <p>Select a slot to continue.</p>
        )}
      </section>

      <section className="card">
        <h2>Customer Details & Payment</h2>
        <form onSubmit={submitBooking} className="form-grid">
          {!session?.user ? (
            <div className="full">
              <p>
                Have an account? <Link href="/login">Login</Link>
              </p>
            </div>
          ) : null}

          <div>
            <label htmlFor="book-full-name">Full Name</label>
            <input id="book-full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div>
            <label htmlFor="book-email">Email</label>
            <input id="book-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div>
            <label htmlFor="book-phone">Phone</label>
            <input id="book-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <div>
            <label htmlFor="book-payment">Payment Mode</label>
            <select
              id="book-payment"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as "stripe" | "venue")}
            >
              <option value="stripe">Online payment (Stripe)</option>
              <option value="venue">Reserve now, pay at venue</option>
            </select>
          </div>

          <div className="full">
            <label htmlFor="book-notes">Notes</label>
            <textarea id="book-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="full actions">
            <button className="btn btn-primary" disabled={loading || !selectedSlot || !holdId}>
              {loading ? "Confirming..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </section>

      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
    </div>
  );
}
