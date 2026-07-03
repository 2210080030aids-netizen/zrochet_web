"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminOrderActions({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [message, setMessage] = useState("");

  async function handleAction(action: "approve" | "reject") {
    if (!confirm(action === "approve" ? "Approve this payment and send thank-you email?" : "Reject this payment?")) {
      return;
    }

    setLoading(action);
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

    if (action === "approve") {
      setMessage(
        data.emailSent
          ? "Order approved and thank-you email sent!"
          : "Order approved. Email not sent — configure SMTP in Railway variables."
      );
    } else {
      setMessage("Order rejected.");
    }

    router.refresh();
  }

  if (status === "approved") {
    return (
      <p className="text-sm text-emerald-700">
        This payment has been approved. Thank-you email was sent to the customer.
      </p>
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
        Approving sends a thank-you email with the PDF receipt attached (requires SMTP settings).
      </p>
    </div>
  );
}
