"use client";

import { useState } from "react";

export function ProfileForm({
  initial
}: {
  initial: {
    fullName: string;
    phone: string;
  };
}) {
  const [fullName, setFullName] = useState(initial.fullName);
  const [phone, setPhone] = useState(initial.phone);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        phone,
        password
      })
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Failed to update profile");
      return;
    }

    setPassword("");
    setMessage("Profile updated.");
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h3>Profile Settings</h3>
      <div className="form-grid">
        <div>
          <label htmlFor="profile-name">Full Name</label>
          <input id="profile-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="profile-phone">Phone</label>
          <input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div className="full">
          <label htmlFor="profile-password">New Password (optional)</label>
          <input
            id="profile-password"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="full actions">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
      {message ? <p style={{ color: "var(--success)" }}>{message}</p> : null}
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
    </form>
  );
}
