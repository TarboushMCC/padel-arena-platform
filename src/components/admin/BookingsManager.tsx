"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/admin-api";

type CourtOption = {
  id: string;
  name: string;
};

type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";
type PaymentStatus = "unpaid" | "paid" | "refunded" | "partial";

type BookingRow = {
  id: string;
  bookingReference: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  notes: string | null;
  totalPrice: number;
  courtId: string;
  courtName: string;
  customerName: string;
  customerEmail: string;
};

type BookingEdit = {
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  notes: string;
};

type RescheduleDraft = {
  newDate: string;
  newStartTime: string;
  newDuration: string;
};

type CreateForm = {
  courtId: string;
  bookingDate: string;
  startTime: string;
  durationMinutes: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  fullName: string;
  email: string;
  phone: string;
  notes: string;
};

type Filters = {
  date: string;
  status: string;
  courtId: string;
  search: string;
};

type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function toDateInput(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

function mapBooking(item: {
  id: string;
  bookingReference: string;
  bookingDate: string | Date;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  notes: string | null;
  totalPrice: string | number;
  court: { id: string; name: string };
  user?: { fullName: string; email: string } | null;
  guestName?: string | null;
  guestEmail?: string | null;
}): BookingRow {
  return {
    id: item.id,
    bookingReference: item.bookingReference,
    bookingDate: toDateInput(item.bookingDate),
    startTime: item.startTime,
    endTime: item.endTime,
    durationMinutes: item.durationMinutes,
    status: item.status,
    paymentStatus: item.paymentStatus,
    notes: item.notes,
    totalPrice: Number(item.totalPrice),
    courtId: item.court.id,
    courtName: item.court.name,
    customerName: item.user?.fullName ?? item.guestName ?? "Guest",
    customerEmail: item.user?.email ?? item.guestEmail ?? "-"
  };
}

export function BookingsManager({
  initialBookings,
  courts,
  initialPagination
}: {
  initialBookings: BookingRow[];
  courts: CourtOption[];
  initialPagination?: PaginationState;
}) {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRow[]>(initialBookings);
  const [filters, setFilters] = useState<Filters>({
    date: "",
    status: "",
    courtId: "",
    search: ""
  });
  const [pagination, setPagination] = useState<PaginationState>(
    initialPagination ?? {
      page: 1,
      pageSize: 20,
      total: initialBookings.length,
      totalPages: 1
    }
  );
  const [createForm, setCreateForm] = useState<CreateForm>({
    courtId: courts[0]?.id ?? "",
    bookingDate: toDateInput(new Date()),
    startTime: "18:00",
    durationMinutes: "90",
    status: "confirmed",
    paymentStatus: "unpaid",
    fullName: "",
    email: "",
    phone: "",
    notes: ""
  });
  const [rowEdits, setRowEdits] = useState<Record<string, BookingEdit>>(() =>
    Object.fromEntries(
      initialBookings.map((item) => [
        item.id,
        {
          status: item.status,
          paymentStatus: item.paymentStatus,
          notes: item.notes ?? ""
        }
      ])
    )
  );
  const [reschedules, setReschedules] = useState<Record<string, RescheduleDraft>>(
    () =>
      Object.fromEntries(
        initialBookings.map((item) => [
          item.id,
          {
            newDate: item.bookingDate,
            newStartTime: item.startTime,
            newDuration: String(item.durationMinutes)
          }
        ])
      )
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedCourts = useMemo(
    () => [...courts].sort((a, b) => a.name.localeCompare(b.name)),
    [courts]
  );

  function initializeDrafts(items: BookingRow[]) {
    setRowEdits(
      Object.fromEntries(
        items.map((item) => [
          item.id,
          {
            status: item.status,
            paymentStatus: item.paymentStatus,
            notes: item.notes ?? ""
          }
        ])
      )
    );
    setReschedules(
      Object.fromEntries(
        items.map((item) => [
          item.id,
          {
            newDate: item.bookingDate,
            newStartTime: item.startTime,
            newDuration: String(item.durationMinutes)
          }
        ])
      )
    );
  }

  async function refreshBookings(options?: {
    filters?: Filters;
    page?: number;
    pageSize?: number;
  }) {
    const activeFilters = options?.filters ?? filters;
    const nextPage = options?.page ?? pagination.page;
    const nextPageSize = options?.pageSize ?? pagination.pageSize;

    const params = new URLSearchParams();
    if (activeFilters.date) params.set("date", activeFilters.date);
    if (activeFilters.status) params.set("status", activeFilters.status);
    if (activeFilters.courtId) params.set("court_id", activeFilters.courtId);
    if (activeFilters.search) params.set("search", activeFilters.search);
    params.set("page", String(nextPage));
    params.set("page_size", String(nextPageSize));

    const data = await adminRequest<{
      bookings: Array<{
        id: string;
        bookingReference: string;
        bookingDate: string;
        startTime: string;
        endTime: string;
        durationMinutes: number;
        status: BookingStatus;
        paymentStatus: PaymentStatus;
        notes: string | null;
        totalPrice: string | number;
        court: { id: string; name: string };
        user?: { fullName: string; email: string } | null;
        guestName?: string | null;
        guestEmail?: string | null;
      }>;
      pagination: {
        page: number;
        page_size: number;
        total: number;
        total_pages: number;
      };
    }>(`/api/admin/bookings?${params.toString()}`);

    const mapped = data.bookings.map(mapBooking);
    setBookings(mapped);
    initializeDrafts(mapped);
    setPagination({
      page: data.pagination.page,
      pageSize: data.pagination.page_size,
      total: data.pagination.total,
      totalPages: data.pagination.total_pages
    });
    router.refresh();
  }

  async function withAction(action: () => Promise<void>, successText: string) {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await action();
      setMessage(successText);
      await refreshBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  async function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await refreshBookings({ filters, page: 1 });
      setMessage("Filters applied.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load bookings");
    } finally {
      setLoading(false);
    }
  }

  async function clearFilters() {
    const reset: Filters = { date: "", status: "", courtId: "", search: "" };
    setFilters(reset);
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await refreshBookings({ filters: reset, page: 1 });
      setMessage("Filters cleared.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load bookings");
    } finally {
      setLoading(false);
    }
  }

  async function changePage(page: number) {
    const bounded = Math.max(1, Math.min(page, pagination.totalPages));
    if (bounded === pagination.page) return;

    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await refreshBookings({ page: bounded });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change page");
    } finally {
      setLoading(false);
    }
  }

  async function changePageSize(pageSize: number) {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await refreshBookings({ page: 1, pageSize });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change page size");
    } finally {
      setLoading(false);
    }
  }

  async function createBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await withAction(async () => {
      await adminRequest("/api/admin/bookings", {
        method: "POST",
        body: JSON.stringify({
          court_id: createForm.courtId,
          booking_date: createForm.bookingDate,
          start_time: createForm.startTime,
          duration_minutes: Number(createForm.durationMinutes),
          status: createForm.status,
          payment_status: createForm.paymentStatus,
          full_name: createForm.fullName || null,
          email: createForm.email || null,
          phone: createForm.phone || null,
          notes: createForm.notes || null
        })
      });
      setCreateForm((prev) => ({
        ...prev,
        fullName: "",
        email: "",
        phone: "",
        notes: ""
      }));
      await refreshBookings({ page: 1 });
    }, "Booking created.");
  }

  async function saveBooking(id: string) {
    const draft = rowEdits[id];
    if (!draft) return;

    await withAction(async () => {
      await adminRequest(`/api/admin/bookings/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: draft.status,
          payment_status: draft.paymentStatus,
          notes: draft.notes || null
        })
      });
    }, "Booking updated.");
  }

  async function cancelBooking(id: string) {
    if (!window.confirm("Cancel this booking?")) return;
    await withAction(async () => {
      await adminRequest(`/api/admin/bookings/${id}/cancel`, { method: "POST" });
    }, "Booking cancelled.");
  }

  async function rescheduleBooking(id: string) {
    const draft = reschedules[id];
    if (!draft) return;

    await withAction(async () => {
      await adminRequest(`/api/admin/bookings/${id}/reschedule`, {
        method: "POST",
        body: JSON.stringify({
          new_date: draft.newDate,
          new_start_time: draft.newStartTime,
          new_duration: Number(draft.newDuration)
        })
      });
    }, "Booking rescheduled.");
  }

  const from = pagination.total
    ? (pagination.page - 1) * pagination.pageSize + 1
    : 0;
  const to = pagination.total
    ? Math.min(pagination.page * pagination.pageSize, pagination.total)
    : 0;

  return (
    <>
      <article className="card">
        <h2>Filter Bookings</h2>
        <form className="form-grid" onSubmit={applyFilters}>
          <div>
            <label htmlFor="booking-filter-date">Date</label>
            <input
              id="booking-filter-date"
              type="date"
              value={filters.date}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, date: event.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="booking-filter-status">Status</label>
            <select
              id="booking-filter-status"
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, status: event.target.value }))
              }
            >
              <option value="">Any</option>
              <option value="pending">pending</option>
              <option value="confirmed">confirmed</option>
              <option value="cancelled">cancelled</option>
              <option value="completed">completed</option>
              <option value="no_show">no_show</option>
            </select>
          </div>
          <div>
            <label htmlFor="booking-filter-court">Court</label>
            <select
              id="booking-filter-court"
              value={filters.courtId}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, courtId: event.target.value }))
              }
            >
              <option value="">Any</option>
              {sortedCourts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="booking-filter-search">Search</label>
            <input
              id="booking-filter-search"
              placeholder="Reference, customer name, email"
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="booking-page-size">Rows Per Page</label>
            <select
              id="booking-page-size"
              value={pagination.pageSize}
              onChange={(event) => void changePageSize(Number(event.target.value))}
              disabled={loading}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="actions" style={{ alignItems: "end" }}>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Loading..." : "Apply Filters"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => void clearFilters()}
              disabled={loading}
            >
              Clear
            </button>
          </div>
        </form>
      </article>

      <article className="card">
        <h2>Create Manual Booking</h2>
        <form className="form-grid" onSubmit={createBooking}>
          <div>
            <label htmlFor="booking-create-court">Court</label>
            <select
              id="booking-create-court"
              value={createForm.courtId}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, courtId: event.target.value }))
              }
              required
            >
              {sortedCourts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="booking-create-date">Date</label>
            <input
              id="booking-create-date"
              type="date"
              value={createForm.bookingDate}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  bookingDate: event.target.value
                }))
              }
              required
            />
          </div>
          <div>
            <label htmlFor="booking-create-start">Start Time</label>
            <input
              id="booking-create-start"
              type="time"
              value={createForm.startTime}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, startTime: event.target.value }))
              }
              required
            />
          </div>
          <div>
            <label htmlFor="booking-create-duration">Duration (minutes)</label>
            <input
              id="booking-create-duration"
              type="number"
              min={30}
              step={30}
              value={createForm.durationMinutes}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  durationMinutes: event.target.value
                }))
              }
              required
            />
          </div>
          <div>
            <label htmlFor="booking-create-status">Status</label>
            <select
              id="booking-create-status"
              value={createForm.status}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  status: event.target.value as BookingStatus
                }))
              }
            >
              <option value="pending">pending</option>
              <option value="confirmed">confirmed</option>
              <option value="cancelled">cancelled</option>
              <option value="completed">completed</option>
              <option value="no_show">no_show</option>
            </select>
          </div>
          <div>
            <label htmlFor="booking-create-payment">Payment</label>
            <select
              id="booking-create-payment"
              value={createForm.paymentStatus}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  paymentStatus: event.target.value as PaymentStatus
                }))
              }
            >
              <option value="unpaid">unpaid</option>
              <option value="paid">paid</option>
              <option value="partial">partial</option>
              <option value="refunded">refunded</option>
            </select>
          </div>
          <div>
            <label htmlFor="booking-create-name">Guest Name</label>
            <input
              id="booking-create-name"
              value={createForm.fullName}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="booking-create-email">Guest Email</label>
            <input
              id="booking-create-email"
              type="email"
              value={createForm.email}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, email: event.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="booking-create-phone">Guest Phone</label>
            <input
              id="booking-create-phone"
              value={createForm.phone}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, phone: event.target.value }))
              }
            />
          </div>
          <div className="full">
            <label htmlFor="booking-create-notes">Notes</label>
            <textarea
              id="booking-create-notes"
              value={createForm.notes}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </div>
          <div className="full actions">
            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Create Booking"}
            </button>
          </div>
        </form>
      </article>

      <article className="card">
        <h2>Bookings</h2>
        {message ? <p style={{ color: "var(--success)" }}>{message}</p> : null}
        {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

        <div className="pagination" style={{ marginBottom: "0.8rem" }}>
          <span>
            Showing {from}-{to} of {pagination.total}
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void changePage(pagination.page - 1)}
            disabled={loading || pagination.page <= 1}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void changePage(pagination.page + 1)}
            disabled={loading || pagination.page >= pagination.totalPages}
          >
            Next
          </button>
        </div>

        <div className="admin-list">
          {bookings.length === 0 ? (
            <p>No bookings found for the selected filters.</p>
          ) : null}
          {bookings.map((booking) => {
            const edit = rowEdits[booking.id] ?? {
              status: booking.status,
              paymentStatus: booking.paymentStatus,
              notes: booking.notes ?? ""
            };
            const reschedule = reschedules[booking.id] ?? {
              newDate: booking.bookingDate,
              newStartTime: booking.startTime,
              newDuration: String(booking.durationMinutes)
            };

            return (
              <div key={booking.id} className="admin-item">
                <div className="admin-item-head">
                  <strong>{booking.bookingReference}</strong>
                  <span className="badge">{booking.status}</span>
                </div>

                <div className="admin-item-grid">
                  <div>
                    <strong>Customer</strong>
                    <p style={{ margin: "0.25rem 0 0" }}>
                      {booking.customerName}
                      <br />
                      <small>{booking.customerEmail}</small>
                    </p>
                  </div>
                  <div>
                    <strong>Court</strong>
                    <p style={{ margin: "0.25rem 0 0" }}>{booking.courtName}</p>
                  </div>
                  <div>
                    <strong>Schedule</strong>
                    <p style={{ margin: "0.25rem 0 0" }}>
                      {booking.bookingDate}
                      <br />
                      {booking.startTime} - {booking.endTime}
                    </p>
                  </div>
                  <div>
                    <label htmlFor={`status-${booking.id}`}>Status</label>
                    <select
                      id={`status-${booking.id}`}
                      value={edit.status}
                      onChange={(event) =>
                        setRowEdits((prev) => ({
                          ...prev,
                          [booking.id]: {
                            ...edit,
                            status: event.target.value as BookingStatus
                          }
                        }))
                      }
                    >
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="cancelled">cancelled</option>
                      <option value="completed">completed</option>
                      <option value="no_show">no_show</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`payment-${booking.id}`}>Payment</label>
                    <select
                      id={`payment-${booking.id}`}
                      value={edit.paymentStatus}
                      onChange={(event) =>
                        setRowEdits((prev) => ({
                          ...prev,
                          [booking.id]: {
                            ...edit,
                            paymentStatus: event.target.value as PaymentStatus
                          }
                        }))
                      }
                    >
                      <option value="unpaid">unpaid</option>
                      <option value="paid">paid</option>
                      <option value="partial">partial</option>
                      <option value="refunded">refunded</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`notes-${booking.id}`}>Notes</label>
                    <input
                      id={`notes-${booking.id}`}
                      value={edit.notes}
                      onChange={(event) =>
                        setRowEdits((prev) => ({
                          ...prev,
                          [booking.id]: {
                            ...edit,
                            notes: event.target.value
                          }
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor={`new-date-${booking.id}`}>New Date</label>
                    <input
                      id={`new-date-${booking.id}`}
                      type="date"
                      value={reschedule.newDate}
                      onChange={(event) =>
                        setReschedules((prev) => ({
                          ...prev,
                          [booking.id]: {
                            ...reschedule,
                            newDate: event.target.value
                          }
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor={`new-start-${booking.id}`}>New Start</label>
                    <input
                      id={`new-start-${booking.id}`}
                      type="time"
                      value={reschedule.newStartTime}
                      onChange={(event) =>
                        setReschedules((prev) => ({
                          ...prev,
                          [booking.id]: {
                            ...reschedule,
                            newStartTime: event.target.value
                          }
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor={`new-duration-${booking.id}`}>New Duration</label>
                    <input
                      id={`new-duration-${booking.id}`}
                      type="number"
                      min={30}
                      step={30}
                      value={reschedule.newDuration}
                      onChange={(event) =>
                        setReschedules((prev) => ({
                          ...prev,
                          [booking.id]: {
                            ...reschedule,
                            newDuration: event.target.value
                          }
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="actions" style={{ marginTop: "0.6rem" }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => void saveBooking(booking.id)}
                    disabled={loading}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => void rescheduleBooking(booking.id)}
                    disabled={loading}
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => void cancelBooking(booking.id)}
                    disabled={loading || booking.status === "cancelled"}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </article>
    </>
  );
}
