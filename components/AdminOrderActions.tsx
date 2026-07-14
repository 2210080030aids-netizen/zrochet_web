"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { REJECTION_REASONS, REJECTION_REASON_OTHER } from "@/lib/rejection-reasons";

export default function AdminOrderActions({
  orderId,
  status,
  thankYouEmailSent,
  thankYouEmailError,
  rejectionReason,
  rejectionEmailSent,
  rejectionEmailError,
}: {
  orderId: string;
  status: string;
  thankYouEmailSent: boolean;
  thankYouEmailError?: string | null;
  rejectionReason?: string | null;
  rejectionEmailSent?: boolean;
  rejectionEmailError?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | "resend" | null>(null);
  const [message, setMessage] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  async function handleAction(action: "approve" | "resend_email") {
    const confirmText =
      action === "approve"
        ? "Approve this payment and send thank-you email?"
        : "Resend thank-you email to the customer?";

    if (!confirm(confirmText)) return;

    setLoading(action === "approve" ? "approve" : "resend");
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

    router.refresh();
  }

  function openRejectModal() {
    setSelectedReason("");
    setCustomReason("");
    setMessage("");
    setShowRejectModal(true);
  }

  function closeRejectModal() {
    if (loading === "reject") return;
    setShowRejectModal(false);
  }

  function getRejectionReasonText(): string {
    if (selectedReason === REJECTION_REASON_OTHER) {
      return customReason.trim();
    }
    return selectedReason;
  }

  async function handleReject() {
    const reason = getRejectionReasonText();
    if (!selectedReason) {
      setMessage("Please select a rejection reason.");
      return;
    }
    if (selectedReason === REJECTION_REASON_OTHER && !reason) {
      setMessage("Please enter a custom rejection reason.");
      return;
    }

    setLoading("reject");
    setMessage("");

    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", reason }),
    });

    const data = await res.json();
    setLoading(null);

    if (!res.ok) {
      setMessage(data.error || "Rejection failed");
      return;
    }

    setShowRejectModal(false);

    if (data.emailSent) {
      setMessage("Payment rejected and notification email sent to the customer.");
    } else {
      setMessage(
        `Payment rejected. Email failed: ${data.emailError || "Configure email settings."}`
      );
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
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">This payment was rejected.</p>
        {rejectionReason && (
          <p className="text-sm text-brown-dark">
            <span className="font-medium">Reason:</span> {rejectionReason}
          </p>
        )}
        {rejectionEmailSent ? (
          <p className="text-sm text-emerald-700">
            Rejection notification email was sent to the customer.
          </p>
        ) : (
          <p className="text-sm text-amber-800">
            Rejection notification email was not sent.
            {rejectionEmailError ? ` ${rejectionEmailError}` : " Email is not configured."}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
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
            onClick={openRejectModal}
            className="rounded-full border border-red-200 px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-red-700 transition hover:bg-red-50 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
        {message && <p className="text-sm text-brown-dark">{message}</p>}
        <p className="text-xs text-text-muted">
          Approving sends a thank-you email with product details and the new invoice PDF. Rejecting sends a
          notification email asking the customer to resubmit payment proof. On Railway use SendGrid (
          <code className="rounded bg-cream px-1">SENDGRID_API_KEY</code>); Gmail SMTP works on
          localhost only.
        </p>
      </div>

      {showRejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brown-dark/40 p-4"
          onClick={closeRejectModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-sand bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl font-semibold text-brown-dark">Reject payment</h3>
            <p className="mt-2 text-sm text-text-muted">
              Select a reason. The customer will receive an email explaining why their payment could
              not be verified.
            </p>

            <fieldset className="mt-5 space-y-2">
              <legend className="sr-only">Rejection reason</legend>
              {REJECTION_REASONS.map((reason) => (
                <label
                  key={reason}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-sand px-4 py-3 text-sm transition hover:bg-cream/50 has-[:checked]:border-red-200 has-[:checked]:bg-red-50/50"
                >
                  <input
                    type="radio"
                    name="rejection-reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="mt-0.5"
                  />
                  <span className="text-brown-dark">{reason}</span>
                </label>
              ))}
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sand px-4 py-3 text-sm transition hover:bg-cream/50 has-[:checked]:border-red-200 has-[:checked]:bg-red-50/50">
                <input
                  type="radio"
                  name="rejection-reason"
                  value={REJECTION_REASON_OTHER}
                  checked={selectedReason === REJECTION_REASON_OTHER}
                  onChange={() => setSelectedReason(REJECTION_REASON_OTHER)}
                  className="mt-0.5"
                />
                <span className="text-brown-dark">{REJECTION_REASON_OTHER}</span>
              </label>
            </fieldset>

            {selectedReason === REJECTION_REASON_OTHER && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter the rejection reason…"
                rows={3}
                className="mt-3 w-full rounded-xl border border-sand bg-cream/30 px-4 py-3 text-sm text-brown-dark placeholder:text-text-muted focus:border-brown focus:outline-none"
              />
            )}

            {message && showRejectModal && (
              <p className="mt-3 text-sm text-red-600">{message}</p>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={loading === "reject"}
                onClick={closeRejectModal}
                className="rounded-full border border-sand px-5 py-2.5 text-sm font-medium text-brown-dark transition hover:bg-cream disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading === "reject"}
                onClick={handleReject}
                className="rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-red-800 disabled:opacity-50"
              >
                {loading === "reject" ? "Rejecting…" : "Confirm rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
