"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { ADMIN_SESSION_FLAG } from "@/components/AdminSessionGuard";

function LoginForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setError("Invalid password");
      setLoading(false);
      return;
    }

    try {
      sessionStorage.setItem(ADMIN_SESSION_FLAG, "1");
    } catch {
      // ignore
    }

    const from = searchParams.get("from") || "/admin";
    const target = from.startsWith("/admin") && from !== "/admin/login" ? from : "/admin";
    // Full navigation so the session flag is committed before the admin guard runs.
    window.location.assign(target);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-5">
      <div className="w-full max-w-md rounded-2xl border border-sand bg-white p-8 luxury-shadow-lg">
        <h1 className="font-display text-3xl font-semibold text-brown-dark">Admin Login</h1>
        <p className="mt-2 text-sm text-text-muted">Sign in to manage Zrochet store data.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-brown-dark">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm outline-none focus:border-gold"
              required
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brown-dark py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
