"use client";

import { useState } from "react";

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      subject: formData.get("subject"),
      message: formData.get("message")
    };

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to send message.");
      return;
    }

    setSuccess("Your message has been sent successfully.");
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="card">
      <h3>Send us a message</h3>
      <div className="form-grid">
        <div>
          <label htmlFor="contact-name">Name</label>
          <input id="contact-name" name="name" required />
        </div>

        <div>
          <label htmlFor="contact-email">Email</label>
          <input id="contact-email" name="email" type="email" required />
        </div>

        <div>
          <label htmlFor="contact-phone">Phone</label>
          <input id="contact-phone" name="phone" />
        </div>

        <div>
          <label htmlFor="contact-subject">Subject</label>
          <input id="contact-subject" name="subject" />
        </div>

        <div className="full">
          <label htmlFor="contact-message">Message</label>
          <textarea id="contact-message" name="message" required />
        </div>

        <div className="full actions">
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Sending..." : "Submit"}
          </button>
        </div>
      </div>

      {success ? <p style={{ color: "var(--success)" }}>{success}</p> : null}
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
    </form>
  );
}
