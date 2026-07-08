"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatCartPrice } from "@/lib/cart";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const amountParam = searchParams.get("amount");
  const amount = amountParam ? parseFloat(amountParam) : NaN;

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
        <svg
          className="h-10 w-10 text-emerald-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="font-display mt-6 text-3xl font-semibold text-brown-dark md:text-4xl">
        Payment done successfully
      </h1>
      <p className="mt-4 leading-relaxed text-text-muted">
        Thank you! Your payment proof has been submitted. We&apos;ll verify it and confirm your order
        shortly. You&apos;ll receive an email with your product details once approved.
      </p>

      {(orderId || Number.isFinite(amount)) && (
        <div className="mt-8 rounded-2xl border border-sand bg-white p-6 text-left luxury-shadow">
          {orderId && (
            <p className="text-sm text-text-muted">
              Order ID: <span className="font-medium text-brown-dark">{orderId}</span>
            </p>
          )}
          {Number.isFinite(amount) && amount > 0 && (
            <p className={`text-sm text-text-muted ${orderId ? "mt-2" : ""}`}>
              Amount paid:{" "}
              <span className="font-medium text-brown-dark">
                {formatCartPrice(amount, "INR")}
              </span>
            </p>
          )}
          {orderId && (
            <a
              href={`/api/orders/${encodeURIComponent(orderId)}/receipt`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brown transition hover:text-brown-dark"
            >
              Download payment receipt (PDF) →
            </a>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="rounded-full bg-brown-dark px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-brown"
        >
          Back to Home
        </Link>
        <Link
          href={orderId ? `/track?orderId=${encodeURIComponent(orderId)}` : "/track"}
          className="rounded-full border border-sand px-8 py-3.5 text-sm font-medium text-brown-dark transition hover:border-gold"
        >
          Track My Order
        </Link>
        <Link
          href="/#shop"
          className="rounded-full border border-sand px-8 py-3.5 text-sm font-medium text-brown-dark transition hover:border-gold"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="mx-auto px-5 pt-28 pb-16">
      <Suspense fallback={<p className="text-center text-text-muted">Loading…</p>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
