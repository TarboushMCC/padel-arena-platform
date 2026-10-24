"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/admin-api";

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  isPublished: boolean;
};

type FaqForm = {
  question: string;
  answer: string;
  category: string;
  displayOrder: string;
  isPublished: boolean;
};

const EMPTY_FORM: FaqForm = {
  question: "",
  answer: "",
  category: "General",
  displayOrder: "0",
  isPublished: true
};

function toForm(item: FaqRow): FaqForm {
  return {
    question: item.question,
    answer: item.answer,
    category: item.category,
    displayOrder: String(item.displayOrder),
    isPublished: item.isPublished
  };
}

export function FaqManager({ initialFaq }: { initialFaq: FaqRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState<FaqRow[]>(initialFaq);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FaqForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshFaq() {
    const data = await adminRequest<{ faq_items: FaqRow[] }>("/api/admin/faq");
    setItems(data.faq_items);
    router.refresh();
  }

  function beginEdit(item: FaqRow) {
    setEditingId(item.id);
    setForm(toForm(item));
    setMessage(null);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function saveFaq(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        question: form.question,
        answer: form.answer,
        category: form.category,
        display_order: Number(form.displayOrder || 0),
        is_published: form.isPublished
      };

      if (editingId) {
        await adminRequest(`/api/admin/faq/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        setMessage("FAQ item updated.");
      } else {
        await adminRequest("/api/admin/faq", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setMessage("FAQ item created.");
      }

      resetForm();
      await refreshFaq();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save FAQ item");
    } finally {
      setSaving(false);
    }
  }

  async function deleteFaq(id: string) {
    if (!window.confirm("Delete this FAQ item?")) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await adminRequest(`/api/admin/faq/${id}`, { method: "DELETE" });
      setMessage("FAQ item deleted.");
      if (editingId === id) {
        resetForm();
      }
      await refreshFaq();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete FAQ item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="card">
      <h2>{editingId ? "Edit FAQ Item" : "Create FAQ Item"}</h2>
      <form className="form-grid" onSubmit={saveFaq}>
        <div className="full">
          <label htmlFor="faq-question">Question</label>
          <input
            id="faq-question"
            value={form.question}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, question: event.target.value }))
            }
            required
          />
        </div>
        <div className="full">
          <label htmlFor="faq-answer">Answer</label>
          <textarea
            id="faq-answer"
            value={form.answer}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, answer: event.target.value }))
            }
            required
          />
        </div>
        <div>
          <label htmlFor="faq-category">Category</label>
          <input
            id="faq-category"
            value={form.category}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, category: event.target.value }))
            }
            required
          />
        </div>
        <div>
          <label htmlFor="faq-order">Display Order</label>
          <input
            id="faq-order"
            type="number"
            value={form.displayOrder}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, displayOrder: event.target.value }))
            }
            required
          />
        </div>
        <div>
          <label htmlFor="faq-published">Published</label>
          <select
            id="faq-published"
            value={form.isPublished ? "true" : "false"}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                isPublished: event.target.value === "true"
              }))
            }
          >
            <option value="true">Published</option>
            <option value="false">Hidden</option>
          </select>
        </div>
        <div className="full actions">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update FAQ Item" : "Create FAQ Item"}
          </button>
          {editingId ? (
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
              <th>Question</th>
              <th>Category</th>
              <th>Order</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.question}</td>
                <td>{item.category}</td>
                <td>{item.displayOrder}</td>
                <td>{item.isPublished ? "Yes" : "No"}</td>
                <td>
                  <div className="actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => beginEdit(item)}
                      disabled={saving}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => deleteFaq(item.id)}
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
