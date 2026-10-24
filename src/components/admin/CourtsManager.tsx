"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/admin-api";

type CourtRow = {
  id: string;
  name: string;
  slug: string;
  courtType: string;
  locationType: "indoor" | "outdoor";
  description: string;
  imageUrl: string | null;
  status: "active" | "inactive" | "maintenance";
};

type BlockedSlotRow = {
  id: string;
  courtId: string;
  courtName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  reason: string;
};

type CourtForm = {
  name: string;
  slug: string;
  courtType: string;
  locationType: "indoor" | "outdoor";
  description: string;
  imageUrl: string;
  status: "active" | "inactive" | "maintenance";
};

type BlockedSlotForm = {
  courtId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  reason: string;
};

const EMPTY_COURT_FORM: CourtForm = {
  name: "",
  slug: "",
  courtType: "",
  locationType: "indoor",
  description: "",
  imageUrl: "",
  status: "active"
};

function toDateInput(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

function mapBlockedSlot(slot: {
  id: string;
  courtId: string;
  bookingDate: string | Date;
  startTime: string;
  endTime: string;
  reason: string;
  court?: { name: string };
}): BlockedSlotRow {
  return {
    id: slot.id,
    courtId: slot.courtId,
    courtName: slot.court?.name ?? "Unknown",
    bookingDate: toDateInput(slot.bookingDate),
    startTime: slot.startTime,
    endTime: slot.endTime,
    reason: slot.reason
  };
}

export function CourtsManager({
  initialCourts,
  initialBlockedSlots
}: {
  initialCourts: CourtRow[];
  initialBlockedSlots: BlockedSlotRow[];
}) {
  const router = useRouter();
  const [courts, setCourts] = useState<CourtRow[]>(initialCourts);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlotRow[]>(
    initialBlockedSlots
  );
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [courtForm, setCourtForm] = useState<CourtForm>(EMPTY_COURT_FORM);
  const [slotForm, setSlotForm] = useState<BlockedSlotForm>({
    courtId: initialCourts[0]?.id ?? "",
    bookingDate: toDateInput(new Date()),
    startTime: "18:00",
    endTime: "19:30",
    reason: "Maintenance"
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedCourts = useMemo(
    () => [...courts].sort((a, b) => a.name.localeCompare(b.name)),
    [courts]
  );

  async function refreshCourts() {
    const data = await adminRequest<{ courts: CourtRow[] }>("/api/admin/courts");
    setCourts(data.courts);
  }

  async function refreshBlocked() {
    const data = await adminRequest<{
      blocked_slots: Array<{
        id: string;
        courtId: string;
        bookingDate: string;
        startTime: string;
        endTime: string;
        reason: string;
        court: { name: string };
      }>;
    }>("/api/admin/blocked-slots");
    setBlockedSlots(data.blocked_slots.map(mapBlockedSlot));
  }

  async function refreshAll() {
    await Promise.all([refreshCourts(), refreshBlocked()]);
    router.refresh();
  }

  function beginEdit(court: CourtRow) {
    setEditingCourtId(court.id);
    setCourtForm({
      name: court.name,
      slug: court.slug,
      courtType: court.courtType,
      locationType: court.locationType,
      description: court.description,
      imageUrl: court.imageUrl ?? "",
      status: court.status
    });
    setMessage(null);
    setError(null);
  }

  function resetCourtForm() {
    setEditingCourtId(null);
    setCourtForm(EMPTY_COURT_FORM);
  }

  async function submitCourt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        name: courtForm.name,
        slug: courtForm.slug,
        court_type: courtForm.courtType,
        location_type: courtForm.locationType,
        description: courtForm.description,
        image_url: courtForm.imageUrl.trim() || null,
        status: courtForm.status
      };

      if (editingCourtId) {
        await adminRequest(`/api/admin/courts/${editingCourtId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        setMessage("Court updated.");
      } else {
        await adminRequest("/api/admin/courts", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setMessage("Court created.");
      }

      resetCourtForm();
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save court");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateCourt(id: string) {
    if (!window.confirm("Deactivate this court?")) return;

    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await adminRequest(`/api/admin/courts/${id}`, { method: "DELETE" });
      setMessage("Court deactivated.");
      if (editingCourtId === id) {
        resetCourtForm();
      }
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not deactivate court");
    } finally {
      setSaving(false);
    }
  }

  async function createBlockedSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await adminRequest("/api/admin/blocked-slots", {
        method: "POST",
        body: JSON.stringify({
          court_id: slotForm.courtId,
          booking_date: slotForm.bookingDate,
          start_time: slotForm.startTime,
          end_time: slotForm.endTime,
          reason: slotForm.reason
        })
      });
      setMessage("Blocked slot added.");
      await refreshBlocked();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create blocked slot"
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteBlockedSlot(id: string) {
    if (!window.confirm("Delete this blocked slot?")) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await adminRequest(`/api/admin/blocked-slots/${id}`, { method: "DELETE" });
      setMessage("Blocked slot removed.");
      await refreshBlocked();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete blocked slot"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <article className="card">
        <h2>{editingCourtId ? "Edit Court" : "Create Court"}</h2>
        <form className="form-grid" onSubmit={submitCourt}>
          <div>
            <label htmlFor="court-name">Name</label>
            <input
              id="court-name"
              value={courtForm.name}
              onChange={(event) =>
                setCourtForm((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
          </div>
          <div>
            <label htmlFor="court-slug">Slug</label>
            <input
              id="court-slug"
              value={courtForm.slug}
              onChange={(event) =>
                setCourtForm((prev) => ({ ...prev, slug: event.target.value }))
              }
              required
            />
          </div>
          <div>
            <label htmlFor="court-type">Court Type</label>
            <input
              id="court-type"
              value={courtForm.courtType}
              onChange={(event) =>
                setCourtForm((prev) => ({
                  ...prev,
                  courtType: event.target.value
                }))
              }
              required
            />
          </div>
          <div>
            <label htmlFor="court-location">Location</label>
            <select
              id="court-location"
              value={courtForm.locationType}
              onChange={(event) =>
                setCourtForm((prev) => ({
                  ...prev,
                  locationType: event.target.value as "indoor" | "outdoor"
                }))
              }
            >
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
            </select>
          </div>
          <div>
            <label htmlFor="court-status">Status</label>
            <select
              id="court-status"
              value={courtForm.status}
              onChange={(event) =>
                setCourtForm((prev) => ({
                  ...prev,
                  status: event.target.value as
                    | "active"
                    | "inactive"
                    | "maintenance"
                }))
              }
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label htmlFor="court-image">Image URL</label>
            <input
              id="court-image"
              value={courtForm.imageUrl}
              onChange={(event) =>
                setCourtForm((prev) => ({ ...prev, imageUrl: event.target.value }))
              }
            />
          </div>
          <div className="full">
            <label htmlFor="court-description">Description</label>
            <textarea
              id="court-description"
              value={courtForm.description}
              onChange={(event) =>
                setCourtForm((prev) => ({
                  ...prev,
                  description: event.target.value
                }))
              }
              required
            />
          </div>
          <div className="full actions">
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : editingCourtId ? "Update Court" : "Create Court"}
            </button>
            {editingCourtId ? (
              <button
                className="btn btn-ghost"
                type="button"
                onClick={resetCourtForm}
                disabled={saving}
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
        {message ? <p style={{ color: "var(--success)" }}>{message}</p> : null}
        {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      </article>

      <article className="card">
        <h2>Courts</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Type</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCourts.map((court) => (
                <tr key={court.id}>
                  <td>{court.name}</td>
                  <td>{court.slug}</td>
                  <td>{court.courtType}</td>
                  <td>{court.locationType}</td>
                  <td>{court.status}</td>
                  <td>
                    <div className="actions">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => beginEdit(court)}
                        disabled={saving}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => deactivateCourt(court.id)}
                        disabled={saving || court.status === "inactive"}
                      >
                        Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="card">
        <h2>Blocked Maintenance Slots</h2>
        <form className="form-grid" onSubmit={createBlockedSlot}>
          <div>
            <label htmlFor="blocked-court">Court</label>
            <select
              id="blocked-court"
              value={slotForm.courtId}
              onChange={(event) =>
                setSlotForm((prev) => ({ ...prev, courtId: event.target.value }))
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
            <label htmlFor="blocked-date">Date</label>
            <input
              id="blocked-date"
              type="date"
              value={slotForm.bookingDate}
              onChange={(event) =>
                setSlotForm((prev) => ({ ...prev, bookingDate: event.target.value }))
              }
              required
            />
          </div>
          <div>
            <label htmlFor="blocked-start">Start</label>
            <input
              id="blocked-start"
              type="time"
              value={slotForm.startTime}
              onChange={(event) =>
                setSlotForm((prev) => ({ ...prev, startTime: event.target.value }))
              }
              required
            />
          </div>
          <div>
            <label htmlFor="blocked-end">End</label>
            <input
              id="blocked-end"
              type="time"
              value={slotForm.endTime}
              onChange={(event) =>
                setSlotForm((prev) => ({ ...prev, endTime: event.target.value }))
              }
              required
            />
          </div>
          <div className="full">
            <label htmlFor="blocked-reason">Reason</label>
            <input
              id="blocked-reason"
              value={slotForm.reason}
              onChange={(event) =>
                setSlotForm((prev) => ({ ...prev, reason: event.target.value }))
              }
              required
            />
          </div>
          <div className="full actions">
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Add Blocked Slot"}
            </button>
          </div>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Court</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blockedSlots.map((slot) => (
                <tr key={slot.id}>
                  <td>{slot.courtName}</td>
                  <td>{slot.bookingDate}</td>
                  <td>
                    {slot.startTime} - {slot.endTime}
                  </td>
                  <td>{slot.reason}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => deleteBlockedSlot(slot.id)}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}
