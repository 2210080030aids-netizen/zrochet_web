"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { formatCartPrice } from "@/lib/cart";
import OrderTrackingProgress from "@/components/OrderTrackingProgress";

interface TrackingResult {
  orderId: string;
  status: string;
  subtotal: number;
  currency: string;
  items: { name: string; quantity: number }[];
  reviewedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  deliveryPartner: string | null;
  trackingId: string | null;
}

export default function TrackOrderPageContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("orderId") ?? "");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const params = new URLSearchParams({
      email: email.trim(),
    });

    const res = await fetch(
      `/api/orders/${encodeURIComponent(orderId.trim())}/tracking?${params.toString()}`
    );
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Could not find your order.");
      return;
    }

    setResult(data.tracking);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-gold">Order updates</p>
        <h1 className="font-display mt-3 text-3xl font-semibold text-brown-dark md:text-4xl">
          Track My Order
        </h1>
        <p className="mt-4 text-text-muted">
          Enter your order ID and email to see the latest delivery progress.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-2xl border border-sand bg-white p-6 luxury-shadow"
      >
        <div className="grid gap-4">
          <div>
            <label htmlFor="track-order-id" className="block text-sm font-medium text-brown-dark">
              Order ID
            </label>
            <input
              id="track-order-id"
              type="text"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Paste your order ID"
              className="mt-1 w-full rounded-xl border border-sand bg-cream/30 px-4 py-3 text-sm text-brown-dark placeholder:text-text-muted focus:border-brown focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="track-email" className="block text-sm font-medium text-brown-dark">
              Email address
            </label>
            <input
              id="track-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email used at checkout"
              className="mt-1 w-full rounded-xl border border-sand bg-cream/30 px-4 py-3 text-sm text-brown-dark placeholder:text-text-muted focus:border-brown focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-brown-dark py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown disabled:opacity-50"
        >
          {loading ? "Looking up order…" : "Track order"}
        </button>
      </form>

      {result && (
        <div className="mt-8 rounded-2xl border border-sand bg-white p-6 luxury-shadow">
          <div className="mb-6 text-center">
            <p className="text-sm text-text-muted">Order total</p>
            <p className="font-display mt-1 text-2xl font-semibold text-brown-dark">
              {formatCartPrice(result.subtotal, result.currency)}
            </p>
          </div>

          <OrderTrackingProgress
            orderId={result.orderId}
            reviewedAt={result.reviewedAt}
            shippedAt={result.shippedAt}
            deliveredAt={result.deliveredAt}
            deliveryPartner={result.deliveryPartner}
            trackingId={result.trackingId}
          />

          {result.items.length > 0 && (
            <div className="mt-8 border-t border-sand pt-6">
              <h2 className="font-display text-lg font-semibold text-brown-dark">Items</h2>
              <ul className="mt-3 space-y-2 text-sm text-brown-dark">
                {result.items.map((item) => (
                  <li key={`${item.name}-${item.quantity}`}>
                    {item.name} × {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
