"use client";

import { useEffect, useState } from "react";

interface EmailStatus {
  configured: boolean;
  provider: "sendgrid" | "resend" | "smtp" | null;
  hint: string;
  smtpHost?: string;
  smtpUser?: string;
  smtpPort?: string;
  runtime?: string;
  railwaySmtpBlocked?: boolean;
}

export default function AdminEmailTestPanel() {
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [testTo, setTestTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/email-test")
      .then((r) => r.json())
      .then((data) => setStatus(data));
  }, []);

  async function sendTest() {
    if (!testTo.trim()) return;
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/admin/email-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: testTo.trim() }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.sent) {
      setMessage(`Test email sent to ${testTo}. Check inbox and spam.`);
    } else {
      setMessage(data.error || "Test email failed.");
    }
  }

  return (
    <div className="mt-10 max-w-2xl rounded-2xl border border-sand bg-white p-6">
      <h2 className="font-display text-xl font-semibold text-brown-dark">Check email</h2>
      <p className="mt-2 text-sm text-text-muted">
        Thank-you emails send when you approve an order. Gmail SMTP works on localhost only —
        Railway requires SendGrid (free).
      </p>

      {status?.railwaySmtpBlocked && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Railway blocks Gmail SMTP.</strong> Add{" "}
          <code className="rounded bg-white px-1">SENDGRID_API_KEY</code> in Railway Variables.
          See steps below.
        </div>
      )}

      {status && (
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-text-muted">Runtime:</dt>
            <dd className="font-medium capitalize">{status.runtime || "unknown"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-text-muted">Status:</dt>
            <dd
              className={
                status.configured ? "font-medium text-emerald-700" : "font-medium text-amber-800"
              }
            >
              {status.configured ? `Configured (${status.provider})` : "Not configured"}
            </dd>
          </div>
          {status.smtpHost && (
            <>
              <div className="flex gap-2">
                <dt className="text-text-muted">SMTP host:</dt>
                <dd>{status.smtpHost}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-text-muted">SMTP user:</dt>
                <dd>{status.smtpUser}</dd>
              </div>
            </>
          )}
          {!status.configured && <dd className="text-amber-800">{status.hint}</dd>}
        </dl>
      )}

      <div className="mt-6 rounded-xl bg-beige/50 px-4 py-3 text-xs leading-relaxed text-brown-dark">
        <p className="font-semibold">SendGrid setup (Railway production):</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>
            Sign up at{" "}
            <a href="https://sendgrid.com" className="text-brown underline" target="_blank" rel="noreferrer">
              sendgrid.com
            </a>{" "}
            (free)
          </li>
          <li>Settings → API Keys → Create API Key</li>
          <li>
            Settings → Sender Authentication → Verify Single Sender →{" "}
            <strong>2210080030aids@gmail.com</strong>
          </li>
          <li>
            Railway Variables: <code>SENDGRID_API_KEY</code>,{" "}
            <code>SENDGRID_FROM=Zrochet &lt;2210080030aids@gmail.com&gt;</code>
          </li>
          <li>Redeploy Railway</li>
        </ol>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm font-medium text-brown-dark">
          Send test email to
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="customer@example.com"
            className="mt-2 w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={loading || !testTo.trim()}
          onClick={sendTest}
          className="rounded-full bg-brown-dark px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send test"}
        </button>
      </div>
      {message && <p className="mt-4 text-sm text-brown-dark">{message}</p>}
    </div>
  );
}
