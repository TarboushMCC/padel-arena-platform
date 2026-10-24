"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    const result = await signIn("credentials", {
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      redirect: false,
      callbackUrl
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid credentials");
      return;
    }

    router.push(result?.url || callbackUrl);
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>Login</h2>
      <div className="form-grid">
        <div className="full">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" name="email" type="email" required />
        </div>

        <div className="full">
          <label htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password" required />
        </div>

        <div className="full actions">
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>
      {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
    </form>
  );
}
