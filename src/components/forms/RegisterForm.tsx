"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      full_name: form.get("full_name"),
      email: form.get("email"),
      phone: form.get("phone"),
      password: form.get("password")
    };

    const registerRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!registerRes.ok) {
      const data = await registerRes.json().catch(() => ({}));
      setLoading(false);
      setError(data.error || "Registration failed");
      return;
    }

    const signInRes = await signIn("credentials", {
      email: String(payload.email || ""),
      password: String(payload.password || ""),
      redirect: false
    });

    setLoading(false);

    if (signInRes?.error) {
      setError("Account created, but auto-login failed. Please log in manually.");
      return;
    }

    router.push("/account");
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>Create Account</h2>
      <div className="form-grid">
        <div className="full">
          <label htmlFor="reg-name">Full Name</label>
          <input id="reg-name" name="full_name" required />
        </div>

        <div>
          <label htmlFor="reg-email">Email</label>
          <input id="reg-email" name="email" type="email" required />
        </div>

        <div>
          <label htmlFor="reg-phone">Phone</label>
          <input id="reg-phone" name="phone" required />
        </div>

        <div className="full">
          <label htmlFor="reg-password">Password</label>
          <input id="reg-password" name="password" type="password" minLength={8} required />
        </div>

        <div className="full actions">
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
          <Link href="/login" className="btn btn-ghost">
            I have an account
          </Link>
        </div>
      </div>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
    </form>
  );
}
