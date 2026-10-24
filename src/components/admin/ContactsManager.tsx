"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/admin-api";

type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

function toDateTime(value: string) {
  return new Date(value).toLocaleString();
}

export function ContactsManager({
  initialMessages
}: {
  initialMessages: ContactMessageRow[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessageRow[]>(initialMessages);
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshMessages(nextDate?: string) {
    const date = nextDate ?? dateFilter;
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    const data = await adminRequest<{ messages: ContactMessageRow[] }>(
      `/api/admin/contact-messages${query}`
    );
    setMessages(data.messages);
    router.refresh();
  }

  async function applyFilter() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await refreshMessages(dateFilter);
      setMessage("Messages refreshed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load messages");
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await adminRequest(`/api/admin/contact-messages/${id}/read`, {
        method: "PUT"
      });
      setMessage("Message marked as read.");
      await refreshMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update message");
    } finally {
      setLoading(false);
    }
  }

  async function deleteMessage(id: string) {
    if (!window.confirm("Delete this message?")) return;
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await adminRequest(`/api/admin/contact-messages/${id}`, { method: "DELETE" });
      setMessage("Message deleted.");
      await refreshMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="card">
      <h2>Contact Inbox</h2>
      <div className="form-grid">
        <div>
          <label htmlFor="contact-date-filter">From Date</label>
          <input
            id="contact-date-filter"
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          />
        </div>
        <div className="actions" style={{ alignItems: "end" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={applyFilter}
            disabled={loading}
          >
            {loading ? "Loading..." : "Apply Filter"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setDateFilter("");
              setLoading(true);
              setMessage(null);
              setError(null);
              void (async () => {
                try {
                  await refreshMessages("");
                  setMessage("Messages refreshed.");
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Could not load messages"
                  );
                } finally {
                  setLoading(false);
                }
              })();
            }}
            disabled={loading}
          >
            Clear
          </button>
        </div>
      </div>

      {message ? <p style={{ color: "var(--success)" }}>{message}</p> : null}
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Read</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((item) => (
              <tr key={item.id}>
                <td>{toDateTime(item.createdAt)}</td>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>{item.phone ?? "-"}</td>
                <td>{item.subject ?? "-"}</td>
                <td>{item.message}</td>
                <td>{item.isRead ? "Yes" : "No"}</td>
                <td>
                  <div className="actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => markRead(item.id)}
                      disabled={loading || item.isRead}
                    >
                      Mark Read
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => deleteMessage(item.id)}
                      disabled={loading}
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
