"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminOrderActions({
  orderId,
  status,
  thankYouEmailSent,
  thankYouEmailError,
}: {
  orderId: string;
  status: string;
  thankYouEmailSent: boolean;
  thankYouEmailError?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | "resend" | null>(null);
  const [message, setMessage] = useState("");

  async function handleAction(action: "approve" | "reject" | "resend_email") {
    const confirmText =
      action === "approve"
        ? "Approve this payment and send thank-you email?"
        : action === "reject"
          ? "Reject this payment?"
          : "Resend thank-you email to the customer?";

    if (!confirm(confirmText)) return;

    setLoading(
      action === "approve" ? "approve" : action === "reject" ? "reject" : "resend"
    );
    setMessage("");

    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    const data = await res.json();
    setLoading(null);

    if (!res.ok) {
      setMessage(data.error || "Action failed");
      return;
    }

    if (action === "approve" || action === "resend_email") {
      if (data.emailSent) {
        setMessage(
          action === "approve"
            ? "Order approved and thank-you email sent!"
            : "Thank-you email sent successfully!"
        );
      } else {
        setMessage(
          `Order ${action === "approve" ? "approved" : "unchanged"}. Email failed: ${data.emailError || "Configure email settings."}`
        );
      }
    } else {
      setMessage("Order rejected.");
    }

    router.refresh();
  }

  if (status === "approved") {
    return (
      <div className="space-y-3">
        {thankYouEmailSent ? (
          <p className="text-sm text-emerald-700">
            This payment has been approved. Thank-you email was sent to the customer.
          </p>
        ) : (
          <p className="text-sm text-amber-800">
            Order approved, but the thank-you email was not sent.
            {thankYouEmailError ? ` ${thankYouEmailError}` : " Email is not configured."}
          </p>
        )}
        {!thankYouEmailSent && (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => handleAction("resend_email")}
            className="rounded-full bg-brown-dark px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown disabled:opacity-50"
          >
            {loading === "resend" ? "Sending…" : "Resend thank-you email"}
          </button>
        )}
        {message && <p className="text-sm text-brown-dark">{message}</p>}
      </div>
    );
  }

  if (status === "rejected") {
    return <p className="text-sm text-red-600">This payment was rejected.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => handleAction("approve")}
          className="rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading === "approve" ? "Approving…" : "Approve Payment"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => handleAction("reject")}
          className="rounded-full border border-red-200 px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-red-700 transition hover:bg-red-50 disabled:opacity-50"
        >
          {loading === "reject" ? "Rejecting…" : "Reject"}
        </button>
      </div>
      {message && <p className="text-sm text-brown-dark">{message}</p>}
      <p className="text-xs text-text-muted">
        Approving sends a thank-you email with product details and PDF receipt. On Railway use
        SendGrid (<code className="rounded bg-cream px-1">SENDGRID_API_KEY</code>); Gmail SMTP
        works on localhost only.
      </p>
    </div>
  );
}
