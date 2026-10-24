"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "@/components/admin/admin-api";

type SiteSettingRow = {
  id: string;
  key: string;
  value: unknown;
};

function toEditorValue(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function SettingsManager({
  initialSettings
}: {
  initialSettings: SiteSettingRow[];
}) {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettingRow[]>(initialSettings);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialSettings.map((item) => [item.key, toEditorValue(item.value)]))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedSettings = useMemo(
    () => [...settings].sort((a, b) => a.key.localeCompare(b.key)),
    [settings]
  );

  async function refreshSettings() {
    const data = await adminRequest<{ settings: SiteSettingRow[] }>(
      "/api/admin/settings"
    );
    setSettings(data.settings);
    setDrafts(
      Object.fromEntries(
        data.settings.map((item) => [item.key, toEditorValue(item.value)])
      )
    );
    router.refresh();
  }

  function parseDraft(key: string): unknown {
    const raw = drafts[key] ?? "";
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON for key "${key}"`);
    }
  }

  async function saveKeys(keys: string[]) {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload = keys.map((key) => ({ key, value: parseDraft(key) }));
      await adminRequest<{ settings: SiteSettingRow[] }>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ settings: payload })
      });
      setMessage(keys.length === 1 ? `Saved "${keys[0]}".` : "Settings saved.");
      await refreshSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="card">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Site Settings</h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void saveKeys(sortedSettings.map((item) => item.key))}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>

      {message ? <p style={{ color: "var(--success)" }}>{message}</p> : null}
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

      <div className="grid">
        {sortedSettings.map((setting) => (
          <div key={setting.id} className="card">
            <div className="actions" style={{ justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>{setting.key}</h3>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void saveKeys([setting.key])}
                disabled={saving}
              >
                Save
              </button>
            </div>
            <textarea
              value={drafts[setting.key] ?? ""}
              onChange={(event) =>
                setDrafts((prev) => ({
                  ...prev,
                  [setting.key]: event.target.value
                }))
              }
              style={{ minHeight: "160px" }}
            />
          </div>
        ))}
      </div>
    </article>
  );
}
