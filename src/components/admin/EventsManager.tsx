"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/admin-api";

type EventRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  status: "upcoming" | "completed" | "cancelled";
  locationNote: string | null;
};

type EventForm = {
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  status: "upcoming" | "completed" | "cancelled";
  locationNote: string;
};

const EMPTY_FORM: EventForm = {
  title: "",
  slug: "",
  description: "",
  coverImageUrl: "",
  eventDate: new Date().toISOString().slice(0, 10),
  startTime: "19:00",
  endTime: "21:00",
  status: "upcoming",
  locationNote: ""
};

function toDateInput(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

function mapEvent(event: {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  eventDate: string | Date;
  startTime: string;
  endTime: string;
  status: "upcoming" | "completed" | "cancelled";
  locationNote: string | null;
}): EventRow {
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description,
    coverImageUrl: event.coverImageUrl,
    eventDate: toDateInput(event.eventDate),
    startTime: event.startTime,
    endTime: event.endTime,
    status: event.status,
    locationNote: event.locationNote
  };
}

function toForm(event: EventRow): EventForm {
  return {
    title: event.title,
    slug: event.slug,
    description: event.description,
    coverImageUrl: event.coverImageUrl ?? "",
    eventDate: event.eventDate,
    startTime: event.startTime,
    endTime: event.endTime,
    status: event.status,
    locationNote: event.locationNote ?? ""
  };
}

export function EventsManager({ initialEvents }: { initialEvents: EventRow[] }) {
  const router = useRouter();
  const [events, setEvents] = useState<EventRow[]>(initialEvents);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshEvents() {
    const data = await adminRequest<{
      events: Array<{
        id: string;
        title: string;
        slug: string;
        description: string;
        coverImageUrl: string | null;
        eventDate: string;
        startTime: string;
        endTime: string;
        status: "upcoming" | "completed" | "cancelled";
        locationNote: string | null;
      }>;
    }>("/api/admin/events");
    setEvents(data.events.map(mapEvent));
    router.refresh();
  }

  function beginEdit(event: EventRow) {
    setEditingEventId(event.id);
    setForm(toForm(event));
    setError(null);
    setMessage(null);
  }

  function resetForm() {
    setEditingEventId(null);
    setForm(EMPTY_FORM);
  }

  async function saveEvent(actionEvent: FormEvent<HTMLFormElement>) {
    actionEvent.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        cover_image_url: form.coverImageUrl.trim() || null,
        event_date: form.eventDate,
        start_time: form.startTime,
        end_time: form.endTime,
        status: form.status,
        location_note: form.locationNote.trim() || null
      };

      if (editingEventId) {
        await adminRequest(`/api/admin/events/${editingEventId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        setMessage("Event updated.");
      } else {
        await adminRequest("/api/admin/events", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setMessage("Event created.");
      }

      resetForm();
      await refreshEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save event");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(id: string) {
    if (!window.confirm("Delete this event?")) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await adminRequest(`/api/admin/events/${id}`, { method: "DELETE" });
      setMessage("Event deleted.");
      if (editingEventId === id) resetForm();
      await refreshEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete event");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="card">
      <h2>{editingEventId ? "Edit Event" : "Create Event"}</h2>
      <form className="form-grid" onSubmit={saveEvent}>
        <div>
          <label htmlFor="event-title">Title</label>
          <input
            id="event-title"
            value={form.title}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, title: event.target.value }))
            }
            required
          />
        </div>
        <div>
          <label htmlFor="event-slug">Slug</label>
          <input
            id="event-slug"
            value={form.slug}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, slug: event.target.value }))
            }
            required
          />
        </div>
        <div>
          <label htmlFor="event-date">Date</label>
          <input
            id="event-date"
            type="date"
            value={form.eventDate}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, eventDate: event.target.value }))
            }
            required
          />
        </div>
        <div>
          <label htmlFor="event-status">Status</label>
          <select
            id="event-status"
            value={form.status}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                status: event.target.value as "upcoming" | "completed" | "cancelled"
              }))
            }
          >
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label htmlFor="event-start">Start Time</label>
          <input
            id="event-start"
            type="time"
            value={form.startTime}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, startTime: event.target.value }))
            }
            required
          />
        </div>
        <div>
          <label htmlFor="event-end">End Time</label>
          <input
            id="event-end"
            type="time"
            value={form.endTime}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, endTime: event.target.value }))
            }
            required
          />
        </div>
        <div>
          <label htmlFor="event-image">Cover Image URL</label>
          <input
            id="event-image"
            value={form.coverImageUrl}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, coverImageUrl: event.target.value }))
            }
          />
        </div>
        <div>
          <label htmlFor="event-location">Location Note</label>
          <input
            id="event-location"
            value={form.locationNote}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, locationNote: event.target.value }))
            }
          />
        </div>
        <div className="full">
          <label htmlFor="event-description">Description</label>
          <textarea
            id="event-description"
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            required
          />
        </div>
        <div className="full actions">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : editingEventId ? "Update Event" : "Create Event"}
          </button>
          {editingEventId ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </form>

      {message ? <p style={{ color: "var(--success)" }}>{message}</p> : null}
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{event.title}</td>
                <td>{event.eventDate}</td>
                <td>
                  {event.startTime} - {event.endTime}
                </td>
                <td>{event.status}</td>
                <td>
                  <div className="actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => beginEdit(event)}
                      disabled={saving}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => deleteEvent(event.id)}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
