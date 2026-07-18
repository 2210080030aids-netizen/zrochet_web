"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { handleAdminUnauthorized } from "@/components/AdminSessionGuard";
import {
  formatTrackingDate,
  isStageCompleted,
  type FulfillmentStage,
  type OrderTrackingState,
} from "@/lib/order-tracking";

interface AdminOrderTrackingProps extends OrderTrackingState {
  orderId: string;
}

const STAGE_LABELS: Record<FulfillmentStage, string> = {
  reviewed: "Reviewed",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default function AdminOrderTracking({
  orderId,
  reviewedAt,
  shippedAt,
  deliveredAt,
  deliveryPartner,
  trackingId,
}: AdminOrderTrackingProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<FulfillmentStage | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [partner, setPartner] = useState(deliveryPartner ?? "");
  const [tracking, setTracking] = useState(trackingId ?? "");

  const trackingState: OrderTrackingState = {
    reviewedAt,
    shippedAt,
    deliveredAt,
    deliveryPartner,
    trackingId,
  };

  async function updateStage(stage: FulfillmentStage, completed: boolean) {
    setLoading(stage);
    setMessage("");
    setError("");

    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_tracking",
        stage,
        completed,
        deliveryPartner: partner,
        trackingId: tracking,
      }),
    });

    if (res.status === 401) {
      await handleAdminUnauthorized();
      return;
    }

    const data = await res.json();
    setLoading(null);

    if (!res.ok) {
      setError(data.error || "Failed to update tracking");
      return;
    }

    setMessage(
      completed
        ? stage === "shipped" || stage === "delivered"
          ? data.emailSent
            ? `${STAGE_LABELS[stage]} marked as completed and customer notified by email.`
            : `${STAGE_LABELS[stage]} marked as completed. Email failed: ${data.emailError || "Configure email settings."}`
          : `${STAGE_LABELS[stage]} marked as completed.`
        : `${STAGE_LABELS[stage]} marked as incomplete.`
    );
    router.refresh();
  }

  function renderStage(stage: FulfillmentStage) {
    const completed = isStageCompleted(trackingState, stage);
    const reviewedDone = isStageCompleted(trackingState, "reviewed");
    const shippedDone = isStageCompleted(trackingState, "shipped");
    const disabled =
      stage === "shipped"
        ? !reviewedDone
        : stage === "delivered"
          ? !shippedDone
          : false;

    const timestamp =
      stage === "reviewed"
        ? reviewedAt
        : stage === "shipped"
          ? shippedAt
          : deliveredAt;

    return (
      <div
        key={stage}
        className={`rounded-xl border px-4 py-4 ${
          completed ? "border-emerald-200 bg-emerald-50/40" : "border-sand bg-cream/20"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium text-brown-dark">{STAGE_LABELS[stage]}</p>
            {completed && timestamp && (
              <p className="mt-1 text-xs text-emerald-800">
                Completed {formatTrackingDate(timestamp)}
              </p>
            )}
            {!completed && disabled && (
              <p className="mt-1 text-xs text-text-muted">Complete the previous stage first.</p>
            )}
          </div>
          <button
            type="button"
            disabled={disabled || loading !== null}
            onClick={() => updateStage(stage, !completed)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-50 ${
              completed
                ? "border border-sand bg-white text-brown-dark hover:bg-cream"
                : "bg-brown-dark text-white hover:bg-brown"
            }`}
          >
            {loading === stage
              ? "Saving…"
              : completed
                ? "Mark incomplete"
                : "Mark completed"}
          </button>
        </div>

        {stage === "shipped" && reviewedDone && !completed && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="delivery-partner" className="block text-xs font-medium text-text-muted">
                Delivery Partner Name *
              </label>
              <input
                id="delivery-partner"
                type="text"
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                placeholder="e.g. Delhivery, Blue Dart"
                className="mt-1 w-full rounded-xl border border-sand bg-white px-3 py-2 text-sm text-brown-dark placeholder:text-text-muted focus:border-brown focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="tracking-id" className="block text-xs font-medium text-text-muted">
                Tracking ID / AWB Number *
              </label>
              <input
                id="tracking-id"
                type="text"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="Enter tracking or AWB number"
                className="mt-1 w-full rounded-xl border border-sand bg-white px-3 py-2 text-sm text-brown-dark placeholder:text-text-muted focus:border-brown focus:outline-none"
              />
            </div>
          </div>
        )}

        {stage === "shipped" && completed && (
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-muted">Delivery partner</dt>
              <dd className="font-medium text-brown-dark">{deliveryPartner}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Tracking ID</dt>
              <dd className="font-medium text-brown-dark">{trackingId}</dd>
            </div>
          </dl>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {renderStage("reviewed")}
      {renderStage("shipped")}
      {renderStage("delivered")}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
