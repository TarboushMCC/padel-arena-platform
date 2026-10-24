"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BookingRow = {
  id: string;
  bookingReference: string;
  courtName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
};

export function BookingsManager({ bookings }: { bookings: BookingRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { upcoming, history } = useMemo(() => {
    const now = new Date();
    const up: BookingRow[] = [];
    const old: BookingRow[] = [];

    for (const booking of bookings) {
      const date = new Date(booking.bookingDate);
      if (date >= now) up.push(booking);
      else old.push(booking);
    }

    return { upcoming: up, history: old };
  }, [bookings]);

  async function cancelBooking(id: string) {
    setLoadingId(id);
    setError(null);

    const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoadingId(null);

    if (!res.ok) {
      setError(data.error || "Could not cancel booking");
      return;
    }

    router.refresh();
  }

  async function rescheduleBooking(id: string) {
    const newDate = window.prompt("Enter new date (YYYY-MM-DD)");
    if (!newDate) return;
    const newStartTime = window.prompt("Enter new start time (HH:MM)", "18:00");
    if (!newStartTime) return;
    const newDuration = window.prompt("Enter duration in minutes", "90");
    if (!newDuration) return;

    setLoadingId(id);
    setError(null);

    const res = await fetch(`/api/bookings/${id}/reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        new_date: newDate,
        new_start_time: newStartTime,
        new_duration: Number(newDuration)
      })
    });

    const data = await res.json().catch(() => ({}));
    setLoadingId(null);

    if (!res.ok) {
      setError(data.error || "Could not reschedule booking");
      return;
    }

    router.refresh();
  }

  return (
    <>
      <article className="card">
        <h2>Upcoming Bookings</h2>
        {upcoming.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Court</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.bookingReference}</td>
                    <td>{booking.courtName}</td>
                    <td>{booking.bookingDate}</td>
                    <td>
                      {booking.startTime} - {booking.endTime}
                    </td>
                    <td>{booking.status}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-ghost" onClick={() => cancelBooking(booking.id)} disabled={loadingId === booking.id}>
                          Cancel
                        </button>
                        <button className="btn btn-ghost" onClick={() => rescheduleBooking(booking.id)} disabled={loadingId === booking.id}>
                          Reschedule
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No upcoming bookings.</p>
        )}
      </article>

      <article className="card">
        <h2>Booking History</h2>
        {history.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Court</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.bookingReference}</td>
                    <td>{booking.courtName}</td>
                    <td>{booking.bookingDate}</td>
                    <td>{booking.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No booking history yet.</p>
        )}
      </article>

      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
    </>
  );
}
