"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/admin-api";

type CourtOption = {
  id: string;
  name: string;
};

type PricingRuleRow = {
  id: string;
  name: string;
  appliesToCourtId: string | null;
  appliesToCourt: { id: string; name: string } | null;
  dayType: "weekday" | "weekend" | "any";
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  basePrice: number;
  currency: string;
  isActive: boolean;
  priority: number;
};

type PricingForm = {
  name: string;
  appliesToCourtId: string;
  dayType: "weekday" | "weekend" | "any";
  startTime: string;
  endTime: string;
  durationMinutes: string;
  basePrice: string;
  currency: string;
  isActive: boolean;
  priority: string;
};

const EMPTY_FORM: PricingForm = {
  name: "",
  appliesToCourtId: "",
  dayType: "any",
  startTime: "",
  endTime: "",
  durationMinutes: "",
  basePrice: "",
  currency: "AED",
  isActive: true,
  priority: "0"
};

function mapRule(rule: {
  id: string;
  name: string;
  appliesToCourtId: string | null;
  appliesToCourt?: { id: string; name: string } | null;
  dayType: "weekday" | "weekend" | "any";
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  basePrice: string | number;
  currency: string;
  isActive: boolean;
  priority: number;
}): PricingRuleRow {
  return {
    id: rule.id,
    name: rule.name,
    appliesToCourtId: rule.appliesToCourtId,
    appliesToCourt: rule.appliesToCourt ?? null,
    dayType: rule.dayType,
    startTime: rule.startTime,
    endTime: rule.endTime,
    durationMinutes: rule.durationMinutes,
    basePrice: Number(rule.basePrice),
    currency: rule.currency,
    isActive: rule.isActive,
    priority: rule.priority
  };
}

function toForm(rule: PricingRuleRow): PricingForm {
  return {
    name: rule.name,
    appliesToCourtId: rule.appliesToCourtId ?? "",
    dayType: rule.dayType,
    startTime: rule.startTime ?? "",
    endTime: rule.endTime ?? "",
    durationMinutes: rule.durationMinutes ? String(rule.durationMinutes) : "",
    basePrice: String(rule.basePrice),
    currency: rule.currency,
    isActive: rule.isActive,
    priority: String(rule.priority)
  };
}

export function PricingManager({
  initialRules,
  courts
}: {
  initialRules: PricingRuleRow[];
  courts: CourtOption[];
}) {
  const router = useRouter();
  const [rules, setRules] = useState<PricingRuleRow[]>(initialRules);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [form, setForm] = useState<PricingForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshRules() {
    const data = await adminRequest<{
      pricing_rules: Array<{
        id: string;
        name: string;
        appliesToCourtId: string | null;
        appliesToCourt?: { id: string; name: string } | null;
        dayType: "weekday" | "weekend" | "any";
        startTime: string | null;
        endTime: string | null;
        durationMinutes: number | null;
        basePrice: string | number;
        currency: string;
        isActive: boolean;
        priority: number;
      }>;
    }>("/api/admin/pricing");
    setRules(data.pricing_rules.map(mapRule));
    router.refresh();
  }

  function beginEdit(rule: PricingRuleRow) {
    setEditingRuleId(rule.id);
    setForm(toForm(rule));
    setMessage(null);
    setError(null);
  }

  function resetForm() {
    setEditingRuleId(null);
    setForm(EMPTY_FORM);
  }

  async function saveRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        name: form.name,
        applies_to_court_id: form.appliesToCourtId || null,
        day_type: form.dayType,
        start_time: form.startTime || null,
        end_time: form.endTime || null,
        duration_minutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        base_price: Number(form.basePrice),
        currency: form.currency,
        is_active: form.isActive,
        priority: Number(form.priority || 0)
      };

      if (editingRuleId) {
        await adminRequest(`/api/admin/pricing/${editingRuleId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        setMessage("Pricing rule updated.");
      } else {
        await adminRequest("/api/admin/pricing", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setMessage("Pricing rule created.");
      }

      resetForm();
      await refreshRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save pricing rule");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRule(id: string) {
    if (!window.confirm("Delete this pricing rule?")) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await adminRequest(`/api/admin/pricing/${id}`, { method: "DELETE" });
      setMessage("Pricing rule deleted.");
      if (editingRuleId === id) {
        resetForm();
      }
      await refreshRules();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete pricing rule"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="card">
      <h2>{editingRuleId ? "Edit Pricing Rule" : "Create Pricing Rule"}</h2>
      <form className="form-grid" onSubmit={saveRule}>
        <div>
          <label htmlFor="pricing-name">Name</label>
          <input
            id="pricing-name"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            required
          />
        </div>
        <div>
          <label htmlFor="pricing-court">Court Scope</label>
          <select
            id="pricing-court"
            value={form.appliesToCourtId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, appliesToCourtId: event.target.value }))
            }
          >
            <option value="">Global (all courts)</option>
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pricing-day">Day Type</label>
          <select
            id="pricing-day"
            value={form.dayType}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                dayType: event.target.value as "weekday" | "weekend" | "any"
              }))
            }
          >
            <option value="any">Any</option>
            <option value="weekday">Weekday</option>
            <option value="weekend">Weekend</option>
          </select>
        </div>
        <div>
          <label htmlFor="pricing-duration">Duration (minutes)</label>
          <input
            id="pricing-duration"
            type="number"
            min={30}
            step={30}
            value={form.durationMinutes}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                durationMinutes: event.target.value
              }))
            }
            placeholder="Any"
          />
        </div>
        <div>
          <label htmlFor="pricing-start">Start Time</label>
          <input
            id="pricing-start"
            type="time"
            value={form.startTime}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, startTime: event.target.value }))
            }
          />
        </div>
        <div>
          <label htmlFor="pricing-end">End Time</label>
          <input
            id="pricing-end"
            type="time"
            value={form.endTime}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, endTime: event.target.value }))
            }
          />
        </div>
        <div>
          <label htmlFor="pricing-price">Base Price</label>
          <input
            id="pricing-price"
            type="number"
            min={0}
            step="0.01"
            value={form.basePrice}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, basePrice: event.target.value }))
            }
            required
          />
        </div>
        <div>
          <label htmlFor="pricing-currency">Currency</label>
          <input
            id="pricing-currency"
            value={form.currency}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, currency: event.target.value }))
            }
            required
          />
        </div>
        <div>
          <label htmlFor="pricing-priority">Priority</label>
          <input
            id="pricing-priority"
            type="number"
            value={form.priority}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, priority: event.target.value }))
            }
            required
          />
        </div>
        <div>
          <label htmlFor="pricing-active">Active</label>
          <select
            id="pricing-active"
            value={form.isActive ? "true" : "false"}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                isActive: event.target.value === "true"
              }))
            }
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div className="full actions">
          <button className="btn btn-primary" disabled={saving}>
            {saving
              ? "Saving..."
              : editingRuleId
                ? "Update Pricing Rule"
                : "Create Pricing Rule"}
          </button>
          {editingRuleId ? (
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
              <th>Name</th>
              <th>Court</th>
              <th>Day</th>
              <th>Window</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Priority</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td>{rule.name}</td>
                <td>{rule.appliesToCourt?.name ?? "Global"}</td>
                <td>{rule.dayType}</td>
                <td>
                  {rule.startTime && rule.endTime
                    ? `${rule.startTime} - ${rule.endTime}`
                    : "Any"}
                </td>
                <td>{rule.durationMinutes ?? "Any"}</td>
                <td>
                  {rule.basePrice} {rule.currency}
                </td>
                <td>{rule.priority}</td>
                <td>{rule.isActive ? "Yes" : "No"}</td>
                <td>
                  <div className="actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => beginEdit(rule)}
                      disabled={saving}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => deleteRule(rule.id)}
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
